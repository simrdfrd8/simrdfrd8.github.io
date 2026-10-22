/**
 * Public merch (data-driven): which merch products and colourways public visitors and customer accounts see.
 * Source of truth: the PUBLISHED catalog snapshot (content/catalog-published.json, see lib/published-catalog), exported from the
 * admin catalog manager. content/merch-public-set.json is the older slot list (1 tank, 3 shirts, 1 hoodie) it was seeded from;
 * every helper here still accepts it, so its tests keep guarding Ricky's picks.
 *
 * The filter is a BUILD-TIME switch, off by default: only `MERCH_PUBLIC_SET=1` at build time applies it.
 * When it is on, products (and colourways) not in the snapshot are left out of every page, and
 * scripts/prune-admin-only-media.mjs removes their images from out/ and fails the build if anything private is still named.
 */
import setJson from "@content/merch-public-set.json";
import { isPublishedCatalog, publishedCatalog, type PublishedCatalog } from "./published-catalog";

export type MerchSlot = { slot: "tank" | "shirt" | "hoodie"; products: string[]; untilFilled?: string[] };
export type MerchPublicSet = { slots: MerchSlot[] };
export type PublicSource = MerchPublicSet | PublishedCatalog;

export const merchPublicSet = setJson as unknown as MerchPublicSet;
export const slugOfProductId = (id: string) => id.replace(/^merch-/, "");

/** Slugs in a slot set (a hoodie slot with no products falls back to `untilFilled`), or the products a snapshot publishes. */
export function publicMerchSlugs(src: PublicSource = publishedCatalog): Set<string> {
  if (isPublishedCatalog(src)) return new Set(Object.keys(src.merch));
  return new Set(src.slots.flatMap((s) => (s.products.length ? s.products : s.untilFilled ?? [])));
}

/** Slot counts must stay 1 tank, 3 shirts, 1 hoodie. Returns problems (empty = fine). */
export function checkPublicSet(set: MerchPublicSet, knownSlugs: string[]): string[] {
  const out: string[] = [];
  const count = (k: MerchSlot["slot"]) => set.slots.filter((s) => s.slot === k).length;
  if (count("tank") !== 1) out.push(`expected 1 tank slot, got ${count("tank")}`);
  if (count("shirt") !== 3) out.push(`expected 3 shirt slots, got ${count("shirt")}`);
  if (count("hoodie") !== 1) out.push(`expected 1 hoodie slot, got ${count("hoodie")}`);
  for (const s of publicMerchSlugs(set)) if (!knownSlugs.includes(s)) out.push(`unknown product slug: ${s}`);
  return out;
}

export const merchFilterOn = (env: Record<string, string | undefined> = process.env) => env.MERCH_PUBLIC_SET === "1";

/** Keep non-merch products; keep merch only if the filter is off or the product is published. */
export function isPubliclyVisible(p: { id: string; type: string }, on = merchFilterOn(), src: PublicSource = publishedCatalog): boolean {
  return p.type !== "merch" || !on || publicMerchSlugs(src).has(slugOfProductId(p.id));
}

/**
 * With the filter on, every published product is on the shop grids (shopListed), even if products.json still has it
 * off for today's unfiltered site (e.g. the Heartbeat Croissant Pocket Tee holding the hoodie slot). Filter off = unchanged.
 */
export function withPublicSetListing<T extends { id: string; type: string; shopListed?: boolean }>(p: T, on = merchFilterOn(), src: PublicSource = publishedCatalog): T {
  return on && p.type === "merch" && p.shopListed === false && publicMerchSlugs(src).has(slugOfProductId(p.id)) ? { ...p, shopListed: true } : p;
}

type WithColorways = { id: string; type: string; assetId?: string | null; heroColorway?: string; colorways: { slug: string; assetId?: string }[] };
/**
 * With the filter on and a snapshot source, drop the colourways the snapshot doesn't list (admin set them private).
 * If the hero colourway is hidden, the first public colourway becomes the hero (and the product image). Off = unchanged.
 */
export function withPublishedColorways<T extends WithColorways>(p: T, on = merchFilterOn(), src: PublicSource = publishedCatalog): T {
  if (!on || p.type !== "merch" || !isPublishedCatalog(src)) return p;
  const e = src.merch[slugOfProductId(p.id)];
  if (!e) return p;
  const colorways = p.colorways.filter((c) => c.slug in e.colorways);
  if (colorways.length === p.colorways.length) return p;
  const hero = colorways.find((c) => c.slug === p.heroColorway) ?? colorways[0];
  const heroHidden = !!p.heroColorway && hero?.slug !== p.heroColorway;
  const assetHidden = p.colorways.some((c) => !(c.slug in e.colorways) && c.assetId === p.assetId);
  return { ...p, colorways, ...(heroHidden ? { heroColorway: hero?.slug } : {}), ...(assetHidden && hero?.assetId ? { assetId: hero.assetId } : {}) };
}
