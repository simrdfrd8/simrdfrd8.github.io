"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";
import type { Asset } from "@/lib/catalog/schema";
import type { SlideColorwayLike } from "@/lib/merch-slides";
import type { MerchCategory } from "@/lib/merch";
import { MerchCardCarousel } from "./MerchCardCarousel";
import { MediaImage } from "./MediaImage";
import { ComingSoonTag } from "./SwipeCarousel";

export type DesignCardColorway = SlideColorwayLike<Asset> & { swatch?: string };
/** One cut of the design, ready to render (`product` is always set for cuts from groupByDesign). */
export type DesignCardCut = {
  cut: MerchCategory;
  label: string;
  product?: { id: string; title: string; summary: string; href: string; sizes?: string[]; asset?: Asset; colorways: DesignCardColorway[]; price?: ReactNode };
};

const sizeRange = (s?: string[]) => (!s?.length ? null : s.length > 1 ? `${s[0]}–${s[s.length - 1]}` : s[0]);

/**
 * All tab: one card per design with a Men / Women cut selector. Picking a cut swaps the card's photos, colorways,
 * sizes, title and link to that cut's own product. Only the cuts the design comes in are listed (one cut: just that one). Display only: merch is coming soon, there is no price or checkout here.
 */
export function MerchDesignCard({ design, cuts, defaultCut, priority = false }: { design: string; cuts: DesignCardCut[]; defaultCut: MerchCategory; priority?: boolean }) {
  const [cut, setCut] = useState<MerchCategory>(defaultCut);
  const radios = useRef<(HTMLButtonElement | null)[]>([]);
  const current = cuts.find((c) => c.cut === cut)?.product ?? cuts.find((c) => c.product)?.product;
  if (!current) return null;
  const enabled = cuts.map((c, i) => (c.product ? i : -1)).filter((i) => i >= 0);
  const onKey = (e: KeyboardEvent, i: number) => {
    if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) return;
    e.preventDefault();
    const at = enabled.indexOf(i);
    const next = enabled[(at + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1) + enabled.length) % enabled.length];
    setCut(cuts[next].cut);
    radios.current[next]?.focus();
  };
  const sizes = sizeRange(current.sizes);
  const n = current.colorways.length;
  return (
    <article className="group relative flex flex-col" data-merch-design={design} data-cut={cut} data-design-product={current.id}>
      {n ? (
        <MerchCardCarousel
          key={current.id}
          productId={current.id}
          title={current.title}
          href={current.href}
          colorways={current.colorways}
          priority={priority}
          dataAttrs={{ "data-design-carousel": design }}
        />
      ) : (
        <Link href={current.href} className="relative block aspect-square overflow-hidden rounded-2xl bg-surface ring-1 ring-line" aria-label={current.title}>
          {current.asset && <MediaImage asset={current.asset} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" priority={priority} className="absolute inset-0" />}
          <ComingSoonTag />
        </Link>
      )}
      <div role="radiogroup" aria-label={`${current.title} cut`} className="mt-3 inline-flex self-start rounded-full border border-line-strong p-0.5" data-cut-selector>
        {cuts.map((c, i) => {
          const on = c.cut === cut;
          return (
            <button
              key={c.cut}
              ref={(el) => {
                radios.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={!c.product}
              tabIndex={on ? 0 : -1}
              title={c.product ? undefined : `No ${c.label.toLowerCase()}'s cut yet`}
              data-cut-option={c.cut}
              onClick={() => c.product && setCut(c.cut)}
              onKeyDown={(e) => onKey(e, i)}
              className={clsx(
                "h-8 rounded-full px-3 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold",
                on ? "bg-cream text-ink" : c.product ? "text-cream-dim hover:text-cream" : "cursor-not-allowed text-cream-dim opacity-35",
              )}
            >
              {c.label}
            </button>
          );
        })}
      </div>
      <div className="flex flex-1 flex-col gap-1 pt-3">
        <h3 className="text-base leading-snug font-semibold">
          <Link href={current.href} className="hover:underline" tabIndex={-1} data-design-link>
            {current.title}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm text-cream-dim">{current.summary}</p>
        {/* published price of the picked cut (server-rendered MerchPrice; renders nothing while unpriced) */}
        {current.price ? <div data-design-price>{current.price}</div> : null}
        {n > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted" data-design-meta>
            <span className="flex items-center gap-1" aria-label={current.colorways.map((c) => c.name).join(", ")} data-design-colorways={n}>
              {current.colorways.map((c) => (
                <span key={c.slug} aria-hidden="true" title={c.name} className="h-3 w-3 rounded-full ring-1 ring-line-strong" style={{ backgroundColor: c.swatch ?? c.asset.dominantColor ?? "#201B25" }} />
              ))}
              <span className="ml-1">
                {n} {n === 1 ? "color" : "colors"}
              </span>
            </span>
            {sizes && <span data-design-sizes>Sizes {sizes}</span>}
          </div>
        )}
      </div>
    </article>
  );
}
