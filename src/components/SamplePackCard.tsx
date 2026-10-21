import type { SamplePack } from "@/lib/catalog/schema";
import { formatPrice } from "@/lib/catalog/filters";
import { getAsset, packProduct } from "@/lib/catalog";
import { MediaImage } from "./MediaImage";
import { CheckoutButton } from "./CheckoutButton";
import { SoundCloudEmbed } from "./SoundCloudEmbed";
import { Badge } from "./ui";
import { PlayButton } from "./player/PlayButton";

export function SamplePackCard({ pack }: { pack: SamplePack }) {
  const product = packProduct(pack);
  const cover = getAsset(pack.coverAssetId);
  const price = formatPrice(product).label;
  return (
    <article className="relative flex flex-col gap-4" data-pack={pack.id} data-status={pack.status}>
      {pack.demo.soundcloudUrl ? (
        <SoundCloudEmbed url={pack.demo.soundcloudUrl} scId={pack.demo.scId} title={`${pack.title} demo`} subtitle="Demo" verified />
      ) : (
        <div className="relative aspect-square overflow-hidden rounded-xl bg-surface ring-1 ring-line">
          {cover && <MediaImage asset={cover} sizes="(min-width:1024px) 25vw, 50vw" className="absolute inset-0" />}
          <div className="absolute right-3 bottom-3 flex gap-2">
            {pack.status === "upcoming" && <Badge tone="upcoming">Coming soon</Badge>}
          </div>
        </div>
      )}
      {pack.demo.clipSrc && (
        <PlayButton track={{ id: `pack-${pack.id}`, title: `${pack.title} (demo)`, src: pack.demo.clipSrc, subtitle: "Sample pack demo" }} label="Play demo" />
      )}
      <div>
        <h3 className="text-lg leading-snug font-semibold">{pack.title}</h3>
        <p className="text-sm text-muted">{[pack.format, pack.bpmRange && `BPM ${pack.bpmRange}`, pack.genres.join(" / ")].filter(Boolean).join(" · ")}</p>
      </div>
      <ul className="space-y-1 text-sm text-cream-dim">
        {pack.contents.map((c) => (
          <li key={c}>· {c}</li>
        ))}
      </ul>
      <p className="text-xs text-muted">{pack.license}</p>
      <div className="mt-auto flex items-center justify-between gap-3">
        <p className="font-semibold">{price}</p>
        <CheckoutButton product={product} priceLabel={price} size="sm" label={pack.status === "upcoming" ? "Notify me" : `Get the pack · ${price}`} />
      </div>
    </article>
  );
}
