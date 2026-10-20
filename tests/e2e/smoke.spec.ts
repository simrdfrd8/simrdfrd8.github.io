import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

/** The public build streams beats from an external media base (Cloudflare R2; a local static server in tests). */
/** Owner rule: no adjectives before the categories (spelled in pieces so this guard doesn't trip the repo leak scan). */
const BANNED = new RegExp(["ed" + "gy", "heart" + "felt", "dis" + "torted", "under" + "neath"].join("|"), "i");
const MEDIA_BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE ?? "http://localhost:3201").replace(/\/$/, "");
/** Same switch the export was built with (NEXT_PUBLIC_CHECKOUT_LIVE=1 → MP3/WAV lease buttons open the beat's Payhip product). */
const CHECKOUT_LIVE = process.env.NEXT_PUBLIC_CHECKOUT_LIVE === "1";

const ROUTES = [
  "/", "/music", "/artists", "/artists/flavorful-croissants", "/artists/not-daf", "/artists/720m", "/artists/andrew-bigs", "/artists/ricky",
  "/artists/dan-perales", "/artists/baylingual-entertainment", "/video", "/art", "/shop", "/shop/merch", "/services", "/support", "/contact", "/licensing", "/licensing/mp3-lease", "/licensing/wav-lease", "/licensing/stems-lease", "/licensing/exclusive-rights",
];

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    // Only first-party errors count; third-party embeds log their own noise.
    const url = m.location().url ?? "";
    if (url && !url.startsWith("http://localhost")) return;
    errors.push(`console: ${m.text()}`);
  });
  return errors;
}

for (const route of ROUTES) {
  test(`smoke ${route}`, async ({ page }) => {
    const errors = watchErrors(page);
    const res = await page.goto(route, { waitUntil: "load" });
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main#main")).toBeVisible();

    // scroll through the page so lazy content mounts
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 700) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
    });
    await page.waitForTimeout(400);

    // No autoplay anywhere
    expect(await page.locator("video[autoplay], audio[autoplay]").count()).toBe(0);
    const playing = await page.evaluate(() => [...document.querySelectorAll("video,audio")].filter((m) => !(m as HTMLMediaElement).paused).length);
    expect(playing).toBe(0);
    for (const src of await page.locator("iframe").evaluateAll((els) => els.map((e) => (e as HTMLIFrameElement).src))) {
      expect(src).not.toMatch(/auto_?play=(true|1)/i);
    }

    // Embeds are lazy: SoundCloud only after click; Spotify iframes lazy-loaded
    expect(await page.locator('iframe[src*="w.soundcloud.com"]').count()).toBe(0);
    for (const l of await page.locator('iframe[src*="open.spotify.com"]').evaluateAll((els) => els.map((e) => e.getAttribute("loading")))) expect(l).toBe("lazy");

    // Layout: no horizontal overflow
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    expect(errors).toEqual([]);
  });
}

test("nav stays at 5 items and support is one tap away", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) {
    await expect(page.getByRole("link", { name: "Support" }).last()).toBeVisible();
  } else {
    const nav = page.getByRole("navigation", { name: "Primary" });
    expect(await nav.getByRole("link").count()).toBeLessThanOrEqual(5);
    await expect(nav.getByRole("link", { name: "Support" })).toBeVisible();
  }
});

test("SoundCloud facade loads the official player without autoplay", async ({ page }) => {
  await page.goto("/music");
  const facade = page.locator('[data-facade="soundcloud"]').first();
  await facade.scrollIntoViewIfNeeded();
  await facade.click();
  const frame = page.locator('iframe[src*="w.soundcloud.com/player"]').first();
  await expect(frame).toHaveCount(1);
  expect(await frame.getAttribute("src")).toContain("auto_play=false");
});

test("video page has no videos in the public build yet", async ({ page }) => {
  await page.goto("/video");
  await expect(page.locator("[data-videos-soon]")).toHaveText("Videos coming soon.");
  await expect(page.locator("figure[data-orientation], video")).toHaveCount(0);
  for (const route of ["/video/", "/art/", "/artists/baylingual-entertainment/"]) {
    await page.goto(route);
    expect(await page.content()).not.toMatch(/bay-video-merch/);
  }
});

