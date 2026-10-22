import Link from "next/link";
import type { Product } from "@/lib/catalog/schema";
import { getAsset, merchByBrand } from "@/lib/catalog";
import { MediaImage } from "./MediaImage";
import { VideoPlayer } from "./VideoPlayer";
import { MerchCardCarousel } from "./MerchCardCarousel";
import { ComingSoonTag } from "./SwipeCarousel";
import { blankBackViews, resolveViews, MERCH_CATEGORIES } from "@/lib/merch";
import { MerchCategoryTabs } from "./MerchCategoryTabs";

export const merchSlug = (p: Pick<Product, "id">) => p.id.replace(/^merch-/, "");

/** Gallery data for a merch product: visible colorways (each with its resolved view set) + extra photos. */
export function merchGallery(product: Product) {
  const asset = getAsset(product.assetId);
  const resolved = resolveViews(product.colorways, product.heroColorway, (id) => !!getAsset(id), product.category);
  const colorways = product.colorways.flatMap((c, i) => {
    const a = getAsset(c.assetId);
    if (!a) return [];
    const toGallery = (list: typeof resolved[number]) =>
      list.flatMap((v) => {
        const va = getAsset(v.assetId);
        return va ? [{ kind: v.kind, label: v.label, asset: va, fromHero: v.fromHero, ...(v.key ? { key: v.key } : {}) }] : [];
      });
    const views = toGallery(resolved[i]);
    const blank = blankBackViews(c, resolved[i], (id) => !!getAsset(id));
    return [{ name: c.name, slug: c.slug, asset: a, swatch: c.swatch, ink: c.ink, views, ...(blank ? { blankViews: toGallery(blank) } : {}) }];
  });
  const shownIds = new Set(colorways.flatMap((c) => [c.asset.id, ...c.views.map((v) => v.asset.id), ...("blankViews" in c && c.blankViews ? c.blankViews.map((v) => v.asset.id) : [])]));
  const extras = [asset && !shownIds.has(asset.id) ? asset : undefined, ...product.lifestyleAssetIds.map((id) => getAsset(id))].filter(
    (a, i, all): a is NonNullable<typeof a> => !!a && a.type !== "video" && all.findIndex((x) => x?.id === a.id) === i,
  );
  return { asset, colorways, extras };
}

/**
 * Physical merch is inquiry-only: no price, no buy button, until fulfilment is set up.
 * The card is a swipe strip (hero colorway's views, then the other colorways' fronts); tapping it opens the product.
 */
export function MerchCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { asset, colorways } = merchGallery(product);
  const href = `/shop/merch/${merchSlug(product)}`;
  return (
    <article className="group relative flex flex-col" data-product={product.id} data-merch="inquire-only" data-category={product.category}>
      {colorways.length ? (
        <MerchCardCarousel productId={product.id} title={product.title} href={href} colorways={colorways} priority={priority} />
      ) : (
        <Link href={href} className="relative block aspect-square overflow-hidden rounded-2xl bg-surface ring-1 ring-line" aria-label={product.title}>
          {asset && <MediaImage asset={asset} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" priority={priority} className="absolute inset-0" />}
          <ComingSoonTag />
        </Link>
      )}
      <div className="flex flex-1 flex-col gap-1 pt-3">
        <h3 className="text-base leading-snug font-semibold">
          <Link href={href} className="hover:underline" tabIndex={-1}>
            {product.title}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm text-cream-dim">{product.summary}</p>
      </div>
    </article>
  );
}

export function MerchGrid({ items }: { items: Product[] }) {
  const videos = [...new Set(items.flatMap((p) => p.galleryAssetIds))].map((id) => getAsset(id)).filter((a) => a?.type === "video");
  const photos = [...new Set(items.flatMap((p) => p.galleryAssetIds))].map((id) => getAsset(id)).filter((a) => a && a.type !== "video");
  return (
    <div className="grid items-start gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
      {videos.map((v) => v && <VideoPlayer key={v.id} asset={v} sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" />)}
      {items.map((p, i) => (
        <MerchCard key={p.id} product={p} priority={i < 4} />
      ))}
      {photos.map((a) => a && <MediaImage key={a.id} asset={a} sizes="(min-width:1024px) 25vw, 50vw" className="aspect-[3/4] rounded-2xl ring-1 ring-line" />)}
    </div>
  );
}

export function MerchByBrand({ only }: { only?: string | null }) {
  const groups = merchByBrand().filter((g) => only === undefined || g.brand === only);
  return (
    <div className="space-y-16">
      {groups.map((g) => (
        <div key={g.brand ?? "general"} data-brand={g.brand ?? "flavorful-music"} data-categories={[...new Set(g.items.map((p) => p.category))].join(" ")}>
          {only === undefined && (
            <h3 className="display mb-6 text-4xl">
              {g.brand ? <Link href={`/artists/${g.brand}`} className="hover:text-[var(--accent)]">{g.name}</Link> : g.name}
            </h3>
          )}
          <MerchGrid items={g.items} />
        </div>
      ))}
      <p className="text-sm text-muted">
        Not on sale yet. <Link href="/contact/?type=business" className="underline decoration-line-strong underline-offset-4 hover:text-cream">Ask about any piece</Link>.
      </p>
    </div>
  );
}

/** The merch shop: All, then a tab per category that has pieces (Men / Women / Unisex, from each product's `category`). */
export function MerchShop() {
  const items = merchByBrand().flatMap((g) => g.items);
  const cats = MERCH_CATEGORIES.map((c) => ({ ...c, count: items.filter((p) => p.category === c.id).length })).filter((c) => c.count);
  return (
    <MerchCategoryTabs tabs={[{ id: "all", label: "All", count: items.length }, ...cats]}>
      <MerchByBrand />
    </MerchCategoryTabs>
  );
}
