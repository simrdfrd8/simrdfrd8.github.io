import clsx from "clsx";
import type { Asset } from "@/lib/catalog/schema";
import { assetMarker } from "@/lib/catalog/filters";
import { MediaImage, PreviewMark, srcSet } from "./MediaImage";
import { VideoFacade } from "./VideoFacade";
import { assetCredit, getCollaborator } from "@/lib/catalog";
import { formatDuration } from "@/lib/format";

/**
 * Orientation-aware video. The frame always uses the catalog's true width/height, so nothing
 * is stretched or cropped:
 *  - portrait  → phone-shaped frame (full width on mobile, height-capped on desktop)
 *  - landscape → 16:9 stage; non-16:9 sources sit inside it at native ratio over a blurred poster
 */
export function VideoPlayer({ asset, priority, className, caption = true, sizes }: { asset: Asset; priority?: boolean; className?: string; caption?: boolean; sizes?: string }) {
  const mp4 = asset.previews.find((p) => p.format === "mp4");
  const ratio = `${asset.width} / ${asset.height}`;
  const portrait = asset.orientation === "portrait";
  const posterSrc = asset.poster.filter((p) => p.format === "webp").at(-1)?.src;
  const frame = (
    <VideoFacade
      src={mp4?.src}
      poster={posterSrc}
      title={asset.title}
      ratio={ratio}
      posterNode={<MediaImage asset={asset} sizes={sizes ?? (portrait ? "(min-width: 768px) 420px, 100vw" : "(min-width: 1024px) 66vw, 100vw")} showMark={false} priority={priority} className="absolute inset-0" />}
    />
  );
  return (
    <figure className={clsx("group", className)} data-orientation={asset.orientation}>
      {portrait ? (
        <div className="relative mx-auto w-full max-w-[min(100%,calc(78vh*9/16))] overflow-hidden rounded-[1.75rem] bg-surface ring-1 ring-line" style={{ aspectRatio: ratio }}>
          {frame}
          <PreviewMark kind={assetMarker(asset)} />
        </div>
      ) : (
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-surface ring-1 ring-line">
          {posterSrc && (
            <div aria-hidden="true">
              <picture>
              <source type="image/webp" srcSet={srcSet(asset.poster, "webp")} sizes="40vw" />
              <img src={posterSrc} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl" loading="lazy" />
              </picture>
            </div>
          )}
          <div className="relative mx-auto h-full" style={{ aspectRatio: ratio, maxWidth: "100%" }}>
            {frame}
          </div>
          <PreviewMark kind={assetMarker(asset)} />
        </div>
      )}
      {caption && (
        <figcaption className={clsx("mt-4 flex items-baseline justify-between gap-3", portrait && "mx-auto max-w-[min(100%,calc(78vh*9/16))]")}>
          <span>
            <span className="block text-lg font-semibold">{asset.title}</span>
            <span className="text-sm text-muted">
              {assetCredit(asset)}
              {asset.collaborators.map((c, i) => {
                const url = getCollaborator(c.id)?.links.find((l) => l.verified)?.url;
                return (
                  <span key={c.name}>
                    {i === 0 ? " with " : ", "}
                    {url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="underline decoration-line-strong underline-offset-2 hover:text-cream">
                        {c.name}
                      </a>
                    ) : (
                      c.name
                    )}
                  </span>
                );
              })}
              {asset.artistInferred && " (credit unconfirmed)"}
            </span>
          </span>
          {asset.durationSec ? <span className="kicker text-muted">{formatDuration(asset.durationSec)}</span> : null}
        </figcaption>
      )}
    </figure>
  );
}