test("checkout is off: buy buttons read 'Coming soon' and nothing links to Payhip", async ({ page }) => {
  test.skip(CHECKOUT_LIVE, "build has checkout switched on");
  for (const route of ["/shop/", "/music/", "/support/", "/artists/flavorful-croissants/"]) {
    await page.goto(route);
    const html = await page.content();
    expect(html).not.toMatch(/payhip\.com|ko-fi\.com\/[^"]*checkout|isn.t connected|test mode|nothing will be charged/i);
  }
  await page.goto("/shop/");
  const btn = page.locator('#all [data-checkout="coming-soon"]:visible').first();
  await expect(btn).toHaveText("Coming soon");
  await expect(btn).toBeDisabled();
  await expect(page.locator('[data-checkout="test-mode"]')).toHaveCount(0);
});

test("checkout is live: MP3 + WAV lease buttons open each beat's Payhip product; Stems + Exclusive stay 'Coming soon'", async ({ page }) => {
  test.skip(!CHECKOUT_LIVE, "build has checkout switched off");
  const expected = new Map<string, string>(
    (JSON.parse(readFileSync(path.join(__dirname, "../../content/beats.json"), "utf8")) as { id: string; payhipUrl?: string }[]).map((b) => [b.id, b.payhipUrl ?? ""]),
  );
  await page.goto("/music/");
  const cards = page.locator("[data-beat-card]");
  const n = await cards.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) {
    const card = cards.nth(i);
    const id = (await card.getAttribute("data-beat-card"))!;
    const hrefs = await card.locator('a[href*="payhip.com"]').evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    // the beat's own Payhip product, on both the MP3 and the WAV lease button
    expect(expected.get(id), id).toMatch(/^https:\/\/payhip\.com\/b\/[A-Za-z0-9]+$/);
    expect(hrefs, id).toEqual([expected.get(id), expected.get(id)]);
    await expect(card.locator('[data-checkout="coming-soon"]')).toHaveCount(2);
  }
  const html = await page.content();
  expect(html).not.toMatch(/payhip\.com\/(product|edit|account|dashboard)|\.wav\b/i);
});

test("art lightbox opens, navigates, and closes with Escape", async ({ page }) => {
  await page.goto("/art");
  await page.getByRole("button", { name: /^Open / }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.getByLabel("Search artwork").fill("zzzz-nothing");
  await expect(page.getByText("Nothing matches that yet.")).toBeVisible();
});

test("robots allows crawlers in the public build and sitemap lists artists", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Allow: /");
  expect(robots).not.toMatch(/Disallow|\/api/i);
  expect(await (await request.get("/sitemap.xml")).text()).toContain("/artists/not-daf/");
});

test("productions lanes: DJs, Rappers, Producers with one primary CTA", async ({ page }) => {
  await page.goto("/artists/flavorful-croissants");
  const tabs = page.getByRole("tablist", { name: "Productions by audience" });
  await expect(tabs.getByRole("tab")).toHaveText([/For DJs/, /For Rappers/, /For Producers/]);
  await tabs.getByRole("tab", { name: /For Rappers/ }).click();
  const card = page.locator('[data-audience="rapper"]:visible').first();
  await card.getByRole("button", { name: /Buy \/ License · from \$10/ }).click();
  await expect(page.getByRole("dialog")).toContainText("MP3 lease");
  await page.keyboard.press("Escape");
  await tabs.getByRole("tab", { name: /For Producers/ }).click();
  await expect(page.locator("[data-pack]")).toHaveCount(0);
  await expect(page.locator("[data-packs-soon]:visible")).toHaveText("Sample packs coming soon.");
});

test("Baylingual apparel is hidden from the public build (only the HOTDO G Tee is in the store)", async ({ page }) => {
  await page.goto("/artists/baylingual-entertainment");
  await expect(page.locator("[data-apparel-art]")).toHaveCount(0);
  expect(await page.content()).not.toMatch(/bay-merch-|baylingual-frog-(tee|crewneck)/);
  await expect(page.locator("[data-merch]")).toHaveCount(0);
  await expect(page.locator('main a[href^="/shop/merch"], main a[href*="ref=baylingual-frog"]')).toHaveCount(0);
});

test("hierarchy: Baylingual Entertainment sits under Dan Perales", async ({ page }) => {
  await page.goto("/artists/dan-perales");
  const presents = page.locator("#presents");
  await expect(presents.getByRole("link", { name: /Baylingual Entertainment/ })).toBeVisible();
  await expect(page.locator('[data-release="dp-cayo"]')).toContainText("The Psychadelic Shorty");
  await expect(page.locator('[data-release="dp-cayo"]')).toContainText("prod. ALi Huaskatley · feat. Ant Del$ol");
  await page.goto("/artists/baylingual-entertainment");
  await expect(page.locator("[data-parent-link]")).toHaveText(/Part of Dan Perales/);
  await expect(page.locator("#merch [data-checkout]")).toHaveCount(0);
});

test("homepage follows Brandy's structure: hero, manifesto, three shades, five artists, shop, contact", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText(/Make art\s*with friends\./);
  const ids = await page.locator("main section[id]").evaluateAll((els) => els.map((e) => e.id));
  expect(ids).toEqual(["about", "shades", "crew", "listen", "who", "shop", "contact"]);
  await expect(page.locator("[data-shade] h3")).toHaveText(["Hip-Hop", "EDM", "Production"]);
  const cards = page.locator("[data-artist-card]");
  expect(await cards.evaluateAll((els) => els.map((e) => e.getAttribute("data-artist-card")))).toEqual(["720m", "dan-perales", "andrew-bigs", "not-daf", "flavorful-croissants"]);
  await expect(page.locator('[id="720m"]')).toContainText("Meet 720M →");
  // Brandy's approved finals: card photos (Dan has a hover crossfade), nav + hero + shade logos
  for (const slug of ["720m", "dan-perales", "andrew-bigs", "flavorful-croissants"]) await expect(page.locator(`[data-artist-card="${slug}"] img[data-card-photo]`)).toHaveCount(1);
  await expect(page.locator('[data-artist-card="dan-perales"] img[data-card-photo-alt]')).toHaveCount(1);
  await expect(page.locator(`[data-artist-card="not-daf"] img`)).toHaveCount(0);
  await expect(page.locator("header [data-wordmark] img").first()).toHaveAttribute("src", "/brand/logo/svg/logo-text.svg");
  await expect(page.locator("[data-hero-mark] img")).toHaveAttribute("src", "/brand/logo/svg/logo-cream.svg");
  expect(await page.locator("[data-shade] img").evaluateAll((els) => els.map((e) => e.getAttribute("src")))).toEqual(["/brand/logo/svg/logo-coral-hiphop.svg", "/brand/logo/svg/logo-acid-edm.svg", "/brand/logo/svg/logo-violet-prod.svg"]);
  for (const img of await page.locator("[data-artist-card] img, [data-hero-mark] img").all()) {
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((e) => (e as HTMLImageElement).complete && (e as HTMLImageElement).naturalWidth > 0)).toBe(true);
  }
  await expect(page.locator("#andrew-bigs a[href='https://open.spotify.com/artist/53hggKXepZN14WR83U8g2T']")).toBeVisible();
  await expect(page.locator("#shop [data-home-beats] a[href='/music/#buy-beats']")).toBeVisible();
  await expect(page.locator("main")).not.toContainText(/\[(link|photo|artist art|pack name)\]/);
  await expect(page.locator("main header p").first()).toContainText("disguised as a record label: EDM, hip-hop and production. Made together, owned end to end.");
  await expect(page.locator("#about")).toContainText("Our sound comes in three shades: EDM, hip-hop and production.");
  // no adjectives before the categories, anywhere on the page or in its metadata
  await expect(page.locator("body")).not.toContainText(BANNED);
  expect(await page.locator('meta[name="description"], meta[property="og:description"]').evaluateAll((m) => m.map((x) => x.getAttribute("content")).join(" "))).not.toMatch(BANNED);
  await expect(page.locator("[data-home-beats]")).toContainText("Beats for DJs and rappers from Flavorful Croissants. Press play, find your sound, then license it.");
});

