import { defineConfig } from "@playwright/test";

/**
 * E2E runs against the static export (out/) the way GitHub Pages serves it, with beat audio + peaks coming from a
 * separate "R2" origin. Build first with the same media base:
 *   NEXT_PUBLIC_MEDIA_BASE=<base> npm run build
 *   NEXT_PUBLIC_MEDIA_BASE=<same base> PORT=<port allowed by the bucket's CORS> npx playwright test
 * With a localhost base, MEDIA_DIR (<folder with media/beat-*>) is served on MEDIA_PORT.
 */
const PORT = Number(process.env.PORT ?? 3200);
const MEDIA_PORT = Number(process.env.MEDIA_PORT ?? 3201);
const MEDIA_DIR = process.env.MEDIA_DIR ?? "../r2-upload";
/** Same base the export was built with. A localhost base gets a local static "R2" server; a real R2 URL is used as-is. */
const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_BASE ?? `http://localhost:${MEDIA_PORT}`;
const localMedia = /^http:\/\/localhost:/.test(MEDIA_BASE);

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  workers: 4,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Full Chromium (headless-shell lacks EME, which the Spotify embed needs).
    channel: "chromium",
    contextOptions: { reducedMotion: "reduce" },
  },
  projects: [
    { name: "mobile-390", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: "desktop-1280", use: { viewport: { width: 1280, height: 800 } } },
  ],
  webServer: [
    // python's static server behaves like Pages for directories: /music → 301 /music/ → index.html
    { command: `python3 -m http.server ${PORT} --bind 127.0.0.1 --directory out`, url: `http://localhost:${PORT}/`, reuseExistingServer: true, timeout: 60_000 },
    ...(localMedia
      ? [{ command: `npx --yes serve@14 --cors -l ${MEDIA_PORT} ${MEDIA_DIR}`, url: `http://localhost:${MEDIA_PORT}/media/beat-deserts/peaks.json`, reuseExistingServer: true, timeout: 120_000 }]
      : []),
  ],
});
