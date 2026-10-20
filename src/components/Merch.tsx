import Link from "next/link";
import type { Product } from "@/lib/catalog/schema";
import { getAsset, merchByBrand } from "@/lib/catalog";
import { MediaImage } from "./MediaImage";
import { VideoPlayer } from "./VideoPlayer";
import { ColorwayGallery } from "./ColorwayGallery";
import { resolveViews } from "@/lib/merch";
import { Badge } from "./ui";

export const merchSlug = (p: Pick<Product, "id">) => p.id.replace(/^merch-/, "");

/** Gallery data for a merch product: visible colorways (each with its resolved view set) + extra photos. */
export function merchGallery(product: Product) {
  const asset = getAsset(product.assetId);
  const resolved = resolveViews(product.colorways, product.heroColorway, (id) => !!getAsset(id));
  const colorways = product.colorways.flatMap((c, i) => {
    const a = getAsset(c.assetId);
    if (!a) return [];
    const views = resolved[i].flatMap((v) => {
      const va = getAsset(v.assetId);
      return va ? [{ kind: v.kind, label: v.label, asset: va, fromHero: v.fromHero }] : [];
    });
    return [{ name: c.name, slug: c.slug, asset: a, swatch: c.swatch, ink: c.ink, views }];
  });
  const shownIds = new Set(colorways.flatMap((c) => [c.asset.id, ...c.views.map((v) => v.asset.id)]));
  const extras = [asset && !shownIds.has(asset.id) ? asset : undefined, ...product.lifestyleAssetIds.map((id) => getAsset(id))].filter(
    (a, i, all): a is NonNullable<typeof a> => !!a && a.type !== "video" && all.findIndex((x) => x?.id === a.id) === i,
  );
  return { asset, colorways, extras };
}

/** Physical merch is inquiry-only: no price, no buy button, until fulfilment is set up. */
export function MerchCard({ product }: { product: Product }) {
  const { asset, colorways, extras } = merchGallery(product);
  const href = `/shop/merch/${merchSlug(product)}`;
  return (
    <article className="group relative flex flex-col" data-product={product.id} data-merch="inquire-only">
      {colorways.length ? (
        <ColorwayGallery productId={product.id} title={product.title} colorways={colorways} extras={extras} />
      ) : (
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-surface ring-1 ring-line">
          {asset && <MediaImage asset={asset} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="absolute inset-0" imgClassName="transition-transform duration-700 group-hover:scale-[1.03]" />}
          <div className="absolute right-3 bottom-3">
            <Badge tone="upcoming">Coming soon</Badge>
          </div>
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1 pt-4">
        <h3 className="text-lg leading-snug font-semibold">
          <Link href={href} className="hover:underline" data-product-link>
            {product.title}
          </Link>
        </h3>
        <p className="text-sm text-cream-dim">{product.summary}</p>
        <p className="mt-auto pt-3 text-sm">
          <Link href={`/contact/?type=business&ref=${product.id}`} className="underline decoration-line-strong underline-offset-4 hover:text-cream">
            Ask about it
          </Link>
          <span className="text-muted"> · not on sale yet</span>
        </p>
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
      {items.map((p) => (
        <MerchCard key={p.id} product={p} />
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
        <div key={g.brand ?? "general"} data-brand={g.brand ?? "flavorful-music"}>
          {only === undefined && (
            <h3 className="display mb-6 text-4xl">
              {g.brand ? <Link href={`/artists/${g.brand}`} className="hover:text-[var(--accent)]">{g.name}</Link> : g.name}
            </h3>
          )}
          <MerchGrid items={g.items} />
        </div>
      ))}
      <p className="text-sm text-muted">Merch isn&apos;t on sale yet. Physical orders open once printing and shipping are set up. Ask about any piece and we&apos;ll let you know.</p>
    </div>
  );
}