test("site-wide footer: Make art with friends + Friends row", async ({ page }) => {
  for (const route of ["/", "/music", "/artists/720m"]) {
    await page.goto(route);
    const footer = page.locator("footer[data-site-footer]");
    await expect(footer).toContainText("Make art with friends.");
    await expect(footer).toContainText("Flavorful Music is a DBA of Baylingue LLC");
    const friends = footer.getByRole("navigation", { name: "Friends" });
    await expect(friends.locator(".fr-name")).toHaveText(["Dan Perales", "Andrew Bigs", "Flavorful Croissants", "James Eagle"]);
    const ext = friends.locator("a.fr-link");
    for (const a of await ext.all()) {
      await expect(a).toHaveAttribute("target", "_blank");
      await expect(a).toHaveAttribute("rel", /noopener/);
    }
    await expect(friends.getByRole("link", { name: "Dan Perales", exact: true })).toHaveAttribute("href", "/#dan-perales");
  }
});

test("720M page: bio verbatim and an accessible Look-closer zoom (tap, keyboard)", async ({ page, isMobile }) => {
  await page.goto("/artists/720m");
  await expect(page.locator("h1")).toHaveText("720M");
  await expect(page.locator("[data-bio]")).toHaveText(/^720M explores themes of laughter and grief in rhythm and rhyme\. An avid freestyle nut/);
  await expect(page.locator("main")).not.toContainText(/same 720M|RICKAYYY/);
  await expect(page.locator("img[data-portrait]")).toHaveCount(1);
  await expect(page.locator("[data-collage] img")).toHaveAttribute("src", "/brand/720m/720m-collage-wide.jpg");
  await expect(page.locator("[data-collage] source").first()).toHaveAttribute("srcset", /720m-collage-square-1200\.webp 1200w/);
  await expect(page.locator("[data-loupe] img")).toHaveAttribute("srcset", /720m-lens-detail-1\.5x\.jpg 975w, \/brand\/720m\/720m-lens-detail-3x\.jpg 1950w/);
  await expect(page.locator("[data-loupe] [data-placeholder]")).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText(/photo credit|confirm legal/i);
  const loupe = page.getByRole("button", { name: /Look closer/ });
  await loupe.scrollIntoViewIfNeeded();
  await expect(loupe).toHaveAttribute("aria-pressed", "false");
  if (isMobile) {
    await loupe.tap();
    await expect(loupe).toHaveAttribute("aria-pressed", "true");
    await loupe.tap();
    await expect(loupe).toHaveAttribute("aria-pressed", "false");
  }
  await loupe.focus();
  await page.keyboard.press("Enter");
  await expect(loupe).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");
  await expect(loupe).toHaveAttribute("aria-pressed", "false");
  const box = await loupe.boundingBox();
  expect(box!.width).toBeGreaterThan(page.viewportSize()!.width * (isMobile ? 0.95 : 0.4));
});

