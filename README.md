# schultstefan.de

Minimal personal homepage and contact card for Stefan Schult.

The site intentionally stays small: static HTML/CSS, vanilla TypeScript, Vite, randomly selected photography and a few playful visual details.

## Development

Use the Node.js version from `.nvmrc` and install dependencies with npm.

```sh
npm ci
npm run dev
```

The canonical local quality gate is:

```sh
npm run check
```

It runs formatting checks, Oxlint with the vendored anti-slop rules, TypeScript checks, Vitest and the production build.

## Protected email reveal

`/card` reveals the contact email only after server-side Cloudflare Turnstile validation. The address is never committed to the repository or embedded in static client output.

The Cloudflare Pages project requires these runtime values for both production and preview deployments:

- `CONTACT_EMAIL` as a secret;
- `TURNSTILE_SECRET_KEY` as a secret;
- `TURNSTILE_SITE_KEY` as an environment variable.

Create the Turnstile widget with `schultstefan.de` and `schultstefan-de.pages.dev` as allowed hostnames. The latter also covers Pages preview subdomains. The endpoint validates the Turnstile action and the exact request hostname before returning the configured address.

### Rate limiting

Protect the production endpoint with a Cloudflare zone-level WAF rate limiting rule instead of implementing a counter in application storage. This keeps rate limiting in Cloudflare's request layer and avoids relying on eventually consistent KV reads and writes as a lock.

For a Free-plan baseline, create one rate limiting rule with:

- path equal to `/api/contact-email`;
- counting characteristic: IP;
- 10 requests per 10 seconds;
- Block for 10 seconds.

Free-plan rate limiting expressions expose the request path but not the HTTP method, so both the configuration GET and reveal POST count toward the same budget. This is intentional. Preview deployments on `*.pages.dev` are still protected by Turnstile, while the zone rule protects the production custom domain.

## Photos

The current Unsplash photo registry is committed under `src/unsplash-images`, so normal development and production builds do not depend on the Unsplash API.

Run the manual `Update photos` GitHub Actions workflow to refresh the registry. The workflow asks for an Unsplash collection ID and defaults to the current architectural collection (`827751`), so switching collections does not require a code change.

## Dependency policy

The repository keeps automated Dependabot updates, but normal dependency resolution uses a seven-day minimum release age. Urgent security fixes may use an explicit, reviewed exception rather than silently weakening the default policy.

## Anti-slop

The anti-slop Oxlint plugin is vendored under `tools/oxlint/anti-slop` from a pinned upstream commit. Rules start enabled. Permanent rule disables are project decisions and should be documented centrally rather than added merely to make CI green.
