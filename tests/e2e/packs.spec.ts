import { expect, test } from "@playwright/test";
import { publicMusicVisible } from "../../src/lib/public-visibility";
const MUSIC = publicMusicVisible();

/** Producers card (home, under Beats) → the sample pack library. No prices, no checkout until sales are approved. */
test("home: Producers card sits under Beats and links to the sample pack library", async ({ page }) => {
  test.skip(!MUSIC, "public music is hidden; Producers sits beside Merch instead");
  await page.goto("/");
  const merch = page.locator("#shop a[data-home-merch]");
  const beats = page.locator("#shop a[data-home-beats]");
  const producers = page.locator("#shop a[data-home-producers]");
  await expect(producers).toHaveAttribute("href", /\/shop\/sample-packs\/?$/);
  await expect(producers.locator("b")).toHaveText("Producers");
  await expect(producers).toContainText("Sample packs & Foley sounds. For beatmakers, post-production, and video game sound designers.");
  await expect(producers).not.toContainText("$");
  const [m, b, p] = [(await merch.boundingBox())!, (await beats.boundingBox())!, (await producers.boundingBox())!];
  // directly under Beats: same column, below it
  expect(Math.abs(p.x - b.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(p.width - b.width)).toBeLessThanOrEqual(1);
  expect(p.y).toBeGreaterThan(b.y + b.height - 1);
  if ((page.viewportSize()?.width ?? 1280) >= 768) {
    // desktop: Merch spans the left column, as tall as Beats + Producers
    expect(m.x).toBeLessThan(b.x);
    expect(Math.abs(m.y - b.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(m.y + m.height - (p.y + p.height))).toBeLessThanOrEqual(1);
  } else {
    expect(m.y).toBeLessThan(b.y);
  }
  await producers.click();
  await expect(page).toHaveURL(/\/shop\/sample-packs\/$/);
  await expect(page.locator("h1")).toHaveText("Sample packs");
});

test("home: Producers card sits beside Merch when beats are hidden", async ({ page }) => {
  test.skip(MUSIC, "public music is visible");
  await page.goto("/");
  const merch = page.locator("#shop a[data-home-merch]");
  const producers = page.locator("#shop a[data-home-producers]");
  await expect(page.locator("#shop a[data-home-beats]")).toHaveCount(0);
  await expect(producers).toHaveAttribute("href", /\/shop\/sample-packs\/?$/);
  const [m, pbox] = [(await merch.boundingBox())!, (await producers.boundingBox())!];
  if ((page.viewportSize()?.width ?? 1280) >= 768) {
    expect(m.x).toBeLessThan(pbox.x);
    expect(Math.abs(m.y - pbox.y)).toBeLessThanOrEqual(1);
  } else {
    expect(m.y).toBeLessThan(pbox.y);
  }
  await producers.click();
  await expect(page).toHaveURL(/\/shop\/sample-packs\/$/);
  await expect(page.locator("h1")).toHaveText("Sample packs");
});

test("sample pack library renders, coming soon, with no prices or checkout", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const res = await page.goto("/shop/sample-packs/");
  expect(res?.status()).toBe(200);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveText("Sample packs");
  const lib = page.locator("[data-pack-library]");
  await expect(lib).toBeVisible();
  const count = Number(await lib.getAttribute("data-pack-count"));
  if (count === 0) {
    await expect(page.locator("[data-packs-soon]")).toBeVisible();
    await expect(page.locator("[data-pack-placeholder]:visible [data-coming-soon]").first()).toHaveText(/coming soon/i);
    await expect(page.locator("[data-pack-placeholder] h2, [data-pack-placeholder] h3")).toHaveCount(0);
    await expect(page.locator("[data-pack-play]")).toHaveCount(0);
  } else {
    await expect(page.locator("[data-pack]")).toHaveCount(count);
  }
  const main = page.locator("main#main");
  await expect(main).not.toContainText("$");
  await expect(main.locator("[data-checkout], [data-offer-chooser]")).toHaveCount(0);
  const hrefs = await page.locator("a[href]").evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).href));
  expect(hrefs.filter((h) => /payhip|stripe|checkout|ko-fi|kofi/i.test(h))).toEqual([]);
  expect(await page.content()).not.toMatch(/\.(wav|aiff?|flac)\b/i);
  // no autoplay, no horizontal overflow
  expect(await page.evaluate(() => [...document.querySelectorAll("audio,video")].filter((m) => !(m as HTMLMediaElement).paused).length)).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  const primary = page.locator('nav[aria-label="Primary"] a');
  const nav = MUSIC ? ["Artists", "Merch", "Beats", "Contact", "Music"] : ["Artists", "Merch", "Contact"];
  await expect(primary.filter({ hasText: /^(Artists|Merch|Beats|Contact|Music)$/ })).toHaveText(nav);
  if (MUSIC && (await primary.first().isVisible())) await expect(page.locator('nav[aria-label="Primary"] a[aria-current="page"]')).toHaveText("Beats");
  if (!MUSIC && (await primary.first().isVisible())) await expect(page.locator('nav[aria-label="Primary"] a[aria-current="page"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("sitemap lists the sample pack library", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toMatch(/\/shop\/sample-packs\/<\/loc>/);
});