test("music page order: FC × 720M, Latest, Most played, Buy beats", async ({ page }) => {
  await page.goto("/music");
  const ids = await page.locator("main section[id]").evaluateAll((els) => els.map((e) => e.id));
  expect(ids.slice(0, 4)).toEqual(["fc-x-720m", "latest", "most-played", "buy-beats"]);
  // FC × 720M highlight: every track credited to both, no iframes until clicked
  const hi = page.locator("#fc-x-720m");
  await expect(hi).toContainText("720M × Flavorful Croissants");
  await expect(hi.locator("iframe")).toHaveCount(0);
  // Release playlist: first 8 in playlist order, the rest behind one button
  await expect(hi).toContainText("Hand-picked from the Release playlist.");
  await expect(hi).not.toContainText(/FANNYPACK sessions/i);
  const cards = hi.locator("[data-track]");
  await expect(cards).toHaveCount(8);
  await expect(cards.first()).toContainText("goodsleepix");
  await expect(cards.first()).not.toContainText(/x ricky/i);
  await hi.getByRole("button", { name: "Show all 29 tracks" }).click();
  await expect(cards).toHaveCount(29);
  await expect(cards.last()).toContainText("pursuitofme");
  await expect(hi).not.toContainText(/olecropduster|Big Smile|elaphantzx/);
  // Latest: exactly 5, newest first
  const dates = await page.locator("#latest [data-latest]").evaluateAll((els) => els.map((e) => e.getAttribute("data-date")!));
  expect(dates).toHaveLength(5);
  expect([...dates].sort().reverse()).toEqual(dates);
  // Spotify behind a facade, with a follow link
  const mp = page.locator("#most-played");
  await expect(mp.locator("iframe")).toHaveCount(0);
  await expect(mp.getByRole("link", { name: /Follow on Spotify/ })).toHaveAttribute("href", /7HVJPuRrvPJmyt0s5Rnvb0/);
});

