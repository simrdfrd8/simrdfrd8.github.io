import { getAsset, merchProducts } from "@/lib/catalog";
import { BUILT_AT, publishedCatalog, publishedPrice, type PublishedCatalog } from "@/lib/published-catalog";
import { BundleCard, type BundleCardData } from "./BundleCard";

/** Public bundles from the published snapshot, resolved against the built product list (a bundle with a missing item is skipped). */
export function publicBundles(c: PublishedCatalog = publishedCatalog): BundleCardData[] {
  const products = merchProducts();
  return c.bundles.flatMap((b) => {
    const items = b.items.map((i) => {
      const p = products.find((x) => x.id === `merch-${i.product}`);
      if (!p) return null;
      const cw = i.colorway ? p.colorways.find((x) => x.slug === i.colorway) : undefined;
      if (i.colorway && !cw) return null;
      return { title: p.title, colorwayName: cw?.name ?? null, qty: i.qty, href: `/shop/merch/${i.product}/`, asset: getAsset(cw?.assetId ?? p.assetId), unitPrice: publishedPrice(i.product, i.colorway)?.price_cents ?? null };
    });
    if (items.some((x) => x === null)) return [];
    const ok = items.filter((x) => x !== null);
    const original = ok.every((i) => i.unitPrice != null) ? ok.reduce((a, i) => a + i.unitPrice! * i.qty, 0) : null;
    return [{ slug: b.slug, title: b.title, description: b.description, price_cents: b.price_cents, original_cents: original, items: ok }];
  });
}

/** Integration hook for the merch shop: renders nothing until a bundle is published. */
export function BundlesSection() {
  const list = publicBundles();
  if (!list.length) return null;
  return (
    <section aria-labelledby="bundles-title" className="mt-16" data-bundles>
      <h2 id="bundles-title" className="brand-h mb-6 text-[clamp(1.75rem,4vw,2.75rem)]">
        Bundles
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((b) => (
          <BundleCard key={b.slug} bundle={b} builtAt={BUILT_AT} />
        ))}
      </div>
    </section>
  );
}
