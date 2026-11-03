import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { validateCatalog } from "@/lib/catalog/validate";
import { visibleProducts, isAssetVisible } from "@/lib/catalog/filters";
import { AssetsFile, ProductsFile, SoundCloudFile, ArtistsFile, ProductTemplatesSchema, SamplePacksFile, BeatsFile, CATEGORIES } from "@/lib/catalog/schema";
import { resolveViews, heroColorwayOf, blankBackViews, pickModel, type ColorwayRef } from "@/lib/merch";

const V2_IDS = ["merch-feelings-notice-tee", "merch-heartbeat-triangle-tee", "merch-heartbeat-croissant-pocket-tee", "merch-taco-slu-t-pocket-tee", "merch-no-thanks-tee", "merch-taco-slu-t-pixel-patch-tee", "merch-redwood-lif-e-heartbeat-tee", "merch-redwood-lif-e-grove-tee", "merch-make-art-with-friends-tee"];
const TANK_IDS = ["merch-santa-cruz-sun-tank", "merch-santa-cruz-redwoods-tank", "merch-santa-cruz-sunset-tank"];
/** Older tees with a model cast (front, back, one model front/back per colourway). */
const MENS_LAUNCH_IDS = ["merch-heartbeat-triangle-tee", "merch-no-thanks-tee", "merch-feelings-notice-tee", "merch-make-art-with-friends-tee"];
/** Women's Comfort Colors 3023CL boxy cut with Tessa shots. */
const WOMENS_BOXY_IDS = ["merch-make-art-with-friends-womens-boxy-tee", "merch-feelings-notice-womens-boxy-tee"];
/** Public top ten (owner-approved Nov 2, 2026): the new pieces show front (and back, where printed) flats only, no model shots. */
const FLAT_ONLY_IDS = [
  "merch-hotdo-g-tee-g-dog", "merch-hotdo-g-womens-boxy-tee-g-dog", "merch-triangle-surfer-tee", "merch-never-ending-set-ribbon-tank", "merch-never-ending-set-ribbon-womens-tank",
  "merch-melt-wave-tee-inverse", "merch-paddle-back-round-tank", "merch-paddle-back-round-womens-tank", "merch-last-one-i-swear-tank", "merch-last-one-i-swear-womens-tank", "merch-triangle-surfer-pocket-tee",
  // owner picks, Nov 2, 2026, 10:36 PM PT (Island Dusk: concept art; Melt Wave Mirror: v10 flats only)
  "merch-here-comes-another-one-tank", "merch-here-comes-another-one-womens-tank", "merch-lighthouse-point-tank", "merch-lighthouse-point-womens-tank", "merch-island-dusk-hoodie", "merch-melt-wave-tee",
];
const WOMENS_IDS = [...WOMENS_BOXY_IDS, ...FLAT_ONLY_IDS.filter((id) => /womens/.test(id))];
/** Shop grid order without the public filter (production build sets MERCH_PUBLIC_SET=1, which also drops Heartbeat Triangle and no thanks). */
const LAUNCH_IDS = [
  "merch-hotdo-g-tee-g-dog", "merch-hotdo-g-womens-boxy-tee-g-dog", "merch-make-art-with-friends-tee", "merch-make-art-with-friends-womens-boxy-tee", "merch-feelings-notice-tee", "merch-feelings-notice-womens-boxy-tee",
  "merch-triangle-surfer-tee", "merch-never-ending-set-ribbon-tank", "merch-never-ending-set-ribbon-womens-tank", "merch-melt-wave-tee-inverse", "merch-paddle-back-round-tank", "merch-paddle-back-round-womens-tank",
  "merch-last-one-i-swear-tank", "merch-last-one-i-swear-womens-tank", "merch-triangle-surfer-pocket-tee",
  "merch-here-comes-another-one-tank", "merch-here-comes-another-one-womens-tank", "merch-lighthouse-point-tank", "merch-lighthouse-point-womens-tank", "merch-island-dusk-hoodie", "merch-melt-wave-tee",
  "merch-heartbeat-triangle-tee", "merch-no-thanks-tee",
];
const ALL_MERCH = [...V2_IDS, ...TANK_IDS, ...WOMENS_BOXY_IDS, ...FLAT_ONLY_IDS];

/** Owner rule: no adjectives before the categories (spelled in pieces so this guard doesn't trip the repo leak scan). */
const BANNED_WORDS = new RegExp(["ed" + "gy", "heart" + "felt", "dis" + "torted", "under" + "neath it all"].join("|"), "i");
const load = (n: string) => JSON.parse(readFileSync(path.join(__dirname, "../../content", `${n}.json`), "utf8"));
const raw = () => ({
  artists: [...load("artists"), ...load("artists-label")], releases: load("releases"), soundcloud: load("soundcloud"), assets: load("assets"),
  products: load("products"), services: load("services"), licenses: load("licenses"), site: load("site"), collaborators: load("collaborators"), samplePacks: load("sample-packs"),
});