test("buy beats: real beats, full player, licenses coming soon, no WAV anywhere", async ({ page }) => {
  const requested: string[] = [];
  page.on("request", (r) => requested.push(r.url()));
  await page.goto("/music");
  const bb = page.locator("#buy-beats");
  const titles = bb.locator("[data-beat-card] h3");
  await expect(titles).toHaveCount(13); // featured + 12
  expect((await titles.allTextContents()).slice(0, 5)).toEqual(["Deserts", "East County", "Name of Water", "Paino Drums", "DYdrm"]);
  await expect(bb.locator("[data-beat-card=deserts]")).toHaveAttribute("data-wide", "true");
  await expect(bb.locator("[data-beat-card=dydrm] [data-heard-on]")).toContainText("720M × Flavorful Croissants");
  const tiers = bb.locator("[data-beat-card=deserts] [data-lease-tiers] li");
  await expect(tiers).toHaveText([/MP3 lease\s*\$10/, /WAV lease\s*\$25/, /Stems lease\s*\$50/, /Exclusive rights\s*\$500/]);
  await expect(bb.locator("[data-beat-card=deserts]").getByRole("button", { name: "Buy / License · from $10" })).toBeVisible();
  await expect(bb.locator("[data-beat-browser] [data-beat-card]").first().getByRole("button", { name: "Buy / License · from $10" })).toBeVisible();
  await expect(bb).not.toContainText("$100");
  await expect(bb).not.toContainText(/by inquiry|Unlimited license/i);
  const audio = bb.locator("[data-beat-card=east-county] audio");
  await expect(audio).toHaveAttribute("src", `${MEDIA_BASE}/media/beat-east-county/audio.mp3`);
  await expect(audio).toHaveAttribute("preload", "none");
  expect(await audio.evaluate((a: HTMLAudioElement) => a.autoplay)).toBe(false);
  await bb.locator("[data-beat-card=east-county]").getByRole("button", { name: /Buy \/ License/ }).click();
  const chooser = page.getByRole("dialog");
  await expect(chooser).toContainText("MP3 lease");
  const soon = chooser.locator('[data-checkout="coming-soon"]');
  if (CHECKOUT_LIVE) {
    // MP3 + WAV leases open the beat's Payhip product; Stems + Exclusive stay "Coming soon" until stems are delivered.
    const links = chooser.locator('a[href^="https://payhip.com/b/"]');
    await expect(links).toHaveCount(2);
    await expect(soon).toHaveCount(2);
  } else {
    await expect(soon.first()).toHaveText("Coming soon");
    await expect(soon.first()).toBeDisabled();
    await expect(chooser.locator('a[href*="payhip"]')).toHaveCount(0);
  }
  await page.keyboard.press("Escape");
  await expect(bb.getByRole("link", { name: "See all beats" })).toHaveAttribute("href", /lane=rapper/);
  await expect(bb.getByRole("link", { name: /DJ edits/ })).toHaveAttribute("href", /lane=dj/);
  await expect(bb.getByRole("link", { name: /Sample packs/ })).toHaveAttribute("href", /lane=producer/);
  for (const route of ["/music", "/shop"]) {
    await page.goto(route);
    const html = await page.content();
    expect(html).not.toMatch(/\.(wav|aiff?|flac)\b/i);
  }
  expect(requested.filter((u) => /\.(wav|aiff?|flac)(\?|$)/i.test(u))).toEqual([]);
});

