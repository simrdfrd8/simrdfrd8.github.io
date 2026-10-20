"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import clsx from "clsx";
import type { Asset } from "@/lib/catalog/schema";
import { MediaImage } from "./MediaImage";
import { Badge } from "./ui";

export type GalleryView = { kind: string; label: string; asset: Asset; fromHero: boolean };
export type ColorwayView = { name: string; slug: string; asset: Asset; swatch?: string; ink?: string; views?: GalleryView[] };

const thumb = (a: Asset) => (a.previews.filter((p) => p.format === "webp").sort((x, y) => x.width - y.width)[0] ?? a.previews[0])?.src;

/**
 * Merch gallery + colorway picker.
 * - Swatches are a WAI-ARIA radio group (roving tabindex, arrows / Home / End), 44px targets on phones. A swatch shows the
 *   shirt colour (CSV shirt_hex) with an ink dot; colorways without hex fall back to an image crop.
 * - Picking a colorway swaps the whole set (front, back, model front, model back) and returns to the front.
 * - Views (v2) are a toggle group; "page" variant shows them as image thumbnails with prev/next.
 * - Extra photos (the original approved product photo, v1 lifestyle) are toggles that don't change the colorway.
 */
export function ColorwayGallery({ productId, title, colorways, extras, variant = "card" }: { productId: string; title: string; colorways: ColorwayView[]; extras: Asset[]; variant?: "card" | "page" }) {
  const [selected, setSelected] = useState(0);
  const [extra, setExtra] = useState<number | null>(null);
  const [view, setView] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = colorways[selected];
  const views = current.views ?? [];
  const multiView = colorways.some((c) => (c.views?.length ?? 0) > 1);
  const shown = extra !== null ? extras[extra] : (views[view]?.asset ?? current.asset);
  const currentView = extra === null ? views[view] : undefined;
  const shownAlt = extra !== null ? undefined : currentView && currentView.kind !== "front" ? `${title} in ${current.name}: ${currentView.label}` : `${title} in ${current.name}`;
  const groupLabel = `${title} colorways`;
  const page = variant === "page";

  const pick = (i: number, focus = false) => {
    setSelected(i);
    setExtra(null);
    setView(0);
    if (focus) refs.current[i]?.focus();
  };
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = colorways.length;
    const to = { ArrowRight: (i + 1) % n, ArrowDown: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, ArrowUp: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    pick(to, true);
  };
  const step = (d: number) => {
    setExtra(null);
    setView((v) => (v + d + views.length) % views.length);
  };
  const portrait = shown.orientation === "portrait";

  return (
    <div data-colorway-picker={productId} data-gallery-variant={variant}>
      <div className={clsx("relative overflow-hidden rounded-2xl ring-1 ring-line", multiView ? "aspect-square" : portrait ? "aspect-[3/4]" : "aspect-square")} style={{ backgroundColor: portrait && multiView ? (shown.dominantColor ?? "#201B25") : "#201B25" }}>
        <MediaImage
          key={shown.id}
          asset={shown}
          alt={shownAlt}
          fit={multiView && portrait ? "contain" : "cover"}
          sizes={page ? "(min-width: 1024px) 55vw, 100vw" : "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"}
          className="absolute inset-0"
        />
        <div className="absolute right-3 bottom-3">
          <Badge tone="upcoming">Coming soon</Badge>
        </div>
        {page && views.length > 1 && (
          <>
            <button type="button" onClick={() => step(-1)} aria-label="Previous view" className="absolute top-1/2 left-3 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-ink/70 text-cream ring-1 ring-line-strong hover:bg-ink">
              ‹
            </button>
            <button type="button" onClick={() => step(1)} aria-label="Next view" className="absolute top-1/2 right-3 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-ink/70 text-cream ring-1 ring-line-strong hover:bg-ink">
              ›
            </button>
          </>
        )}
      </div>

      {views.length > 1 && (
        <div role="group" aria-label={`${title} views`} className={clsx("mt-3 flex gap-1.5", page ? "grid grid-cols-4 gap-2" : "flex-wrap")} data-merch-views>
          {views.map((v, i) => {
            const on = extra === null && view === i;
            return (
              <button
                key={v.kind}
                type="button"
                aria-pressed={on}
                aria-label={page ? v.label : undefined}
                title={v.label}
                data-view={v.kind}
                onClick={() => {
                  setView(i);
                  setExtra(null);
                }}
                className={clsx(
                  "transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold",
                  page
                    ? clsx("relative aspect-square overflow-hidden rounded-xl bg-surface", on ? "ring-2 ring-cream" : "ring-1 ring-line hover:ring-cream-dim")
                    : clsx("h-11 rounded-full px-3.5 text-xs font-semibold sm:h-8", on ? "bg-cream text-ink" : "border border-line-strong text-cream-dim hover:text-cream"),
                )}
              >
                {page ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumb(v.asset)} alt="" loading="lazy" decoding="async" className={clsx("h-full w-full", v.asset.orientation === "portrait" ? "object-contain" : "object-cover")} />
                    <span className="absolute inset-x-0 bottom-0 bg-ink/75 px-1 py-0.5 text-center text-[10px] font-semibold">{v.kind === "model-front" ? "Model" : v.kind === "model-back" ? "Model back" : v.label}</span>
                  </>
                ) : (
                  v.label.split(" · ")[0]
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {colorways.length > 1 && (
          <div role="radiogroup" aria-label={groupLabel} className="flex flex-wrap gap-1.5">
            {colorways.map((c, i) => (
              <button
                key={c.slug}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={i === selected}
                aria-label={c.name}
                title={c.name}
                tabIndex={i === selected ? 0 : -1}
                data-colorway={c.slug}
                onClick={() => pick(i)}
                onKeyDown={(e) => onKey(e, i)}
                className={clsx(
                  "relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full ring-offset-2 ring-offset-ink transition sm:h-9 sm:w-9",
                  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold",
                  i === selected ? "ring-2 ring-cream" : "ring-1 ring-line-strong hover:ring-cream-dim",
                )}
                style={{ backgroundColor: c.swatch ?? c.asset.dominantColor ?? "#201B25" }}
              >
                {c.swatch ? (
                  <span aria-hidden="true" className="h-3.5 w-3.5 rounded-full ring-1 ring-black/20" style={{ backgroundColor: c.ink ?? "transparent" }} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb(c.asset)} alt="" width={44} height={44} loading="lazy" decoding="async" className="h-full w-full scale-[1.6] object-cover" />
                )}
              </button>
            ))}
          </div>
        )}
        {extras.map((a, i) => (
          <button
            key={a.id}
            type="button"
            aria-pressed={extra === i}
            aria-label={a.tags.includes("lifestyle") && !multiView ? "Show photo on a model" : `Show original photo: ${a.alt ?? a.title}`}
            data-extra-photo={a.id}
            onClick={() => setExtra(extra === i ? null : i)}
            className={clsx(
              "relative h-11 shrink-0 overflow-hidden rounded-full pr-3 pl-1 text-xs font-medium transition sm:h-9",
              "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold",
              extra === i ? "bg-cream text-ink" : "border border-line-strong text-cream-dim hover:text-cream",
            )}
          >
            <span className="flex items-center gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb(a)} alt="" width={32} height={32} loading="lazy" decoding="async" className="h-8 w-8 rounded-full object-cover sm:h-7 sm:w-7" />
              {multiView ? "Original photo" : a.tags.includes("lifestyle") ? "On model" : "Photo"}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted" aria-live="polite" data-colorway-name>
        {colorways.length > 1 ? `Colorway: ${current.name}` : current.name}
        {colorways.length > 1 && <span> · {colorways.length} colorways</span>}
        {currentView && currentView.kind !== "front" && <span data-view-name> · {currentView.label}</span>}
      </p>
    </div>
  );
}
