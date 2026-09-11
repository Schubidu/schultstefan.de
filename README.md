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

## Background photos

The website only reads the committed registry under `src/unsplash-images`. Normal development, CI and production builds do not fetch from Unsplash.

The manual `Update photos` GitHub Actions workflow refreshes the first 25 photos from the configured Unsplash collection using `UNSPLASH_APP_SECRET`, runs the quality gate and commits registry changes when necessary.

In the browser, seen photo IDs are remembered locally so shuffle cycles through unseen photos before starting a new round. IDs that disappear from a later registry refresh are simply ignored.

## Dependency policy

The repository keeps automated Dependabot updates, but normal dependency resolution uses a seven-day minimum release age. Urgent security fixes may use an explicit, reviewed exception rather than silently weakening the default policy.

## Anti-slop

The anti-slop Oxlint plugin is vendored under `tools/oxlint/anti-slop` from a pinned upstream commit. Rules start enabled. Permanent rule disables are project decisions and should be documented centrally rather than added merely to make CI green.
