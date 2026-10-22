/**
 * The PUBLISHED catalog snapshot (content/catalog-published.json), exported from the admin catalog manager on the accounts
 * Worker and committed here for a rebuild Ricky approves. It lists only public merch, public colourways and public bundles
 * with customer prices; anything not in it is private. It never holds costs or admin data.
 * The build-time filter (MERCH_PUBLIC_SET=1) and scripts/prune-admin-only-media.mjs both read it.
 */
import snapJson from "@content/catalog-published.json";
import type { Sale } from "./pricing";

export type PublishedColorway = { price_cents?: number; sale?: Sale };
export type PublishedMerch = { price_cents: number | null; sale: Sale | null; colorways: Record<string, PublishedColorway> };
export type PublishedBundle = { slug: string; title: string; description: string; price_cents: number; items: { product: string; colorway: string | null; qty: number }[] };
export type PublishedCatalog = { schema: string; release: number | null; exportedAt: string; merch: Record<string, PublishedMerch>; bundles: PublishedBundle[] };

export const publishedCatalog = snapJson as unknown as PublishedCatalog;
export const isPublishedCatalog = (x: unknown): x is PublishedCatalog => !!x && typeof x === "object" && "merch" in x && !("slots" in x);
/** Build time, used as the first-render "now" for sale windows (the tag re-checks the real time in the browser). */
export const BUILT_AT = Date.now();

/** Customer price of a product (or one colourway): regular price + sale, or null when no price is published yet. */
export function publishedPrice(slug: string, colorway?: string | null, c: PublishedCatalog = publishedCatalog): { price_cents: number; sale: Sale | null } | null {
  const e = c.merch[slug];
  if (!e) return null;
  const cw = colorway ? e.colorways[colorway] : undefined;
  const price = cw?.price_cents ?? e.price_cents;
  if (price == null) return null;
  const sale = cw?.sale ?? (cw?.price_cents != null ? null : e.sale);
  return { price_cents: price, sale: sale && sale.price_cents < price ? sale : null };
}