describe("brand (Bruise) roster", () => {
  it("lists five artists in shade order Hip-Hop · EDM · Production with the Bruise colours", () => {
    const artists = ArtistsFile.parse(load("artists"));
    const rank = { "hip-hop": 0, edm: 1, production: 2 } as const;
    const listed = artists.filter((a) => a.listed).sort((a, b) => rank[a.category!] - rank[b.category!] || a.order - b.order);
    expect(listed.map((a) => a.slug)).toEqual(["720m", "dan-perales", "andrew-bigs", "not-daf", "flavorful-croissants"]);
    expect(listed.map((a) => a.category)).toEqual(["hip-hop", "hip-hop", "hip-hop", "edm", "production"]);
    const colour = { "hip-hop": "#FF7A59", edm: "#B6FF3B", production: "#8C7CFF" };
    for (const a of listed) expect(a.accent.toUpperCase()).toBe(colour[a.category!]);
    // no adjectives before the categories in any public copy
    const pub = ["artists", "site", "products", "services"].map((n) => JSON.stringify(load(n))).join("\n");
    expect(pub).not.toMatch(BANNED_WORDS);
    expect(CATEGORIES.map((c) => [c.label, c.color])).toEqual([["Hip-Hop", "#FF7A59"], ["EDM", "#B6FF3B"], ["Production", "#8C7CFF"]]);
  });

  it("uses 720M's official bio verbatim and keeps Dan Perales in Hip-Hop (not comedy)", () => {
    const artists = ArtistsFile.parse(load("artists"));
    const m = artists.find((a) => a.slug === "720m")!;
    expect(m.bio).toEqual([
      "720M explores themes of laughter and grief in rhythm and rhyme. An avid freestyle nut, 720M taps into the eternal wave and shares what he finds on record. He writes poetry as a form of therapy and lives in sunny San Diego where he makes art, surfs, and walks his furry friend Swami.",
    ]);
    const dan = artists.find((a) => a.slug === "dan-perales")!;
    expect(dan.category).toBe("hip-hop");
    // Owner, 2026-10-21: Dan Perales is also a comedian. Comedy is one of his categories, next to Hip-Hop (not a site category).
    expect(dan.genres).toEqual(["Hip-Hop", "Comedy"]);
    expect(dan.disciplines).toContain("Comedy");
    expect(dan.role).toBe("Rapper · Comedian");
    const ab = artists.find((a) => a.slug === "andrew-bigs")!;
    expect(ab.links.map((l) => l.url)).toEqual([
      "https://open.spotify.com/artist/53hggKXepZN14WR83U8g2T",
      "https://soundcloud.com/heisandrewbigs",
      "https://www.andrewbigs.com/bigs",
      "https://www.instagram.com/heisandrewbigs/",
    ]);
  });
});

describe("merch v2 views", () => {
  const cw = (slug: string, extra: Partial<ColorwayRef> = {}): ColorwayRef => ({ name: slug, slug, assetId: `${slug}-front`, ...extra });
  it("front is the thumbnail; back is per colorway; model shots fall back to the hero colorway", () => {
    const list = [cw("plum"), cw("black", { backAssetId: "black-back", modelFrontAssetId: "black-mf", modelBackAssetId: "black-mb" }), cw("coral", { modelFrontAssetId: "coral-mf" })];
    const v = resolveViews(list, undefined);
    expect(heroColorwayOf(list)?.slug).toBe("black");
    expect(v[0].map((x) => [x.kind, x.assetId, x.fromHero])).toEqual([["front", "plum-front", false], ["model-front", "black-mf", true], ["model-back", "black-mb", true]]);
    expect(v[1].map((x) => x.kind)).toEqual(["front", "back", "model-front", "model-back"]);
    expect(v[2].map((x) => [x.kind, x.assetId, x.fromHero])).toEqual([["front", "coral-front", false], ["model-front", "coral-mf", false], ["model-back", "black-mb", true]]);
    // with models: front, back, then ONE model (by category); legacy model fields and the rest of the cast are ignored
    const u = cw("navy", { backAssetId: "navy-back", modelFrontAssetId: "old-mf", modelExtras: [{ assetId: "x-2", side: "front" }], blankBackAssetId: "navy-back-blank",
      models: [{ gender: "female", frontAssetId: "f-mf", backAssetId: "f-mb", blankBackAssetId: "f-mb-blank" }, { gender: "male", frontAssetId: "m-mf", backAssetId: "m-mb" }] });
    const uv = resolveViews([u], undefined)[0];
    expect(uv.map((x) => x.assetId)).toEqual(["navy-front", "navy-back", "m-mf", "m-mb"]);
    expect(uv.map((x) => x.key ?? x.kind)).toEqual(["front", "back", "model-front", "model-back"]);
    expect(blankBackViews(u, uv)!.map((x) => x.assetId)).toEqual(["navy-front", "navy-back-blank", "m-mf", "m-mb"]);
    const wv = resolveViews([u], undefined, () => true, "women")[0];
    expect(wv.map((x) => x.assetId)).toEqual(["navy-front", "navy-back", "f-mf", "f-mb"]);
    expect(blankBackViews(u, wv)!.map((x) => x.assetId)).toEqual(["navy-front", "navy-back-blank", "f-mf", "f-mb-blank"]);
    expect(resolveViews([u], undefined, () => true, "men")[0].map((x) => x.assetId)).toEqual(["navy-front", "navy-back", "m-mf", "m-mb"]);
    // Men (the default) shows the man on every colorway; no alternating cast
    expect(resolveViews([u, { ...u, slug: "navy-2" }, { ...u, slug: "navy-3" }], undefined).map((v) => v[2].assetId)).toEqual(["m-mf", "m-mf", "m-mf"]);
    expect(resolveViews([u, { ...u, slug: "navy-2" }], undefined, () => true, "women").map((v) => v[2].assetId)).toEqual(["f-mf", "f-mf"]);
    // any cast works: one person (whatever the category), or none
    const solo = [{ gender: "female" as const, frontAssetId: "s-f", backAssetId: "s-b" }];
    for (const cat of ["men", "women"] as const) expect(pickModel(solo, cat)?.frontAssetId).toBe("s-f");
    expect(pickModel([], "men")).toBeUndefined();
    expect(resolveViews([cw("solo", { backAssetId: "solo-back", models: solo })], undefined, () => true, "men")[0].map((x) => x.assetId)).toEqual(["solo-front", "solo-back", "s-f", "s-b"]);
    expect(resolveViews([cw("none", { backAssetId: "none-back", models: [] })], undefined)[0].map((x) => x.assetId)).toEqual(["none-front", "none-back"]);
    // explicit hero wins; missing assets are skipped
    const v2 = resolveViews(list, "coral", (id) => id !== "coral-mf");
    expect(v2[0].map((x) => x.kind)).toEqual(["front"]);
  });
});

