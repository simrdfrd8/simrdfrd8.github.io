"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";
import type { Asset } from "@/lib/catalog/schema";
import { MediaImage } from "./MediaImage";
import { dotWindow, indexAfterDrag, indexForKey, indexFromScroll, isDrag, renderedCount } from "@/lib/carousel";

export type CarouselSlide = { key: string; asset: Asset; alt: string };

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Swipeable image strip, no library: native horizontal scrolling + CSS scroll-snap does touch swipe and trackpad
 * scrolling (vertical page scroll passes straight through, the strip only scrolls sideways). Desktop adds mouse drag,
 * hover arrows and keyboard arrows / Home / End.
 *  - `href`: the strip is one link (tap / click / Enter opens it); a drag never counts as a click.
 *  - `goTo`: ask the strip to scroll to a slide ({ index, seq, instant }; bump seq to repeat the same index).
 *  - Only slides up to one past the furthest seen get a real <img>; the first is eager when `priority`.
 */
export function SwipeCarousel({
  slides,
  label,
  href,
  sizes,
  priority = false,
  goTo,
  onIndexChange,
  hrefFor,
  className,
  overlay,
  dataAttrs,
}: {
  slides: CarouselSlide[];
  label: string;
  href?: string;
  /** Per-slide link target (e.g. open the product on the colorway the shopper swiped to). */
  hrefFor?: (index: number) => string;
  sizes: string;
  priority?: boolean;
  goTo?: { index: number; seq: number; instant?: boolean };
  onIndexChange?: (index: number) => void;
  className?: string;
  overlay?: ReactNode;
  dataAttrs?: Record<string, string>;
}) {
  const n = slides.length;
  const strip = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [maxSeen, setMaxSeen] = useState(0);
  const drag = useRef<{ x: number; y: number; left: number; start: number; moved: boolean; id: number } | null>(null);
  const suppressClick = useRef(false);
  const frame = useRef(0);
  const report = useRef(onIndexChange);
  report.current = onIndexChange;
  const indexRef = useRef(0);
  indexRef.current = index;

  const scrollTo = useCallback((i: number, smooth = true) => {
    const el = strip.current;
    if (!el) return;
    setMaxSeen((m) => Math.max(m, i));
    el.scrollTo({ left: i * el.clientWidth, behavior: smooth && !reducedMotion() ? "smooth" : "auto" });
  }, []);

  const onScroll = () => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = strip.current;
      if (!el) return;
      const i = indexFromScroll(el.scrollLeft, el.clientWidth, n);
      setMaxSeen((m) => Math.max(m, i));
      setIndex((prev) => {
        if (prev !== i) report.current?.(i);
        return i;
      });
    });
  };
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const seq = goTo?.seq;
  useEffect(() => {
    if (goTo && goTo.index >= 0) scrollTo(goTo.index, !goTo.instant);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seq]);

  // keep the current slide in place when the strip changes width (rotation, resize)
  useEffect(() => {
    const el = strip.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      el.scrollTo({ left: indexRef.current * el.clientWidth, behavior: "auto" });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const onKeyDown = (e: KeyboardEvent) => {
    const to = indexForKey(e.key, index, n);
    if (to === null) return;
    e.preventDefault();
    scrollTo(to);
  };

  // mouse drag (touch and trackpads scroll natively)
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || n < 2) return;
    const el = strip.current!;
    drag.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, start: index, moved: false, id: e.pointerId };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = strip.current;
    if (!d || !el || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x;
    if (!d.moved && isDrag(dx, e.clientY - d.y)) {
      d.moved = true;
      el.style.scrollSnapType = "none";
      el.setPointerCapture(e.pointerId);
    }
    if (d.moved) el.scrollLeft = d.left - dx;
  };
  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = strip.current;
    drag.current = null;
    if (!d || !el || !d.moved) return;
    suppressClick.current = true;
    const to = indexAfterDrag(d.start, e.clientX - d.x, el.clientWidth, n);
    el.style.scrollSnapType = "";
    scrollTo(to);
  };

  const rendered = renderedCount(maxSeen, n);
  const [first, last] = dotWindow(index, n);
  const current = slides[index];

  const stripEl = (
    <div
      ref={strip}
      onScroll={onScroll}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDragStart={(e) => e.preventDefault()}
      className="no-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain select-none"
      style={{ scrollbarWidth: "none" }}
      data-carousel-strip
    >
      {slides.map((s, i) => (
        <div
          key={s.key}
          className="relative h-full w-full shrink-0 snap-center snap-always"
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} of ${n}: ${s.alt}`}
          aria-hidden={i !== index}
          data-slide={i}
          style={{ backgroundColor: s.asset.dominantColor ?? "#201B25" }}
        >
          {i < rendered ? (
            <MediaImage
              asset={s.asset}
              alt={s.alt}
              fit="cover"
              // model shots are 3:4: in the square frame keep the face and the whole shirt, crop at the shins
              imgClassName={s.asset.orientation === "portrait" ? "object-[50%_18%]" : undefined}
              sizes={sizes}
              priority={priority && i === 0}
              className="absolute inset-0"
            />
          ) : null}
        </div>
      ))}
    </div>
  );

  return (
    <div className={clsx("group/car relative overflow-hidden", className)} role="region" aria-roledescription="carousel" aria-label={label} data-carousel data-index={index} {...dataAttrs}>
      {href || hrefFor ? (
        <Link
          href={hrefFor ? hrefFor(index) : href!}
          aria-label={`${label}. ${n > 1 ? "Swipe or use arrow keys for more photos; " : ""}open the product.`}
          onKeyDown={onKeyDown}
          onClickCapture={(e) => {
            if (suppressClick.current) {
              e.preventDefault();
              e.stopPropagation();
              suppressClick.current = false;
            }
          }}
          draggable={false}
          className="block h-full w-full focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold"
          data-product-link
        >
          {stripEl}
        </Link>
      ) : (
        <div
          tabIndex={0}
          onKeyDown={onKeyDown}
          onClickCapture={() => (suppressClick.current = false)}
          aria-label={n > 1 ? `${label}. Swipe or use arrow keys for more photos.` : label}
          className="h-full w-full focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold"
        >
          {stripEl}
        </div>
      )}

      {overlay}

      {n > 1 && (
        <>
          <ArrowButton dir={-1} hidden={index === 0} onClick={() => scrollTo(index - 1)} />
          <ArrowButton dir={1} hidden={index === n - 1} onClick={() => scrollTo(index + 1)} />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/25 px-2 py-1.5 backdrop-blur-sm"
            data-dots
          >
            {slides.slice(first, last + 1).map((s, k) => {
              const i = first + k;
              const edge = n > 7 && ((i === first && first > 0) || (i === last && last < n - 1));
              return (
                <span
                  key={s.key}
                  className={clsx("rounded-full transition-all duration-200 motion-reduce:transition-none", i === index ? "h-1.5 w-4 bg-white" : clsx("bg-white/60", edge ? "h-1 w-1" : "h-1.5 w-1.5"))}
                />
              );
            })}
          </div>
          <p className="sr-only" aria-live="polite">
            {`Photo ${index + 1} of ${n}${current ? `: ${current.alt}` : ""}`}
          </p>
        </>
      )}
    </div>
  );
}

function ArrowButton({ dir, hidden, onClick }: { dir: 1 | -1; hidden: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={dir < 0 ? "Previous photo" : "Next photo"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={clsx(
        "absolute top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-lg leading-none text-white backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none [@media(hover:hover)_and_(pointer:fine)]:grid",
        dir < 0 ? "left-2.5" : "right-2.5",
        hidden ? "pointer-events-none !opacity-0" : "opacity-0 group-hover/car:opacity-100 hover:bg-black/55",
      )}
    >
      <span aria-hidden="true">{dir < 0 ? "‹" : "›"}</span>
    </button>
  );
}

/** Small, quiet corner tag for unreleased pieces (replaces the big "Coming soon" badges). */
export function ComingSoonTag({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        "pointer-events-none absolute top-2.5 right-2.5 z-10 rounded-full bg-black/40 px-2 py-[3px] text-[10px] leading-none font-medium tracking-[0.08em] text-white/90 uppercase backdrop-blur-sm",
        className,
      )}
      data-coming-soon
    >
      Coming soon
    </span>
  );
}
