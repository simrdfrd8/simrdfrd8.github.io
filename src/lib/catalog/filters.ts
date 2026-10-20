import type { Asset, Product, Release, SoundCloudTrack } from "./schema";
import type { SiteMode } from "../env";

/** Pure visibility rules, unit-tested in tests/unit/filters.test.ts. */

export function isAssetVisible(asset: Asset, mode: SiteMode): boolean {
  if (asset.publishApproved) return true;
  return mode === "preview";
}

/** Should this asset carry the "PREVIEW – not approved" / placeholder marker? */
export function assetMarker(asset: Asset): "none" | "placeholder" | "unapproved" {
  if (asset.publishApproved) return "none";
  return asset.source === "placeholder" ? "placeholder" : "unapproved";
}

export function isProductVisible(product: Product, mode: SiteMode, assetsById: Map<string, Asset>): boolean {
  if (product.status === "draft") return false;
  if (product.assetId) {
    const asset = assetsById.get(product.assetId);
    if (!asset) return false;
    if (!isAssetVisible(asset, mode)) return false;
  }
  return true;
}

export function visibleProducts(products: Product[], mode: SiteMode, assets: Asset[]): Product[] {
  const byId = new Map(assets.map((a) => [a.id, a]));
  return products
    .filter((p) => isProductVisible(p, mode, byId))
    .sort((a, b) => Number(b.status === "available") - Number(a.status === "available") || a.order - b.order);
}

export function isEmbedVisible(item: { verified: boolean }, mode: SiteMode): boolean {
  return item.verified || mode === "preview";
}

export function sortByOrder<T extends { order: number; featured?: boolean }>(items: T[]): T[] {
  return [...items].sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false) || a.order - b.order);
}

export function visibleTracks(tracks: SoundCloudTrack[], mode: SiteMode) {
  return sortByOrder(tracks.filter((t) => isEmbedVisible(t, mode)));
}

export function visibleReleases(releases: Release[], mode: SiteMode) {
  return sortByOrder(releases.filter((r) => isEmbedVisible(r, mode)));
}

export type PriceLabel = { label: string; suffix?: string };

export function formatPrice(p: Pick<Product, "price" | "currency" | "payWhatYouWant">): PriceLabel {
  if (p.price === null) return { label: "By inquiry" };
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: p.currency,
    minimumFractionDigits: p.price % 1 === 0 ? 0 : 2,
  });
  if (p.payWhatYouWant) return p.price > 0 ? { label: `${fmt.format(p.price)}+`, suffix: "pay what you want" } : { label: "Pay what you want" };
  return { label: fmt.format(p.price) };
}

/** Products attached to a track/release, ordered so the primary purchase comes first. */
const ACTION_ORDER: Product["type"][] = ["download", "stems", "license", "sample-pack", "digital-art", "print", "merch", "service", "support"];
export function productsFor(ids: string[], products: Product[]): Product[] {
  const set = new Set(ids);
  return products.filter((p) => set.has(p.id)).sort((a, b) => ACTION_ORDER.indexOf(a.type) - ACTION_ORDER.indexOf(b.type));
}

export function searchAssets(assets: Asset[], query: string, filters: { type?: string; artist?: string } = {}): Asset[] {
  const q = query.trim().toLowerCase();
  return assets.filter((a) => {
    if (filters.type && filters.type !== "all" && a.type !== filters.type) return false;
    if (filters.artist && filters.artist !== "all" && a.artist !== filters.artist && !(a.artists ?? []).includes(filters.artist)) return false;
    if (!q) return true;
    return [a.title, a.project ?? "", a.artist ?? "", a.description ?? "", ...a.tags].join(" ").toLowerCase().includes(q);
  });
}
