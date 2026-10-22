import type { Product } from "@/lib/catalog/schema";
import { BUILT_AT, publishedPrice } from "@/lib/published-catalog";
import { PriceTag } from "./PriceTag";

/**
 * Integration hook for shop cards and product pages: the published price of a merch product, or nothing while it has none
 * (today every merch item is unpriced, so nothing renders). Colourways priced differently show "From" the lowest price.
 */
export function MerchPrice({ product, size = "sm", className }: { product: Pick<Product, "id" | "colorways">; size?: "sm" | "lg"; className?: string }) {
  const slug = product.id.replace(/^merch-/, "");
  const base = publishedPrice(slug);
  const own = product.colorways.map((c) => publishedPrice(slug, c.slug)).filter((x) => x !== null);
  const all = [base, ...own].filter((x) => x !== null);
  if (!all.length) return null;
  const now = (x: (typeof all)[number]) => x.sale?.price_cents ?? x.price_cents;
  const differs = all.some((x) => x.price_cents !== all[0].price_cents || (x.sale?.price_cents ?? null) !== (all[0].sale?.price_cents ?? null));
  const pick = differs ? all.reduce((a, b) => (now(b) < now(a) ? b : a)) : base ?? all[0];
  return <PriceTag price={pick.price_cents} sale={pick.sale} builtAt={BUILT_AT} size={size} prefix={differs ? "From" : undefined} className={className} />;
}
