import { afterEach, describe, expect, it, vi } from 'vitest';

import { onRequestGet, onRequestPost } from './contact-email';

interface RateLimitStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options: { expirationTtl: number }): Promise<void>;
}

interface TurnstileTestResult {
  action: string;
  hostname: string;
  success: boolean;
}

class MemoryRateLimitStore implements RateLimitStore {
  readonly values = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  async put(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }
}

const baseEnvironment = {
  CONTACT_EMAIL: 'person@example.test',
  CONTACT_REVEAL_RATE_LIMIT: new MemoryRateLimitStore(),
  TURNSTILE_SECRET_KEY: 'test-secret',
  TURNSTILE_SITE_KEY: 'test-site-key',
};

function createPostRequest(token = 'valid-token'): Request {
  return new Request('https://schultstefan.de/api/contact-email', {
    body: JSON.stringify({ token }),
    headers: {
      'CF-Connecting-IP': '203.0.113.10',
      'Content-Type': 'application/json',
      Origin: 'https://schultstefan.de',
    },
    method: 'POST',
  });
}

function mockTurnstile(result: TurnstileTestResult): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('contact email reveal function', () => {
  it('returns only the public Turnstile site key from the configuration endpoint', async () => {
    const response = await onRequestGet({
      env: baseEnvironment,
      request: new Request('https://schultstefan.de/api/contact-email'),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ siteKey: 'test-site-key' });
  });

  it('fails closed when required runtime configuration is missing', async () => {
    const response = await onRequestGet({
      env: { TURNSTILE_SITE_KEY: 'test-site-key' },
      request: new Request('https://schultstefan.de/api/contact-email'),
    });

    expect(response.status).toBe(503);
  });

  it('rejects cross-origin reveal requests before validation', async () => {
    const request = createPostRequest();
    request.headers.set('Origin', 'https://example.test');

    const response = await onRequestPost({ env: baseEnvironment, request });

    expect(response.status).toBe(403);
  });

  it('rate limits before calling Turnstile', async () => {
    const store: RateLimitStore = {
      get: async () => '5',
      put: async () => undefined,
    };
    const fetchMock = mockTurnstile({
      action: 'contact_email_reveal',
      hostname: 'schultstefan.de',
      success: true,
    });

    const response = await onRequestPost({
      env: { ...baseEnvironment, CONTACT_REVEAL_RATE_LIMIT: store },
      request: createPostRequest(),
    });

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a Turnstile result for another hostname', async () => {
    mockTurnstile({
      action: 'contact_email_reveal',
      hostname: 'example.test',
      success: true,
    });

    const response = await onRequestPost({
      env: { ...baseEnvironment, CONTACT_REVEAL_RATE_LIMIT: new MemoryRateLimitStore() },
      request: createPostRequest(),
    });

    expect(response.status).toBe(403);
  });

  it('rejects a Turnstile result for another action', async () => {
    mockTurnstile({
      action: 'other_action',
      hostname: 'schultstefan.de',
      success: true,
    });

    const response = await onRequestPost({
      env: { ...baseEnvironment, CONTACT_REVEAL_RATE_LIMIT: new MemoryRateLimitStore() },
      request: createPostRequest(),
    });

    expect(response.status).toBe(403);
  });

  it('returns the configured email only after successful validation', async () => {
    mockTurnstile({
      action: 'contact_email_reveal',
      hostname: 'schultstefan.de',
      success: true,
    });

    const response = await onRequestPost({
      env: { ...baseEnvironment, CONTACT_REVEAL_RATE_LIMIT: new MemoryRateLimitStore() },
      request: createPostRequest(),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    expect(await response.json()).toEqual({ email: 'person@example.test' });
  });
});
