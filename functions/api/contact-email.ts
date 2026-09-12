const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const TURNSTILE_ACTION = 'contact_email_reveal';

interface Environment {
  CONTACT_EMAIL?: string;
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_SITE_KEY?: string;
}

interface RuntimeEnvironment extends Environment {
  CONTACT_EMAIL: string;
  TURNSTILE_SECRET_KEY: string;
  TURNSTILE_SITE_KEY: string;
}

interface FunctionContext {
  env: Environment;
  request: Request;
}

interface TurnstileResult {
  action?: string;
  hostname?: string;
  success?: boolean;
}

interface TokenPayload {
  token?: string;
}

type JsonResponseBody = { email: string } | { error: string } | { siteKey: string };

type VerificationResult = 'failed' | 'unavailable' | 'verified';

function json(body: JsonResponseBody, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      'Cache-Control': 'no-store, private',
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
    status,
  });
}

function hasRuntimeConfiguration(env: Environment): env is RuntimeEnvironment {
  return Boolean(env.CONTACT_EMAIL && env.TURNSTILE_SECRET_KEY && env.TURNSTILE_SITE_KEY);
}

async function verifyTurnstile(
  token: string,
  secret: string,
  remoteIp: string,
  expectedHostname: string
): Promise<VerificationResult> {
  const formData = new FormData();
  formData.set('secret', secret);
  formData.set('response', token);
  formData.set('remoteip', remoteIp);

  let response: Response;

  try {
    response = await fetch(TURNSTILE_VERIFY_URL, {
      body: formData,
      method: 'POST',
    });
  } catch {
    return 'unavailable';
  }

  if (!response.ok) {
    return 'unavailable';
  }

  let result: TurnstileResult;

  try {
    result = await response.json();
  } catch {
    return 'unavailable';
  }

  if (result.success !== true || result.action !== TURNSTILE_ACTION || result.hostname !== expectedHostname) {
    return 'failed';
  }

  return 'verified';
}

export async function onRequestGet(context: FunctionContext): Promise<Response> {
  const { env } = context;

  if (!hasRuntimeConfiguration(env)) {
    return json({ error: 'unavailable' }, 503);
  }

  return json({ siteKey: env.TURNSTILE_SITE_KEY });
}

export async function onRequestPost(context: FunctionContext): Promise<Response> {
  const { env, request } = context;

  if (!hasRuntimeConfiguration(env)) {
    return json({ error: 'unavailable' }, 503);
  }

  const requestUrl = new URL(request.url);
  const origin = request.headers.get('Origin');

  if (origin !== requestUrl.origin) {
    return json({ error: 'forbidden' }, 403);
  }

  const contentType = request.headers.get('Content-Type') ?? '';

  if (!contentType.toLowerCase().startsWith('application/json')) {
    return json({ error: 'unsupported_media_type' }, 415);
  }

  const remoteIp = request.headers.get('CF-Connecting-IP');

  if (!remoteIp) {
    return json({ error: 'invalid_request' }, 400);
  }

  let token: string;

  try {
    const payload: TokenPayload = await request.json();
    token = payload.token?.trim() ?? '';
  } catch {
    return json({ error: 'invalid_request' }, 400);
  }

  if (token.length === 0 || token.length > 2048) {
    return json({ error: 'invalid_request' }, 400);
  }

  const verification = await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY, remoteIp, requestUrl.hostname);

  if (verification === 'unavailable') {
    return json({ error: 'unavailable' }, 503);
  }

  if (verification !== 'verified') {
    return json({ error: 'verification_failed' }, 403);
  }

  return json({ email: env.CONTACT_EMAIL });
}