describe("content catalog", () => {
  it("validates with no schema or reference problems", () => {
    expect(validateCatalog(raw())).toEqual([]);
  });

  it("has every identity, with unique slugs and the Not Däf / 720M spellings", () => {
    const artists = ArtistsFile.parse(load("artists"));
    expect(artists.map((a) => a.slug).sort()).toEqual(["720m", "andrew-bigs", "baylingual-entertainment", "dan-perales", "flavorful-croissants", "not-daf"]);
    // the two label runners live in content/artists-label.json
    const label = ArtistsFile.parse(load("artists-label"));
    expect(label).toHaveLength(2);
    expect(new Set([...artists, ...label].map((a) => a.slug)).size).toBe(artists.length + label.length);
    expect(artists.find((a) => a.slug === "not-daf")?.name).toBe("Not Däf");
    expect(artists.find((a) => a.slug === "720m")?.name).toBe("720M");
  });

  it("never auto-approves assets and never self-hosts audio", () => {
    const assets = AssetsFile.parse(load("assets"));
    for (const a of assets.filter((x) => x.source === "placeholder")) expect(a.publishApproved).toBe(false);
    for (const a of assets.filter((x) => x.type === "audio")) expect(a.previews).toEqual([]);
  });

  it("public tree ships only approved assets, without internal fields", () => {
    const rawAssets = load("assets") as Record<string, unknown>[];
    expect(rawAssets.length).toBeGreaterThan(0);
    for (const a of rawAssets) {
      expect(a.publishApproved).toBe(true);
      for (const k of ["sourcePath", "provenance", "notes", "hash", "ingestedAt", "sizeBytes"]) expect(a).not.toHaveProperty(k);
    }
    for (const b of load("beats") as Record<string, unknown>[]) for (const k of ["drop" + "boxPath", "notes", "measurement", "contentHash", "mp3File"]) expect(b).not.toHaveProperty(k);
  });

  it("never credits SoundCloud tracks to the Ricky identity, and keeps source titles", () => {
    const sc = SoundCloudFile.parse(load("soundcloud"));
    for (const t of sc) {
      expect(t.artists).not.toContain("ricky");
      if (/ricky|rickayyy|rickaaay/i.test(t.sourceTitle ?? t.title)) expect(t.artists).toEqual(["flavorful-croissants", "720m"]);
      if (t.kind === "track") expect(t.sourceTitle).toBe(t.title);
    }
  });

  it("only embeds verified SoundCloud items, all on the official profile", () => {
    const sc = SoundCloudFile.parse(load("soundcloud"));
    for (const t of sc.filter((x) => x.verified)) expect(t.url).toMatch(/^https:\/\/soundcloud\.com\/user-536995429\//);
  });

  it("keeps every price unapproved and every checkout URL empty until sign-off", () => {
    const products = ProductsFile.parse(load("products"));
    for (const p of products) {
      expect(p.priceApproved).toBe(false);
      expect(p.checkoutUrl).toBeNull();
    }
  });

  it("beat payhipUrls are public, unique Payhip product pages (never admin/edit links)", () => {
    const beats = BeatsFile.parse(load("beats"));
    const urls = beats.map((b) => b.payhipUrl).filter(Boolean) as string[];
    for (const u of urls) expect(u).toMatch(/^https:\/\/payhip\.com\/b\/[A-Za-z0-9]+$/);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("solo productions have an audience flagged as inferred; collabs have none", () => {
    const sc = SoundCloudFile.parse(load("soundcloud"));
    for (const t of sc.filter((x) => x.kind === "track")) {
      if (t.credit === "solo") expect(["dj", "rapper"]).toContain(t.audience);
      else expect(t.audience).toBeUndefined();
    }
  });

  it("beat tiers use the approved prices; DJ lane and sample packs stay illustrative", () => {
    const tpl = ProductTemplatesSchema.parse(load("product-templates"));
    // owner-approved 2026-10-20: MP3 $10, WAV $25, Stems $50, Exclusive rights $500 (no separate "by inquiry" tier)
    expect(tpl.lanes.rapper.offers.map((o) => [o.title, o.price])).toEqual([["MP3 lease", 10], ["WAV lease", 25], ["Stems lease", 50], ["Exclusive rights", 500]]);
    expect(tpl.lanes.rapper.offers.every((o) => o.priceApproved)).toBe(true);
    expect(tpl.lanes.rapper.offers.find((o) => o.id === "exclusive")?.terms).toMatch(/off the store within 3 business days; earlier leases stay valid/i);
    expect(JSON.stringify(tpl.lanes.rapper)).not.toMatch(/inquiry|unlimited license/i);
    expect(JSON.stringify(tpl.lanes.rapper)).not.toMatch(/\b100\b/);
    expect(tpl.lanes.dj.offers.map((o) => o.price)).toEqual([5, 25, 7]);
    const packs = SamplePacksFile.parse(load("sample-packs"));
    // public build: no example packs (the page shows "Sample packs coming soon." instead)
    expect(packs.filter((p) => p.example || /example pack/i.test(p.title))).toEqual([]);
    for (const p of packs) {
      expect(p.priceApproved).toBe(false);
      expect(p.checkoutUrl).toBeNull();
      if (p.example) expect(p.status).toBe("upcoming");
      expect(p.price).toBeGreaterThanOrEqual(15);
      expect(p.price).toBeLessThanOrEqual(30);
    }
  });

  it("keeps physical merch inquiry-only (no price, no checkout)", () => {
    const products = ProductsFile.parse(load("products"));
    const merch = products.filter((p) => p.type === "merch");
    // public repo: the public top ten plus the parked older pieces (pruned from the public build), nothing else
    expect(merch.map((p) => p.id).sort()).toEqual([...ALL_MERCH].sort());
    for (const p of merch) {
      expect(p.inquireOnly).toBe(true);
      expect(p.price).toBeNull();
      expect(p.checkoutUrl).toBeNull();
      expect(p.status).not.toBe("available");
    }
    expect(products.find((p) => p.id === "merch-hotdo-g-tee-g-dog")?.brand).toBeNull();
    // owner: Baylingual apparel stays out of the public build (products and photos)
    expect(JSON.stringify([products, AssetsFile.parse(load("assets"))])).not.toMatch(/bay-merch-|baylingual-frog-(crewneck|tee)/);
  });

  it("shows the full merch lineup in production too (owner: live to browse, Oct 21, 2026), still not on sale", () => {
    const products = ProductsFile.parse(load("products"));
    const assets = AssetsFile.parse(load("assets"));
    const storeMerch = (mode: "production" | "preview") => visibleProducts(products, mode, assets).filter((p) => p.type === "merch" && p.listed).map((p) => p.id);
    expect(storeMerch("production").sort()).toEqual([...ALL_MERCH].sort());
    expect(storeMerch("preview").sort()).toEqual([...ALL_MERCH].sort());
    const byId = new Map(assets.map((a) => [a.id, a]));
    for (const p of products.filter((x) => x.colorways.length)) {
      expect(p.price).toBeNull();
      expect(p.checkoutUrl).toBeNull();
      expect(p.status).toBe("upcoming");
      // every view of every colorway is approved, so production galleries are complete (no gaps in the swipe strip)
      for (const id of [...p.colorways.flatMap((c) => [c.assetId, c.backAssetId, c.modelFrontAssetId, c.modelBackAssetId, c.blankBackAssetId, c.blankModelBackAssetId, ...(c.modelExtras ?? []).map((x) => x.assetId)].filter((x): x is string => !!x)), ...p.lifestyleAssetIds]) {
        expect(byId.get(id)?.publishApproved, id).toBe(true);
        expect(isAssetVisible(byId.get(id)!, "production")).toBe(true);
      }
    }
  });

  it("HOTDO G (G Dog) holds the HOTDO G slot on both cuts (swap 1, Nov 2): cleared copy, flats only, no box art left", () => {
    const products = ProductsFile.parse(load("products"));
    const assets = AssetsFile.parse(load("assets"));
    const hot = products.filter((p) => /hotdo/.test(p.id));
    expect(hot.map((p) => p.id)).toEqual(["merch-hotdo-g-tee-g-dog", "merch-hotdo-g-womens-boxy-tee-g-dog"]);
    expect(hot.map((p) => p.category)).toEqual(["men", "women"]);
    for (const p of hot) {
      expect(p.design).toBe("hotdo-g-g-dog");
      expect(p.summary).toBe("Is it a Hotdo? Is it a g? Yes. One awkward space, and a G bent out of a single sausage. Look closely at the squiggle on top: it has a pulse.");
      expect(p.colorways.map((c) => c.slug)).toEqual(["black-white", "ivory-taco-red", "butter-taco-red"]);
    }
    expect(assets.filter((a) => /^merch-hotdo-?g-/.test(a.id) && !/g-dog/.test(a.id))).toEqual([]);
    expect(JSON.stringify([products, assets])).not.toMatch(/bold box|hotdog-tee-white|gap-dog/i);
  });

  it("models the Dan Perales umbrella and owner uploads", () => {
    const artists = ArtistsFile.parse(load("artists"));
    expect(artists.filter((a) => a.parentArtist === "dan-perales").map((a) => a.slug)).toEqual(["baylingual-entertainment"]);
    const assets = AssetsFile.parse(load("assets"));
    for (const a of assets.filter((x) => x.source === "owner-upload")) {
      expect(a.license).toBe("owned");
      expect(a.publishApproved).toBe(true);
    }
    // owner: the Baylingual merch clip stays out of the public build with the shirts
    expect(assets.filter((a) => a.type === "video")).toEqual([]);
  });

  it("rejects malformed entries", () => {
    const bad = raw();
    bad.products = [...bad.products, { id: "Bad Id", title: "x", type: "download", price: -1, status: "live", checkoutProvider: "paypal", summary: "" }];
    expect(validateCatalog(bad).length).toBeGreaterThan(0);
    const dangling = raw();
    dangling.products = [...dangling.products, { id: "ghost", title: "x", type: "print", assetId: "does-not-exist", price: 1, status: "available", checkoutProvider: "none", summary: "x" }];
    expect(validateCatalog(dangling)).toContain("products.ghost: unknown asset does-not-exist");
  });

  it("Release playlist section: 720M collabs only, in playlist order, solo tracks left out", async () => {
    const { collectionTracks } = await import("@/lib/catalog");
    const t = collectionTracks("release");
    expect(t).toHaveLength(29);
    expect(t.map((x) => x.displayTitle)).toEqual(expect.arrayContaining(["mello life", "wearethecolorzx", "canoexz"]));
    expect(t[0].displayTitle).toBe("goodsleepix");
    expect(t[1].displayTitle).toBe("we r the total air pt 2");
    expect(t.at(-1)?.displayTitle).toBe("pursuitofme");
    for (const x of t) {
      expect(x.artists).toEqual(["flavorful-croissants", "720m"]);
      expect(x.displayTitle).not.toMatch(/x ricky/i);
    }
    expect(t.map((x) => x.displayTitle)).not.toEqual(expect.arrayContaining(["olecropduster", "Big Smile", "elaphantzx"]));
    expect(t.find((x) => x.id === "deltaluvtwo-x-ricky")?.description).toBeUndefined();
  });
});

describe("merch v4 lineup", () => {
  it("9 grid heroes are 9 different shirt colours; the 3 new tees are unapproved drafts", () => {
    const products = ProductsFile.parse(load("products"));
    const assets = AssetsFile.parse(load("assets"));
    const merch = products.filter((p) => V2_IDS.includes(p.id));
    const heroes = merch.map((p) => p.colorways.find((c) => c.slug === p.heroColorway)!.name.split(" / ")[0]);
    expect(new Set(heroes)).toEqual(new Set(["True Navy", "Violet", "Burnt Orange", "Ivory", "Graphite", "Black", "Washed Denim", "Blue Spruce", "Chalky Mint"]));
    for (const id of ["merch-redwood-lif-e-heartbeat-tee", "merch-redwood-lif-e-grove-tee", "merch-make-art-with-friends-tee"]) {
      const p = merch.find((x) => x.id === id)!;
      expect(p.status).toBe("upcoming");
      expect(p.price).toBeNull();
      for (const a of assets.filter((x) => x.id.startsWith(id))) expect(a.publishApproved).toBe(true); // approved with the lineup, Oct 21, 2026
    }
  });
});

describe("merch colorway counts", () => {
  it("every tee has exactly 3 colorways, except Make Art With Friends (4, hero Chalky Mint)", () => {
    const products = ProductsFile.parse(load("products"));
    for (const p of products.filter((x) => V2_IDS.includes(x.id))) {
      expect(p.colorways.length, p.id).toBe(p.id === "merch-make-art-with-friends-tee" ? 4 : 3);
    }
    const ma = products.find((p) => p.id === "merch-make-art-with-friends-tee")!;
    expect(ma.colorways.map((c) => c.slug)).toEqual(["chalky-mint-plum", "butter-plum", "grape-acid-green", "chambray-plum"]);
    expect(ma.heroColorway).toBe("chalky-mint-plum");
  });
});

describe("merch final cast", () => {
  const products = ProductsFile.parse(load("products"));
  const assets = AssetsFile.parse(load("assets"));
  const merch = products.filter((p) => [...V2_IDS, ...TANK_IDS].includes(p.id));
  const modelIds = (c: (typeof merch)[number]["colorways"][number]) =>
    [c.modelFrontAssetId, c.modelBackAssetId, c.blankModelBackAssetId, ...(c.modelExtras ?? []).map((x) => x.assetId), ...(c.models ?? []).flatMap((m) => [m.frontAssetId, m.backAssetId, m.blankBackAssetId])]
      .filter((x): x is string => !!x)
      .filter((x, i, all) => all.indexOf(x) === i);

  // Colourways whose model shots aren't in yet borrow the hero's (labelled "shown in <hero>"). None since the Kai / Tessa import (Oct 22 2026).
  const PENDING_MODEL_SHOTS = new Set<string>();
  /** The public set reshot on two models (owner, Oct 22 2026: "only m/f and only those two models ... for everything"). */
  const KAI_IDS = ["merch-feelings-notice-tee", "merch-make-art-with-friends-tee", "merch-heartbeat-croissant-pocket-tee"];
  it("every colorway has its own on-model front and back; every tank colorway also has a blank-back model shot", () => {
    for (const p of merch)
      for (const c of p.colorways) {
        if (PENDING_MODEL_SHOTS.has(`${p.id}/${c.slug}`)) continue;
        expect(c.modelFrontAssetId, `${p.id}/${c.slug}`).toBeTruthy();
        expect(c.modelBackAssetId, `${p.id}/${c.slug}`).toBeTruthy();
        // the older cast had a blank-back shot per tank
        if (TANK_IDS.includes(p.id) && !KAI_IDS.includes(p.id)) expect(c.blankModelBackAssetId, `${p.id}/${c.slug}`).toBeTruthy();
      }
  });

  // head-turned shots replaced by true backs on Oct 22, 2026 (round 3): kept on file, no longer shown (admin-only products; the public set's
  // stand-in shots were deleted with the Kai / Tessa reshoot)
  const SUPERSEDED = new Set([
    "merch-heartbeat-triangle-tee-graphite-electric-orange-model-back-2",
    "merch-no-thanks-tee-burnt-orange-plum-model-back-2",
  ]);

  it("110 on-model photos in all (Kai shots on the public tees + the older cast on the off-line pieces), each used once, each with a full set of web sizes", () => {
    const ids = merch.flatMap((p) => p.colorways.flatMap(modelIds));
    expect(ids).toHaveLength(110);
    expect(new Set(ids).size).toBe(110);
    const byId = new Map(assets.map((a) => [a.id, a]));
    for (const id of ids) {
      const a = byId.get(id)!;
      expect(a, id).toBeDefined();
      expect(a.previews.map((x) => `${x.format}${x.width}`).sort(), id).toEqual(["avif1500", "avif480", "avif960", "webp1500", "webp160", "webp480", "webp960"]);
    }
    // no stray on-model records left over from the earlier shoot
    // (+ the 4 Tessa shots on the women's boxy tees; the new top-ten pieces have no model shots)
    const tessa = products.filter((p) => WOMENS_IDS.includes(p.id)).flatMap((p) => p.colorways.flatMap(modelIds));
    expect(tessa).toHaveLength(4);
    expect(assets.filter((a) => a.id.startsWith("merch-") && /-model-/.test(a.id) && !SUPERSEDED.has(a.id)).map((a) => a.id).sort()).toEqual([...ids, ...tessa].sort());
    for (const id of SUPERSEDED) {
      expect(byId.has(id), id).toBe(true);
      expect(ids).not.toContain(id);
    }
  });

  it("every Santa Cruz tank carries the full cast; extra shots are numbered by side", () => {
    const counts = Object.fromEntries(merch.filter((p) => TANK_IDS.includes(p.id)).map((p) => [p.id, p.colorways.flatMap(modelIds).length]));
    expect(counts).toEqual({ "merch-santa-cruz-sun-tank": 13, "merch-santa-cruz-redwoods-tank": 14, "merch-santa-cruz-sunset-tank": 13 });
    for (const p of merch) for (const c of p.colorways) for (const x of c.modelExtras ?? []) expect(x.assetId).toMatch(new RegExp(`-model-${x.side}-\\d+$`));
  });

  it("launch line (unisex-fit blanks): listed as Men; every colorway has the 4-image gallery (front, back, one model front/back)", () => {
    const byId = new Map(assets.map((a) => [a.id, a]));
    for (const id of MENS_LAUNCH_IDS) {
      const p = products.find((x) => x.id === id)!;
      expect(p.category, id).toBe("men");
      for (const cat of ["men", "women"] as const) {
        const views = resolveViews(p.colorways, p.heroColorway, (x) => byId.has(x), cat);
        p.colorways.forEach((c, i) => {
          // a one-model colourway (Kai) only has its own cut to test; the older pairs are checked for both
          if (c.models?.length === 1 && cat !== p.category) return;
          expect(views[i].map((v) => v.kind), `${id}/${c.slug}/${cat}`).toEqual(["front", "back", "model-front", "model-back"]);
          if (PENDING_MODEL_SHOTS.has(`${id}/${c.slug}`)) {
            // own flats, hero's model shots until this colorway's are shot
            expect(views[i].slice(0, 2).map((v) => v.assetId)).toEqual([c.assetId, c.backAssetId]);
            expect(views[i].slice(2).every((v) => v.fromHero)).toBe(true);
            return;
          }
          expect(views[i].map((v) => v.label)).toEqual(["Front", "Back", "On model (front)", "On model (back)"]);
          expect(views[i].every((v) => !v.fromHero)).toBe(true);
          // the model's shots are this colorway's own photos, front and back of the same person
          const m = pickModel(c.models, cat)!;
          expect(m.gender).toBe(cat === "men" ? "male" : "female");
          expect(views[i].slice(2).map((v) => v.assetId)).toEqual([m.frontAssetId, m.backAssetId]);
          for (const v of views[i].slice(2)) expect(v.assetId.startsWith(`${c.assetId.replace(/-gh$/, "")}-model-`), v.assetId).toBe(true);
        });
      }
    }
    // only two shop categories exist: hidden products default to Men (schema default); women's cuts are Women
    expect(products.filter((p) => p.type === "merch").every((p) => ["men", "women"].includes(p.category))).toBe(true);
    for (const id of WOMENS_IDS) expect(products.find((x) => x.id === id)!.category, id).toBe("women");
    expect(JSON.stringify(load("products"))).not.toMatch(/"category":\s*"unisex"/);
  });

  it("the shop lists only the launch line, in order; the other merch keeps its page but is off the grids", () => {
    const merchAll = visibleProducts(products, "production", assets).filter((p) => p.type === "merch" && p.listed);
    expect(merchAll.filter((p) => p.shopListed).map((p) => p.id)).toEqual(LAUNCH_IDS);
    expect(merchAll.filter((p) => !p.shopListed).map((p) => p.id).sort()).toEqual([...V2_IDS, ...TANK_IDS].filter((id) => !LAUNCH_IDS.includes(id)).sort());
  });

  it("women's boxy tees: Women category, S-2XL, front + back flats then Tessa front + back", () => {
    for (const id of WOMENS_BOXY_IDS) {
      const p = products.find((x) => x.id === id)!;
      expect(p.category).toBe("women");
      expect(p.shopListed).toBe(true);
      expect(p.price).toBeNull();
      expect(p.sizes).toEqual(["S", "M", "L", "XL", "2XL"]);
      expect(p.colorways).toHaveLength(1);
      for (const c of p.colorways) expect(c.models?.map((m) => [m.gender, m.frontAssetId, m.backAssetId])).toEqual([["female", `${p.id}-${c.slug}-model-front-tessa`, `${p.id}-${c.slug}-model-back-tessa`]]);
      const views = resolveViews(p.colorways, p.heroColorway, (x) => assets.some((a) => a.id === x), p.category);
      for (const v of views) expect(v.map((x) => x.kind)).toEqual(["front", "back", "model-front", "model-back"]);
    }
  });

  it("top-ten new pieces: flats only (no model shots), unpriced, inquiry-only; tanks carry the front-only line and the coast disclaimer", () => {
    const byId = new Map(assets.map((a) => [a.id, a]));
    const REQ = "Original artwork inspired by the California coast. Not affiliated with any park, attraction or brand.";
    for (const id of FLAT_ONLY_IDS) {
      const p = products.find((x) => x.id === id)!;
      expect(p.price, id).toBeNull();
      expect(p.inquireOnly, id).toBe(true);
      expect(p.checkoutProvider, id).toBe("none");
      expect(p.category, id).toBe(/womens/.test(id) ? "women" : "men");
      if (/womens/.test(id)) expect(p.sizes, id).toEqual(/tank/.test(id) ? ["XS", "S", "M", "L", "XL"] : ["S", "M", "L", "XL", "2XL"]);
      for (const c of p.colorways) {
        expect(c.models, `${id}/${c.slug}`).toBeUndefined();
        expect(c.modelFrontAssetId ?? c.modelBackAssetId, `${id}/${c.slug}`).toBeUndefined();
        for (const x of [c.assetId, c.backAssetId].filter((v): v is string => !!v)) {
          expect(byId.get(x)?.previews.map((v) => `${v.format}${v.width}`).sort(), x).toEqual(["avif1200", "avif480", "avif960", "webp1200", "webp160", "webp480", "webp960"]);
          for (const v of byId.get(x)!.previews) expect(v.src.startsWith(`/media/${id}/${c.slug}-`), v.src).toBe(true);
        }
      }
      if (/tank/.test(id)) {
        expect(p.details?.at(-1), id).toBe(REQ);
        expect(p.details?.[0], id).toMatch(/^Front only: .* No back print\.$/);
        expect(p.colorways.every((c) => !c.backAssetId), id).toBe(true);
      }
    }
    // Lighthouse Point keeps the OpenStreetMap credit (ODbL) on both cuts
    for (const id of ["merch-lighthouse-point-tank", "merch-lighthouse-point-womens-tank"]) expect(products.find((x) => x.id === id)!.details, id).toContain("Map data © OpenStreetMap contributors.");
    // Island Dusk: concept art, front + back flats, never the superseded v1 record
    expect(products.find((x) => x.id === "merch-island-dusk-hoodie")!.details).toEqual(["Concept art. The final print may change."]);
    expect(JSON.stringify(products)).not.toMatch(/kaua/i);
    // Melt Wave: Inverse (set aside) and Mirror (v10), black, flats only
    const mw = products.filter((p) => /melt-wave/.test(p.id));
    expect(mw.map((p) => p.id)).toEqual(["merch-melt-wave-tee-inverse", "merch-melt-wave-tee"]);
    for (const m of mw) expect(m.colorways.map((c) => c.slug)).toEqual(["black"]);
  });
});

describe("merch follow-ups, Oct 22, 2026", () => {
  const products = ProductsFile.parse(load("products"));
  const assets = AssetsFile.parse(load("assets"));
  const byId = new Map(assets.map((a) => [a.id, a]));
  const find = (id: string) => products.find((p) => p.id === id)!;
  const cw = (id: string, slug: string) => find(id).colorways.find((c) => c.slug === slug)!;
  const KAI = ["merch-feelings-notice-tee", "merch-make-art-with-friends-tee", "merch-heartbeat-croissant-pocket-tee"];

  it("over-the-shoulder backs are replaced by true-back shots (old files kept, no longer shown; admin-only no thanks, the public set was reshot)", () => {
    const swaps: [string, string, "male" | "female", string][] = [
      ["merch-no-thanks-tee", "graphite-cream", "female", "merch-no-thanks-tee-graphite-cream-model-back-3"],
    ];
    for (const [id, slug, g, back] of swaps) {
      const p = find(id);
      const i = p.colorways.findIndex((c) => c.slug === slug);
      expect(p.colorways[i].models!.find((m) => m.gender === g)!.backAssetId).toBe(back);
      const shown = resolveViews(p.colorways, p.heroColorway, (x) => byId.has(x), g === "male" ? "men" : "women")[i].map((v) => v.assetId);
      expect(shown).toContain(back);
      expect(shown).not.toContain(back.replace(/-3$/, ""));
    }
  });

  it("Make Art Chambray / Plum (replaced Grape / Black): Kai front and back", () => {
    expect(cw("merch-make-art-with-friends-tee", "chambray-plum").models).toEqual([{ gender: "male", frontAssetId: "merch-make-art-with-friends-tee-chambray-plum-model-front-kai", backAssetId: "merch-make-art-with-friends-tee-chambray-plum-model-back-kai" }]);
    expect(products.find((p) => p.id === "merch-make-art-with-friends-tee")!.colorways.some((c) => c.slug === "grape-black")).toBe(false);
  });
  it("round 3: every displayed back is a true back; (admin-only Heartbeat Triangle and no thanks; the public set was reshot on Kai / Tessa)", () => {
    const swaps: [string, string, "male" | "female", "backAssetId" | "frontAssetId", string][] = [
      ["merch-heartbeat-triangle-tee", "graphite-electric-orange", "female", "backAssetId", "merch-heartbeat-triangle-tee-graphite-electric-orange-model-back-3"],
      ["merch-heartbeat-triangle-tee", "true-navy-cream", "female", "backAssetId", "merch-heartbeat-triangle-tee-true-navy-cream-model-back-3"],
      ["merch-no-thanks-tee", "burnt-orange-plum", "female", "backAssetId", "merch-no-thanks-tee-burnt-orange-plum-model-back-3"],
    ];
    for (const [id, slug, g, key, want] of swaps) {
      const p = find(id);
      const i = p.colorways.findIndex((c) => c.slug === slug);
      const m = p.colorways[i].models!.find((x) => x.gender === g)!;
      expect(m[key], `${id}/${slug}/${g}`).toBe(want);
      expect(byId.has(want), want).toBe(true);
      expect(resolveViews(p.colorways, p.heroColorway, (x) => byId.has(x), g === "male" ? "men" : "women")[i].map((v) => v.assetId)).toContain(want);
    }
  });

  it("Men / Women reshoot: every public colourway shows only Kai (Men) or Tessa (Women), front and back", () => {
    for (const p of products.filter((x) => KAI.includes(x.id) || WOMENS_BOXY_IDS.includes(x.id))) {
      const who = p.category === "women" ? "tessa" : "kai";
      for (const [i, c] of p.colorways.entries()) {
        expect(c.models, `${p.id}/${c.slug}`).toHaveLength(1);
        const shown = resolveViews(p.colorways, p.heroColorway, (x) => byId.has(x), p.category)[i];
        expect(shown.map((v) => v.kind), `${p.id}/${c.slug}`).toEqual(["front", "back", "model-front", "model-back"]);
        for (const v of shown.slice(2)) expect(v.assetId, `${p.id}/${c.slug}`).toMatch(new RegExp(`-model-(front|back)-${who}$`));
        expect(JSON.stringify(c)).not.toMatch(/-model-(front|back)(-\d+)?(-blank)?"/);
      }
    }
    expect(find("merch-heartbeat-croissant-pocket-tee")).toMatchObject({ category: "men", design: "heartbeat-croissant-pocket" });
  });

});