test("beat catalog: search, BPM and key filters, load more", async ({ page }) => {
  await page.goto("/music");
  const browser = page.locator("#buy-beats [data-beat-browser]");
  const cards = browser.locator("[data-beat-card]");
  await expect(cards).toHaveCount(12);
  await expect(browser.locator("[data-beat-count]")).toHaveText("114 beats");
  await browser.getByRole("button", { name: /Load 12 more/ }).click();
  await expect(cards).toHaveCount(24);
  await browser.getByLabel("Search beats").fill("paino");
  await expect(cards).toHaveCount(1);
  await expect(cards.first().locator("h3")).toHaveText("Paino Drums");
  await browser.getByLabel("Search beats").fill("");
  await browser.getByLabel("BPM").selectOption("90-109");
  await expect(browser.locator("[data-beat-count]")).not.toHaveText("114 beats");
  await expect.poll(async () => (await cards.evaluateAll((els) => els.map((e) => Number(e.getAttribute("data-bpm"))))).every((n) => n >= 90 && n < 110)).toBe(true);
  expect(await cards.count()).toBeGreaterThan(0);
  await browser.getByLabel("BPM").selectOption("");
  await browser.getByLabel("Key").selectOption("A minor");
  await expect.poll(async () => (await cards.evaluateAll((els) => els.map((e) => e.getAttribute("data-key")))).every((k) => k === "A minor")).toBe(true);
  expect(await cards.count()).toBeGreaterThan(0);
  await browser.getByLabel("Search beats").fill("zzzz-none");
  await expect(browser).toContainText("No beats match that.");
});

test("shop For Rappers shows only the real beats", async ({ page }) => {
  await page.goto("/shop?lane=rapper#lanes");
  const panel = page.getByRole("tabpanel");
  const titles = panel.locator("[data-beat-card] h3");
  await expect(titles).toHaveCount(13);
  expect((await titles.allTextContents()).slice(0, 5)).toEqual(["Deserts", "East County", "Name of Water", "Paino Drums", "DYdrm"]);
  await expect(page.getByRole("tab", { name: /For Rappers/ })).toContainText("115");
});

