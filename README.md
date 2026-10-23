# Flavorful Music

Source for [flavorfulmusic.com](https://flavorfulmusic.com): a San Diego artist collective disguised as a record label.
EDM, hip-hop and production. Make art with friends.

Next.js 15 (App Router, TypeScript, Tailwind CSS 4), exported as a static site and hosted on GitHub Pages.

## Develop

```bash
npm ci
npm run dev          # http://localhost:3000
npm run lint && npm run typecheck && npm test
```

## Build

```bash
NEXT_PUBLIC_MEDIA_BASE=https://media.flavorfulmusic.com npm run build   # static site in out/
```

- `output: "export"`, `trailingSlash: true`, unoptimized images. Custom domain via `public/CNAME`, so no base path
  (set `NEXT_PUBLIC_BASE_PATH` only if the site is ever served from a sub-path).
- **Beat audio** (320 kbps MP3) and its waveform `peaks.json` are not in this repo. They are served from
  `NEXT_PUBLIC_MEDIA_BASE` (a Cloudflare R2 public bucket) under the same keys the site uses:
  `media/beat-<id>/audio.mp3` and `media/beat-<id>/peaks.json`. Unset in local dev = `public/media/`.
  `npm run stage:r2` collects exactly those files into a staging folder for upload.
- **Lossless masters** (`.wav`, `.aif`, `.aiff`, `.flac`) are delivered only by the checkout provider after purchase.
  They are never committed or served: `scripts/check-no-wav.mjs` runs before every build and in the unit tests,
  and the Pages workflow fails if one appears.
- Contact is a `mailto:` link with a prefilled subject per inquiry type: hallo@flavorfulmusic.com (customer service) for most topics, ricky@flavorfulmusic.com for studio services and collabs (`src/lib/inquiry.ts`).
- Checkout is off: every buy button reads "Coming soon" and nothing links to a checkout provider. To switch it on,
  give each beat a `payhipUrl` (public `payhip.com/b/…` product page) in `content/beats.json` and build with
  `NEXT_PUBLIC_CHECKOUT_LIVE=1`; the MP3 and WAV lease buttons then open that Payhip product. Stems and Exclusive
  stay "Coming soon" until stems are delivered. `content/beats.json` may carry the URLs while the switch is off;
  nothing links to Payhip until the repo variable `NEXT_PUBLIC_CHECKOUT_LIVE` is `1`.

## Deploy

`.github/workflows/pages.yml` builds on push to `main` and deploys to GitHub Pages. It needs the repository variable
`NEXT_PUBLIC_MEDIA_BASE`, and Pages set to "GitHub Actions" as the source.

## E2E

```bash
NEXT_PUBLIC_MEDIA_BASE=http://localhost:3201 npm run build
MEDIA_DIR=<folder containing media/beat-*> npx playwright test   # serves out/ on :3200 and the media on :3201
```
