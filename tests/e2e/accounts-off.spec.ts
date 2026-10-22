import { expect, test } from "@playwright/test";

/** Default build (no NEXT_PUBLIC_ACCOUNTS_API): accounts are off, nothing about the site or guest checkout changes. */
test("accounts off: no Sign in link anywhere, account pages say accounts aren't open and are noindex", async ({ page, isMobile }) => {
  for (const route of ["/", "/shop/", "/shop/merch/"]) {
    await page.goto(route);
    await expect(page.locator("[data-account-link]")).toHaveCount(0);
    await expect(page.locator('a[href^="/account"]')).toHaveCount(0);
  }
  if (isMobile) {
    await page.getByRole("button", { name: "Menu" }).click();
    await expect(page.locator("#mobile-menu [data-account-link]")).toHaveCount(0);
  }
  for (const route of ["/account/", "/account/sign-in/"]) {
    await page.goto(route);
    await expect(page.getByText("Accounts aren’t open yet")).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  }
  const sitemap = await (await page.request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("/account");
});

test("guest checkout is unchanged: beat buy buttons need no account", async ({ page }) => {
  await page.goto("/shop/");
  const html = await page.content();
  expect(html).not.toMatch(/sign in to (buy|checkout)|create an account to/i);
  await expect(page.locator("[data-account-link]")).toHaveCount(0);
});