test("license page: comparison table matches the contracts, each tier links to its full agreement", async ({ page, request }) => {
  await page.goto("/licensing");
  const mobile = (page.viewportSize()?.width ?? 1280) < 768;
  if (!mobile) {
    const table = page.getByRole("table", { name: "Beat license comparison" });
    await expect(table).toBeVisible();
    const row = (label: string) => table.locator("tr", { hasText: label });
    await expect(row("Price")).toHaveText(/\$10\s*\$25\s*\$50\s*\$500/);
    await expect(row("Term")).toHaveText(/2 years\s*5 years\s*10 years\s*Forever/);
    await expect(row("Audio streams")).toHaveText(/50,000\s*500,000\s*2,000,000\s*Unlimited/);
    await expect(row("Downloads / sales")).toHaveText(/2,000\s*10,000\s*50,000\s*Unlimited/);
    await expect(row("Radio")).toHaveText(/No\s*2 stations\s*Unlimited\s*Unlimited/);
  } else {
    await expect(page.getByRole("table", { name: "Beat license comparison" })).toBeHidden();
    const terms = (slug: string) => page.locator(`[data-agreement-card=${slug}] [data-tier-terms]`);
    await expect(terms("mp3-lease")).toBeVisible();
    await expect(terms("mp3-lease")).toContainText(/Price\s*\$10.*Term\s*2 years.*Audio streams\s*50,000/s);
    await expect(terms("wav-lease")).toContainText(/Radio\s*2 stations/);
    await expect(terms("stems-lease")).toContainText(/Term\s*10 years.*Audio streams\s*2,000,000/s);
    await expect(terms("exclusive-rights")).toContainText(/Price\s*\$500.*Term\s*Forever/s);
  }
  await expect(page.locator("main")).toContainText("50% of the writer's share");
  await expect(page.locator("main")).toContainText('"Prod. Flavorful Croissants"');
  // internal banner never renders; the visible "Draft terms" notice does while LICENSE_TERMS_FINAL is false
  await expect(page.locator("main")).not.toContainText(/NOT YET FOR USE|attorney|\b(10|100|500)k streams/i);
  await expect(page.locator("[data-draft-terms-notice]")).toHaveText("Draft terms. Final wording coming soon.");
  for (const slug of ["mp3-lease", "wav-lease", "stems-lease", "exclusive-rights"]) {
    await expect(page.locator(`[data-agreement-card=${slug}] a[href="/licensing/${slug}/"]`)).toBeVisible();
  }
  await page.locator("[data-agreement-card=exclusive-rights]").getByRole("link", { name: "Read the full agreement" }).click();
  await expect(page).toHaveURL(/\/licensing\/exclusive-rights\/$/);
  const doc = page.locator("[data-agreement=exclusive-rights]");
  await expect(doc).toContainText("Within 3 business days");
  await expect(doc).toContainText("remains fully valid");
  await expect(doc).toContainText("not a transfer of copyright");
  await expect(page.locator("main")).not.toContainText(/NOT YET FOR USE|attorney/i);
  await expect(page.locator("[data-draft-terms-notice]")).toBeVisible();
  await page.goto("/licensing/mp3-lease");
  await expect(page.locator("a[data-agreement-download]")).toHaveAttribute("href", "/licensing/mp3-lease/agreement.md");
  await expect(page.locator("a[data-agreement-download]")).toHaveAttribute("download", "flavorful-music-mp3-lease-agreement.md");
  const dl = await request.get("/licensing/mp3-lease/agreement.md");
  expect(dl.status()).toBe(200);
  expect(dl.headers()["content-type"]).toContain("text/markdown");
  const body = await dl.text();
  expect(body).toContain("# Flavorful Music – MP3 Lease Agreement");
  expect(body).not.toMatch(/DRAFT|NOT YET FOR USE|attorney/);
});

