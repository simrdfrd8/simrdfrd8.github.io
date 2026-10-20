import { expect, test } from "@playwright/test";

/** The label runners' own profile page (kept in its own spec, like content/artists-label.json). */
test("smoke /artists/ookie", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const res = await page.goto("/artists/ookie/");
  expect(res?.status()).toBe(200);
  await expect(page.locator("h1").first()).toHaveText("Ookie");
  await expect(page.getByText("Placeholder art")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("Ookie's title fits the viewport", async ({ page }) => {
  for (const w of [320, 390]) {
    await page.setViewportSize({ width: w, height: 800 });
    await page.goto("/artists/ookie/");
    const over = await page.locator("h1").first().evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(over).toBeLessThanOrEqual(0);
  }
});
