import { afterEach, describe, expect, it, vi } from 'vitest';

import { onRequestGet, onRequestPost } from '../../functions/api/contact-email';

interface TurnstileTestResult {
  action: string;
  hostname: string;
  success: boolean;
}

const baseEnvironment = {
  CONTACT_EMAIL: 'person@example.test',
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

function mockTurnstile(result: TurnstileTestResult, status = 200): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status,
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

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await onRequestPost({ env: baseEnvironment, request });

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects requests without the Cloudflare connecting IP before validation', async () => {
    const request = createPostRequest();
    request.headers.delete('CF-Connecting-IP');

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await onRequestPost({ env: baseEnvironment, request });

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON before validation', async () => {
    const request = new Request('https://schultstefan.de/api/contact-email', {
      body: '{',
      headers: {
        'CF-Connecting-IP': '203.0.113.10',
        'Content-Type': 'application/json',
        Origin: 'https://schultstefan.de',
      },
      method: 'POST',
    });

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await onRequestPost({ env: baseEnvironment, request });

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a Turnstile result for another hostname', async () => {
    mockTurnstile({
      action: 'contact_email_reveal',
      hostname: 'example.test',
      success: true,
    });

    const response = await onRequestPost({
      env: baseEnvironment,
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
      env: baseEnvironment,
      request: createPostRequest(),
    });

    expect(response.status).toBe(403);
  });

  it('fails closed when Turnstile validation is unavailable', async () => {
    mockTurnstile(
      {
        action: 'contact_email_reveal',
        hostname: 'schultstefan.de',
        success: false,
      },
      503
    );

    const response = await onRequestPost({
      env: baseEnvironment,
      request: createPostRequest(),
    });

    expect(response.status).toBe(503);
  });

  it('returns the configured email only after successful validation', async () => {
    mockTurnstile({
      action: 'contact_email_reveal',
      hostname: 'schultstefan.de',
      success: true,
    });

    const response = await onRequestPost({
      env: baseEnvironment,
      request: createPostRequest(),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    expect(await response.json()).toEqual({ email: 'person@example.test' });
  });
});
