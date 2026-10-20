/* eslint-disable @next/next/no-img-element */
import clsx from "clsx";
import type { Product } from "@/lib/catalog/schema";
import { formatPrice } from "@/lib/catalog/filters";
import { artistName, getAsset } from "@/lib/catalog";
import { MediaImage } from "./MediaImage";
import { CheckoutButton } from "./CheckoutButton";
import { Badge } from "./ui";
import { MerchCard } from "./Merch";

const TYPE_LABEL: Record<Product["type"], string> = {
  download: "Download", stems: "Stems", license: "License", print: "Print", "digital-art": "Digital art",
  "sample-pack": "Sample pack", service: "Service", merch: "Merch", support: "Support",
};

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  if (product.inquireOnly) return <MerchCard product={product} />;
  const asset = getAsset(product.assetId);
  const price = formatPrice(product);
  return (
    <article className={clsx("group relative flex flex-col", className)} data-product={product.id} data-status={product.status}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface ring-1 ring-line">
        {asset ? (
          <MediaImage asset={asset} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="absolute inset-0" imgClassName="transition-transform duration-700 group-hover:scale-[1.03]" />
        ) : product.artworkUrl ? (
          <img src={product.artworkUrl} alt="" width={500} height={500} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
        ) : (
          <TypeArt type={product.type} />
        )}
        <div className="absolute right-3 bottom-3 flex gap-2">
          {product.status === "upcoming" && <Badge tone="upcoming">Coming soon</Badge>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 pt-4">
        <p className="kicker text-muted">
          {TYPE_LABEL[product.type]}
          {product.artist && ` · ${artistName(product.artist)}`}
        </p>
        <h3 className="text-lg leading-snug font-semibold">{product.title}</h3>
        <p className="text-sm text-cream-dim">{product.summary}</p>
        {(product.type === "download" || product.type === "stems") && (
          <p className="text-xs text-muted">{product.type === "download" ? "Love it? Own the WAV. Streaming stays free." : "The parts, for remixes and study."}</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <p className="font-semibold">
            {price.label}
            {!product.priceApproved && product.price !== null && <span className="sr-only"> (illustrative price)</span>}
          </p>
          <CheckoutButton product={product} priceLabel={price.label} size="sm" variant={product.type === "support" ? "accent" : "primary"} />
        </div>
      </div>
    </article>
  );
}

function TypeArt({ type }: { type: Product["type"] }) {
  const colors: Record<string, [string, string]> = {
    support: ["#FF7A59", "#F8E8D2"], license: ["#8C7CFF", "#8C7CFF"], service: ["#B6FF3B", "#8C7CFF"], download: ["#F8E8D2", "#FF7A59"],
  };
  const [a, b] = colors[type] ?? ["#B6FF3B", "#B6FF3B"];
  return (
    <div className="absolute inset-0 flex items-end p-5" style={{ background: `radial-gradient(120% 90% at 20% 10%, ${a} 0%, transparent 55%), radial-gradient(100% 80% at 90% 100%, ${b} 0%, transparent 60%), #201B25` }}>
      <span className="display text-6xl text-ink/80 mix-blend-multiply">{TYPE_LABEL[type]}</span>
    </div>
  );
}
