import { describe, expect, it } from "vitest";
import products from "@content/products.json";
import assets from "@content/assets.json";
import setJson from "@content/merch-public-set.json";
import { checkPublicSet, isPubliclyVisible, merchFilterOn, publicMerchSlugs, slugOfProductId, withPublicSetListing, type MerchPublicSet } from "@/lib/merch-visibility";
import { plan, productAssetIds } from "../../scripts/prune-admin-only-media.mjs";

const set = setJson as unknown as MerchPublicSet;
const merch = products.filter((p) => p.type === "merch");
const slugs = merch.map((p) => slugOfProductId(p.id));

describe("public merch set", () => {
  it("is at most ten design slots (eight: four kept after six were set aside, the Nov 2 picks plus Monarch Swell Tank, one Nov 2 pick later set aside), all real product slugs", () => {
    expect(checkPublicSet(set, slugs)).toEqual([]);
    expect(set.slots.length).toBe(8);
  });
  it("holds the four designs left after the owner set six aside (Nov 2, 2026, 10:02 PM PT) plus his Nov 2 picks and Monarch Swell Tank, minus the one pick set aside Nov 10, Men + Women cuts where they exist", () => {
    expect([...publicMerchSlugs(set)]).toEqual([
      "make-art-with-friends-tee",
      "make-art-with-friends-womens-boxy-tee",
      "heartbeat-croissant-pocket-tee",
      "paddle-back-round-tank",
      "paddle-back-round-womens-tank",
      "triangle-surfer-pocket-tee",
      "here-comes-another-one-tank",
      "here-comes-another-one-womens-tank",
      "lighthouse-point-tank",
      "lighthouse-point-womens-tank",
      "island-dusk-hoodie",
      "monarch-swell-tank",
      "monarch-swell-tank-womens",
    ]);
    expect(publicMerchSlugs({ slots: [{ slot: "hoodie", products: [], untilFilled: ["new-hoodie"] }] })).toEqual(new Set(["new-hoodie"]));
  });
  it("plain Heartbeat Triangle, no thanks and the set-aside designs are admin-only", () => {
    const pub = publicMerchSlugs(set);
    for (const s of ["hotdo-g-tee-g-dog", "hotdo-g-womens-boxy-tee-g-dog", "feelings-notice-tee", "feelings-notice-womens-boxy-tee", "triangle-surfer-tee", "last-one-i-swear-tank", "last-one-i-swear-womens-tank", "never-ending-set-ribbon-tank", "never-ending-set-ribbon-womens-tank", "melt-wave-tee-inverse", "melt-wave-tee", "level-headed-tank", "hotdo-g-tee-in-the-bun"]) expect(pub.has(s), s).toBe(false);
    expect(pub.has("heartbeat-triangle-tee")).toBe(false);
    expect(pub.has("no-thanks-tee")).toBe(false);
  });
  it("lists the Men cut first, then the Women cut, and says nothing about Unisex", () => {
    for (const sl of set.slots.filter((x) => x.products.length === 2)) {
      expect(products.find((p) => p.id === `merch-${sl.products[1]}`)!.category, sl.products[1]).toBe("women");
      expect(products.find((p) => p.id === `merch-${sl.products[0]}`)!.category, sl.products[0]).not.toBe("women");
    }
    expect(JSON.stringify(setJson)).not.toMatch(/unisex/i);
  });
  it("flags a broken set", () => {
    expect(checkPublicSet({ slots: [{ slot: "shirt", products: ["nope"] }] }, slugs)).toEqual(expect.arrayContaining(["unknown product slug: nope"]));
    expect(checkPublicSet({ slots: [] }, slugs)).toEqual(["expected 1 to 10 design slots, got 0"]);
    expect(checkPublicSet({ slots: Array.from({ length: 11 }, () => ({ slot: "shirt" as const, products: ["make-art-with-friends-tee"] })) }, slugs)).toEqual(["expected 1 to 10 design slots, got 11"]);
    expect(checkPublicSet({ slots: [{ slot: "shirt", products: ["nope"] }] }, slugs)).toEqual(expect.arrayContaining(["unknown product slug: nope"]));
  });
});

