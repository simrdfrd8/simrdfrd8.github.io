"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import clsx from "clsx";
import type { Asset } from "@/lib/catalog/schema";
import { colorwayAt, colorwayFromHash, firstSlideOf, pageSlides } from "@/lib/merch-slides";
import { viewCaption } from "@/lib/view-caption";
import type { ColorwayView } from "./ColorwayTypes";
import { ComingSoonTag, SwipeCarousel } from "./SwipeCarousel";

/**
 * Product page gallery: one full-bleed swipe strip with every colorway's photos. Swiping into a colorway selects it;
 * the small swatches underneath are an optional shortcut (tap = jump to that colorway's front). The Printed / Blank back
 * choice swaps the back shots in place.
 */
export function MerchProductGallery({ productId, title, colorways, extras }: { productId: string; title: string; colorways: ColorwayView[]; extras: Asset[] }) {
  const [selected, setSelected] = useState(0);
  const [blank, setBlank] = useState(false);
  const [index, setIndex] = useState(0);
  const [goTo, setGoTo] = useState<{ index: number; seq: number; instant?: boolean }>({ index: 0, seq: 0, instant: true });
  const radios = useRef<(HTMLButtonElement | null)[]>([]);
  const slides = useMemo(() => pageSlides(colorways, extras, blank, (a) => `extra:${a.id}`), [colorways, extras, blank]);
  const current = colorways[selected];
  const hasBackChoice = !!current.blankViews?.length;
  const slide = slides[index];

  // "#cw-<slug>" from a shop card: open on that colorway
  useEffect(() => {
    const ci = colorwayFromHash(window.location.hash, colorways);
    if (ci > 0) {
      setSelected(ci);
      setGoTo((g) => ({ index: firstSlideOf(slides, ci), seq: g.seq + 1, instant: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const jump = (ci: number, focus = false) => {
    setSelected(ci);
    setGoTo((g) => ({ index: firstSlideOf(slides, ci), seq: g.seq + 1 }));
    if (focus) radios.current[ci]?.focus();
  };
  const onRadioKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = colorways.length;
    const to = { ArrowRight: (i + 1) % n, ArrowDown: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, ArrowUp: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    jump(to, true);
  };

  const alt = (s: (typeof slides)[number]) =>
    s.colorway === null ? (s.asset.alt ?? s.asset.title) : `${title} in ${colorways[s.colorway].name}${s.view && s.view.kind !== "front" ? `, ${s.view.label.toLowerCase()}` : ""}`;
  const caption = slide?.colorway === null ? [] : viewCaption(slide?.view, hasBackChoice, blank);

  return (
    <div data-colorway-picker={productId} data-gallery-variant="page" data-selected-colorway={current.slug}>
      <div className="-mx-5 sm:-mx-8 md:mx-0">
        <SwipeCarousel
          label={`${title} photos`}
          slides={slides.map((s) => ({ key: s.key, asset: s.asset, alt: alt(s) }))}
          sizes="(min-width: 768px) 55vw, 100vw"
          priority
          goTo={goTo}
          onIndexChange={(i) => {
            setIndex(i);
            setSelected((prev) => colorwayAt(slides, i, prev));
          }}
          className="aspect-square md:rounded-2xl md:ring-1 md:ring-line"
          overlay={<ComingSoonTag />}
        />
      </div>

      <p className="mt-3 min-h-4 text-xs text-muted" aria-live="polite" data-colorway-name>
        {current.name}
        {caption.map((t) => (
          <span key={t}> · {t}</span>
        ))}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
        {colorways.length > 1 && (
          <div role="radiogroup" aria-label={`${title} colorways`} className="-ml-1.5 flex gap-1">
            {colorways.map((c, i) => (
              <button
                key={c.slug}
                ref={(el) => {
                  radios.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={i === selected}
                aria-label={c.name}
                title={c.name}
                tabIndex={i === selected ? 0 : -1}
                data-colorway={c.slug}
                onClick={() => jump(i)}
                onKeyDown={(e) => onRadioKey(e, i)}
                // 32px hit area around a 20px dot
                className="grid h-8 w-8 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold"
              >
                <span
                  aria-hidden="true"
                  className={clsx("h-5 w-5 rounded-full transition", i === selected ? "ring-2 ring-cream ring-offset-2 ring-offset-ink" : "ring-1 ring-line-strong")}
                  style={{ backgroundColor: c.swatch ?? c.asset.dominantColor ?? "#201B25" }}
                />
              </button>
            ))}
          </div>
        )}
        {hasBackChoice && (
          <div role="radiogroup" aria-label={`${title} back`} className="flex items-center gap-1.5" data-back-choice>
            <span className="pr-1 text-xs text-muted">Back:</span>
            {(
              [
                ["Printed", false],
                ["Blank", true],
              ] as const
            ).map(([label, value]) => (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={blank === value}
                data-back-option={label.toLowerCase()}
                onClick={() => {
                  setBlank(value);
                  // show the back that just changed
                  const k = slide?.view?.kind;
                  if (k !== "back" && k !== "model-back") {
                    const b = slides.findIndex((s) => s.colorway === selected && s.view?.kind === "back");
                    if (b >= 0) setGoTo((g) => ({ index: b, seq: g.seq + 1 }));
                  }
                }}
                className={clsx(
                  "h-8 rounded-full px-3 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold",
                  blank === value ? "bg-cream text-ink" : "border border-line-strong text-cream-dim hover:text-cream",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
