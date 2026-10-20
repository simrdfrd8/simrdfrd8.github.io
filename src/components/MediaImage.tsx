import clsx from "clsx";
import type { Asset, Preview } from "@/lib/catalog/schema";
import { assetMarker } from "@/lib/catalog/filters";

/**
 * Renders pre-generated AVIF/WebP renditions from the ingest pipeline as a responsive <picture>.
 * (We already produce optimized multi-width files at ingest time, so next/image's runtime
 * optimizer would only duplicate the work.) Unapproved assets get a visible preview mark.
 */
export function srcSet(previews: Preview[], format: Preview["format"]) {
  return previews
    .filter((p) => p.format === format)
    .map((p) => `${p.src} ${p.width}w`)
    .join(", ");
}

export function MediaImage({
  asset,
  previews,
  sizes = "100vw",
  className,
  imgClassName,
  priority,
  fit = "cover",
  showMark = true,
  alt,
}: {
  asset: Asset;
  previews?: Preview[];
  sizes?: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  showMark?: boolean;
  alt?: string;
}) {
  const pv = previews ?? (asset.type === "video" ? asset.poster : asset.previews);
  const webp = pv.filter((p) => p.format === "webp");
  const fallback = webp[Math.min(1, webp.length - 1)] ?? webp[0];
  return (
    <div className={clsx(!className?.includes("absolute") && "relative", "overflow-hidden", className)} style={{ backgroundColor: asset.dominantColor ?? "#201B25" }}>
      {fallback ? (
        <picture>
          <source type="image/avif" srcSet={srcSet(pv, "avif")} sizes={sizes} />
          <source type="image/webp" srcSet={srcSet(pv, "webp")} sizes={sizes} />
          <img
            src={fallback.src}
            alt={alt ?? asset.alt ?? asset.title}
            width={asset.width}
            height={asset.height}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            decoding="async"
            className={clsx("h-full w-full", fit === "cover" ? "object-cover" : "object-contain", imgClassName)}
            style={asset.lqip ? { backgroundImage: `url(${asset.lqip})`, backgroundSize: "cover" } : undefined}
          />
        </picture>
      ) : null}
      {showMark && <PreviewMark kind={assetMarker(asset)} />}
    </div>
  );
}

export function PreviewMark({ kind }: { kind: "none" | "placeholder" | "unapproved" }) {
  if (kind === "none") return null;
  return (
    <span
      data-preview-mark={kind}
      className={clsx(
        "kicker pointer-events-none absolute top-3 left-3 z-10 rounded-full px-2.5 py-1 !text-[0.6rem] backdrop-blur-sm",
        kind === "unapproved" ? "bg-ink/75 text-gold ring-1 ring-gold/60" : "bg-ink/60 text-cream-dim ring-1 ring-line-strong",
      )}
    >
      {kind === "unapproved" ? "PREVIEW – not approved" : "Placeholder art"}
    </span>
  );
}