describe("build-time filter", () => {
  it("is OFF unless MERCH_PUBLIC_SET=1", () => {
    expect(merchFilterOn({})).toBe(false);
    expect(merchFilterOn({ MERCH_PUBLIC_SET: "0" })).toBe(false);
    expect(merchFilterOn({ MERCH_PUBLIC_SET: "1" })).toBe(true);
  });
  it("off: every product stays; on: only public merch, all non-merch stays", () => {
    expect(products.every((p) => isPubliclyVisible(p, false, set))).toBe(true);
    const on = products.filter((p) => isPubliclyVisible(p, true, set));
    expect(on.filter((p) => p.type !== "merch").length).toBe(products.filter((p) => p.type !== "merch").length);
    expect(on.filter((p) => p.type === "merch").map((p) => p.id).sort()).toEqual(merch.filter((p) => publicMerchSlugs(set).has(slugOfProductId(p.id))).map((p) => p.id).sort());
  });
  it("Heartbeat Croissant Pocket Tee: on the shop grid under the filter (all three colourways), unchanged without it", () => {
    const tee = products.find((p) => p.id === "merch-heartbeat-croissant-pocket-tee")!;
    expect(tee.colorways.map((c) => c.name)).toEqual(["Burnt Orange / Plum", "Ivory / Plum", "Graphite / Coral"]);
    expect(isPubliclyVisible(tee, true, set)).toBe(true);
    const on = withPublicSetListing(tee, true, set);
    expect(on.shopListed).toBe(true);
    expect(on.colorways).toEqual(tee.colorways);
    expect(withPublicSetListing(tee, false, set).shopListed).toBe(tee.shopListed);
    expect(withPublicSetListing(products.find((p) => p.id === "merch-no-thanks-tee")!, true, set)).toBe(products.find((p) => p.id === "merch-no-thanks-tee"));
    // shop grid under the filter: 8 designs (12 listings)
    const grid = products.filter((p) => p.type === "merch" && p.listed && isPubliclyVisible(p, true, set)).map((p) => withPublicSetListing(p, true, set)).filter((p) => p.shopListed !== false);
    expect(grid.map((p) => slugOfProductId(p.id)).sort()).toEqual([...publicMerchSlugs(set)].sort());
  });
  it("keeps every colourway of a public product and all its images (never filters by colour)", () => {
    const pl = plan(products, assets, set);
    const adminOnly = new Set(pl.adminOnlyAssetIds);
    const tee = products.find((p) => p.id === "merch-heartbeat-croissant-pocket-tee")!;
    for (const c of tee.colorways as Array<Record<string, string>>) {
      const ids = [c.assetId, c.backAssetId, c.modelFrontAssetId, c.modelBackAssetId];
      expect(ids.every(Boolean), c.slug).toBe(true);
      for (const id of ids) {
        expect(adminOnly.has(id!), id).toBe(false);
        expect(productAssetIds(tee), id).toContain(id);
      }
    }
    expect(pl.publicAssetIds).toEqual(expect.arrayContaining(productAssetIds(tee)));
    for (const f of pl.adminOnlyFiles) expect(f, f).not.toMatch(/heartbeat-croissant-pocket-tee/);
    // same for every public product
    for (const p of products.filter((x) => pl.publicIds.includes(x.id))) for (const id of productAssetIds(p)) expect(adminOnly.has(id), `${p.id}: ${id}`).toBe(false);
  });
  it("prune plan never removes an image a public product uses", () => {
    const pl = plan(products, assets, set);
    const publicAssets = new Set(products.filter((p) => p.type !== "merch" || pl.publicIds.includes(p.id)).flatMap(productAssetIds));
    expect(pl.adminOnlyAssetIds.filter((id: string) => publicAssets.has(id))).toEqual([]);
    expect(pl.adminIds.length + pl.publicIds.length).toBe(merch.length);
    expect(pl.adminOnlyFiles.length).toBeGreaterThan(0);
    expect(pl.adminOnlyFiles.every((f: string) => f.startsWith("/media/"))).toBe(true);
  });
});
