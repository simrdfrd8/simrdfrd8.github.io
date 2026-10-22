import { describe, expect, it } from "vitest";
import products from "@content/products.json";
import assets from "@content/assets.json";
import setJson from "@content/merch-public-set.json";
import snapJson from "@content/catalog-published.json";
import { isPubliclyVisible, publicMerchSlugs, withPublishedColorways, type MerchPublicSet } from "@/lib/merch-visibility";
import { publishedPrice, type PublishedCatalog } from "@/lib/published-catalog";
import { checkSnapshot, plan, productAssetIds } from "../../scripts/prune-admin-only-media.mjs";

const snap = snapJson as unknown as PublishedCatalog;
const set = setJson as unknown as MerchPublicSet;
const tee = products.find((p) => p.id === "merch-hotdog-tee-white")!;

describe("published snapshot (content/catalog-published.json)", () => {
  it("is valid, public-only, and publishes exactly Ricky's set today (no prices yet)", () => {
    expect(checkSnapshot(snap, products)).toEqual([]);
    expect([...publicMerchSlugs(snap)].sort()).toEqual([...publicMerchSlugs(set)].sort());
    expect(Object.values(snap.merch).every((e) => e.price_cents === null && e.sale === null)).toBe(true);
    expect(snap.bundles).toEqual([]);
    expect(JSON.stringify(snap)).not.toMatch(/cost|margin|visibility|private/i);
  });
  it("the filter now reads the snapshot (default source)", () => {
    const no = products.find((p) => p.id === "merch-no-thanks-tee")!;
    expect(isPubliclyVisible(no, true)).toBe(false);
    expect(isPubliclyVisible(tee, true)).toBe(true);
    expect(isPubliclyVisible(no, false)).toBe(true); // filter off = unchanged
  });
  it("prune plan from the snapshot equals the plan from the slot set", () => {
    expect(plan(products, assets, snap)).toEqual(plan(products, assets, set));
  });
  it("a private colourway of a public product: dropped from the page, its images become admin-only, hero moves", () => {
    const s: PublishedCatalog = JSON.parse(JSON.stringify(snap));
    delete s.merch["hotdog-tee-white"].colorways["white-taco-red"]; // the hero colourway
    const p = withPublishedColorways(tee as never, true, s) as typeof tee;
    expect(p.colorways.map((c) => c.slug)).toEqual(["black-white", "graphite-electric-orange"]);
    expect(p.heroColorway).toBe("black-white");
    expect(p.assetId).toBe(tee.colorways[1].assetId);
    expect(withPublishedColorways(tee as never, false, s)).toBe(tee);
    const pl = plan(products, assets, s);
    expect(pl.hiddenColorways).toEqual(["merch-hotdog-tee-white/white-taco-red"]);
    const hiddenIds = productAssetIds({ ...tee, assetId: null, galleryAssetIds: [], lifestyleAssetIds: [], colorways: [tee.colorways[0]] });
    for (const id of hiddenIds) expect(pl.adminOnlyAssetIds, id).toContain(id);
    for (const id of productAssetIds({ ...tee, assetId: null, colorways: tee.colorways.slice(1) })) expect(pl.adminOnlyAssetIds, id).not.toContain(id);
  });
  it("making a product private removes it everywhere", () => {
    const s: PublishedCatalog = JSON.parse(JSON.stringify(snap));
    delete s.merch["hotdog-tee-white"];
    expect(isPubliclyVisible(tee, true, s)).toBe(false);
    expect(plan(products, assets, s).adminIds).toContain("merch-hotdog-tee-white");
  });
  it("rejects unsafe or broken snapshots", () => {
    const bad = JSON.parse(JSON.stringify(snap));
    bad.merch["hotdog-tee-white"].unit_cost_cents = 900;
    bad.merch["nope"] = { price_cents: 1, sale: null, colorways: {} };
    bad.merch["feelings-notice-tee"].price_cents = 3000;
    bad.merch["feelings-notice-tee"].sale = { price_cents: 3000, starts_at: null, ends_at: null };
    bad.bundles = [{ slug: "x1", title: "X", description: "", price_cents: 100, items: [{ product: "no-thanks-tee", colorway: null, qty: 1 }] }];
    expect(checkSnapshot(bad, products)).toEqual(expect.arrayContaining(["snapshot must not contain unit_cost_cents", "snapshot names unknown product nope", "feelings-notice-tee: sale must be below the price", "bundle x1 holds a non-public product no-thanks-tee"]));
  });
  it("prices: colourway override wins; a sale shows only below the price", () => {
    const s: PublishedCatalog = JSON.parse(JSON.stringify(snap));
    s.merch["hotdog-tee-white"].price_cents = 3000;
    s.merch["hotdog-tee-white"].sale = { price_cents: 2400, starts_at: null, ends_at: null };
    s.merch["hotdog-tee-white"].colorways["black-white"] = { price_cents: 3200 };
    expect(publishedPrice("hotdog-tee-white", null, s)).toEqual({ price_cents: 3000, sale: { price_cents: 2400, starts_at: null, ends_at: null } });
    expect(publishedPrice("hotdog-tee-white", "black-white", s)).toEqual({ price_cents: 3200, sale: null });
    expect(publishedPrice("hotdog-tee-white", "white-taco-red", s)?.sale?.price_cents).toBe(2400);
    expect(publishedPrice("no-thanks-tee", null, s)).toBeNull();
    expect(publishedPrice("feelings-notice-tee", null, s)).toBeNull();
  });
});
