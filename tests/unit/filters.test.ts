import { describe, expect, it } from "vitest";
import { assetMarker, formatPrice, isAssetVisible, isEmbedVisible, productsFor, searchAssets, visibleProducts, visibleTracks } from "@/lib/catalog/filters";
import { AssetSchema, ProductSchema, SoundCloudTrackSchema, type Asset, type Product } from "@/lib/catalog/schema";

const asset = (o: Partial<Asset> = {}): Asset =>
  AssetSchema.parse({ id: "a", title: "A", type: "artwork", source: "owner-upload", license: "owned", orientation: "square", width: 10, height: 10, ...o });
const product = (o: Partial<Product> = {}): Product =>
  ProductSchema.parse({ id: "p", title: "P", type: "download", price: 5, status: "available", checkoutProvider: "payhip", summary: "s", ...o });

describe("asset visibility", () => {
  it("shows only approved assets in production", () => {
    expect(isAssetVisible(asset({ publishApproved: true }), "production")).toBe(true);
    expect(isAssetVisible(asset({ publishApproved: false }), "production")).toBe(false);
  });
  it("shows unapproved assets in preview with the right marker", () => {
    expect(isAssetVisible(asset(), "preview")).toBe(true);
    expect(assetMarker(asset())).toBe("unapproved");
    expect(assetMarker(asset({ source: "placeholder" }))).toBe("placeholder");
    expect(assetMarker(asset({ publishApproved: true }))).toBe("none");
  });
});

describe("product filtering", () => {
  const assets = [asset({ id: "ok", publishApproved: true }), asset({ id: "pending" })];
  const products = [
    product({ id: "draft", status: "draft" }),
    product({ id: "up", status: "upcoming", order: 1 }),
    product({ id: "av", status: "available", order: 5 }),
    product({ id: "needs-approval", assetId: "pending" }),
    product({ id: "approved-asset", assetId: "ok", order: 9 }),
    product({ id: "missing-asset", assetId: "nope" }),
  ];
  it("never renders drafts or products with missing assets", () => {
    const ids = visibleProducts(products, "preview", assets).map((p) => p.id);
    expect(ids).not.toContain("draft");
    expect(ids).not.toContain("missing-asset");
  });
  it("hides products whose asset is unapproved in production", () => {
    const ids = visibleProducts(products, "production", assets).map((p) => p.id);
    expect(ids).toEqual(["av", "approved-asset", "up"]);
  });
  it("lists available before upcoming", () => {
    const ids = visibleProducts(products, "preview", assets).map((p) => p.status);
    expect(ids.indexOf("upcoming")).toBeGreaterThan(ids.lastIndexOf("available"));
  });
  it("orders track actions download → stems → license", () => {
    const all = [product({ id: "l", type: "license", price: null }), product({ id: "s", type: "stems" }), product({ id: "d", type: "download" })];
    expect(productsFor(["l", "s", "d"], all).map((p) => p.id)).toEqual(["d", "s", "l"]);
  });
});

describe("prices", () => {
  it("formats fixed, PWYW and inquiry prices", () => {
    expect(formatPrice(product({ price: 5 })).label).toBe("$5");
    expect(formatPrice(product({ price: 1.99 })).label).toBe("$1.99");
    expect(formatPrice(product({ price: 0, payWhatYouWant: true })).label).toBe("Pay what you want");
    expect(formatPrice(product({ price: 3, payWhatYouWant: true })).label).toBe("$3+");
    expect(formatPrice(product({ price: null })).label).toBe("By inquiry");
  });
});

describe("embeds and search", () => {
  const t = (o: object) => SoundCloudTrackSchema.parse({ id: "t", url: "https://soundcloud.com/u/t", title: "T", ...o });
  it("hides unverified embeds in production only", () => {
    expect(isEmbedVisible({ verified: false }, "production")).toBe(false);
    expect(isEmbedVisible({ verified: false }, "preview")).toBe(true);
    expect(visibleTracks([t({ id: "b", order: 2 }), t({ id: "a", order: 1, verified: true })], "production").map((x) => x.id)).toEqual(["a"]);
  });
  it("searches titles, tags and projects with filters", () => {
    const list = [asset({ id: "1", title: "Sunset", tags: ["beach"], artist: "not-daf" }), asset({ id: "2", title: "Mech", type: "illustration" })];
    expect(searchAssets(list, "beach").map((a) => a.id)).toEqual(["1"]);
    expect(searchAssets(list, "", { type: "illustration" }).map((a) => a.id)).toEqual(["2"]);
    expect(searchAssets(list, "", { artist: "not-daf" }).map((a) => a.id)).toEqual(["1"]);
  });
});
