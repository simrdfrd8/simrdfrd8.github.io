import { expect, test } from "@playwright/test";
import { publicMusicVisible } from "../../src/lib/public-visibility";
const MUSIC = publicMusicVisible();

/** The Producers / sample-packs card is off the public home page (t278u). Sample packs stay at /shop/sample-packs/. */
test("home: the Producers card is off the public home page; Merch stays", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#shop a[data-home-producers]")).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText("Sample packs & Foley sounds");
  await expect(page.locator("#shop a[data-home-merch]")).toHaveAttribute("href", /\/shop\/merch\/?$/);
  if (MUSIC) {
    await expect(page.locator("#shop a[data-home-beats]")).toBeVisible();
  } else {
    await expect(page.locator("#shop a[data-home-beats]")).toHaveCount(0);
  }
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