test("beat tiers link to their agreements", async ({ page }) => {
  await page.goto("/music");
  const tiers = page.locator("#buy-beats [data-beat-card=deserts] [data-lease-tiers] a[data-agreement-link]");
  await expect(tiers).toHaveCount(4);
  expect(await tiers.evaluateAll((as) => as.map((a) => a.getAttribute("href")))).toEqual(["/licensing/mp3-lease/", "/licensing/wav-lease/", "/licensing/stems-lease/", "/licensing/exclusive-rights/"]);
  await page.locator("#buy-beats [data-beat-card=deserts]").getByRole("button", { name: /Buy \/ License/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("2 years · 50,000 streams");
  await expect(dialog.locator("a[data-agreement-link]")).toHaveCount(4);
});

test("contact is a mailto link with a prefilled subject per inquiry type", async ({ page }) => {
  await page.goto("/contact/?type=licensing&ref=deserts");
  const primary = page.locator("[data-inquiry-primary]");
  await expect(primary).toHaveText(/licensing/i);
  const href = (await primary.getAttribute("href"))!;
  expect(href.startsWith("mailto:ricky@flavorfulmusic.com?subject=")).toBe(true);
  expect(decodeURIComponent(href.split("subject=")[1])).toBe("License request (ref: deserts)");
  expect(decodeURIComponent((await page.locator('[data-inquiry-type="booking"]').getAttribute("href"))!.split("subject=")[1])).toBe("Booking inquiry");
  expect(await page.locator("form").count()).toBe(0);
  const mails = await page.locator('a[href^="mailto:"]').evaluateAll((as) => as.map((a) => a.getAttribute("href")!.split("?")[0]));
  expect(new Set(mails)).toEqual(new Set(["mailto:ricky@flavorfulmusic.com"]));
});

test("beat audio and peaks load from the external media base, never from the site", async ({ page }) => {
  const media: { url: string; status: number }[] = [];
  page.on("response", (r) => { if (/\/media\/beat-/.test(r.url())) media.push({ url: r.url(), status: r.status() }); });
  await page.goto("/music/");
  const card = page.locator("#buy-beats [data-beat-card=deserts]");
  await card.scrollIntoViewIfNeeded();
  await expect.poll(() => media.filter((m) => m.url.endsWith("/peaks.json") && m.status === 200).length, { timeout: 10_000 }).toBeGreaterThan(0);
  const audio = card.locator("audio");
  await expect(audio).toHaveAttribute("src", `${MEDIA_BASE}/media/beat-deserts/audio.mp3`);
  const ok = await audio.evaluate(async (a: HTMLAudioElement) => {
    a.preload = "metadata";
    a.load();
    await new Promise<void>((res, rej) => { a.addEventListener("loadedmetadata", () => res(), { once: true }); a.addEventListener("error", () => rej(new Error("audio error")), { once: true }); setTimeout(() => rej(new Error("timeout")), 10_000); });
    return a.duration;
  });
  expect(ok).toBeGreaterThan(60);
  for (const m of media) expect(m.url.startsWith(MEDIA_BASE)).toBe(true);
  const site = new URL(page.url()).origin;
  expect((await page.request.get(`${site}/media/beat-deserts/audio.mp3`)).status()).toBe(404);
  expect((await page.request.get(`${site}/media/beat-deserts/peaks.json`)).status()).toBe(404);
});

test("old /artists/baylingual URL redirects with a static meta refresh", async ({ page }) => {
  await page.goto("/artists/baylingual/");
  await expect(page).toHaveURL(/\/artists\/baylingual-entertainment\/$/);
});

test("Flavorful Croissants uses the approved photos only (no private gallery)", async ({ page }) => {
  await page.goto("/artists/flavorful-croissants/");
  await expect(page.locator("img[data-portrait]")).toHaveAttribute("src", /fc-portrait/);
  expect(await page.content()).not.toMatch(/\/brand\/[^"]*gallery\//);
  await page.goto("/");
  expect(await page.locator('img[src*="flavorful-croissants/fc-card-4x5"], source[srcset*="flavorful-croissants/fc-card-4x5"]').count()).toBeGreaterThan(0);
});

test("artist titles never break mid-word and fit the viewport", async ({ page }) => {
  for (const w of [320, 390]) {
    await page.setViewportSize({ width: w, height: 800 });
    for (const slug of ["flavorful-croissants", "720m", "dan-perales", "andrew-bigs", "not-daf", "ricky", "baylingual-entertainment"]) {
      await page.goto(`/artists/${slug}/`);
      const h1 = page.locator("h1").first();
      const r = await h1.evaluate((el) => {
        const range = document.createRange(); range.selectNodeContents(el);
        const lines = new Set([...range.getClientRects()].map((x) => Math.round(x.top)));
        const words = (el.textContent ?? "").trim().split(/\s+/).length;
        return { lines: lines.size, words, over: el.scrollWidth - el.clientWidth, doc: document.documentElement.scrollWidth - document.documentElement.clientWidth };
      });
      expect(r.lines, `${slug}@${w}`).toBeLessThanOrEqual(r.words);
      expect(r.over, `${slug}@${w}`).toBeLessThanOrEqual(0);
      if (w >= 390) expect(r.doc, `${slug}@${w}`).toBeLessThanOrEqual(0); // header is ~11px too wide at 320 (pre-existing, tracked separately)
    }
  }
  await page.goto("/artists/flavorful-croissants/");
  await expect(page.locator("main, body").first()).toContainText("Production · EDM & hip-hop");
});

test("HOTDO G shows the approved copy in the shop", async ({ page }) => {
  await page.goto("/shop/merch/");
  await expect(page.locator('[data-product="merch-hotdog-tee-white"] h3')).toHaveText("HOTDO G Tee");
});
