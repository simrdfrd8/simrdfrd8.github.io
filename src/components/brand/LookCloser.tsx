"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import clsx from "clsx";
import type { BrandImage } from "@/lib/brand-assets";

/**
 * "Look closer" lens zoom (ported from Brandy's 720m.html).
 * - Fine pointer (mouse): hover zooms 2x toward the pointer, leaving resets.
 * - Touch / pen: tap toggles the zoom; while zoomed, dragging pans (touch-action: none only while zoomed,
 *   so the page still scrolls normally at 390px when it isn't).
 * - Keyboard: it's a toggle button (Enter / Space zoom into the centre, Escape resets); aria-pressed reflects state.
 * - Reduced motion: zoom is instant (CSS).
 */
export function LookCloser({ image, alt, label = "Look closer: zoom into the sunglasses" }: { image: BrandImage | null; alt: string; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  const fine = () => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const aim = (e: { clientX: number; clientY: number }) => {
    const f = ref.current;
    if (!f) return;
    const r = f.getBoundingClientRect();
    const clamp = (v: number) => Math.max(0, Math.min(100, v));
    f.style.setProperty("--ox", `${clamp(((e.clientX - r.left) / r.width) * 100)}%`);
    f.style.setProperty("--oy", `${clamp(((e.clientY - r.top) / r.height) * 100)}%`);
  };
  const center = () => {
    ref.current?.style.setProperty("--ox", "50%");
    ref.current?.style.setProperty("--oy", "50%");
  };
  const onEnter = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && fine()) {
      aim(e);
      setOn(true);
    }
  };
  const onLeave = (e: PointerEvent) => {
    if (e.pointerType === "mouse") setOn(false);
  };
  const onMove = (e: PointerEvent) => {
    if (on) aim(e);
  };
  const onDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && fine()) return;
    aim(e);
    setOn((v) => !v);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      center();
      setOn((v) => !v);
    } else if (e.key === "Escape") setOn(false);
  };

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      aria-pressed={on}
      aria-label={label}
      className={clsx("loupe", on && "on")}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onPointerMove={onMove}
      onPointerDown={onDown}
      onKeyDown={onKey}
      data-loupe
    >
      {image ? (
        <picture>
          <source type="image/webp" srcSet={image.webpSet} sizes="(max-width:820px) 100vw, 760px" />
          { }
          <img className="loupe-media" src={image.src} srcSet={image.srcSet} sizes="(max-width:820px) 100vw, 760px" width={image.width} height={image.height} loading="lazy" alt={alt} draggable={false} />
        </picture>
      ) : (
        <LensPlaceholder />
      )}
      <span className="cue" aria-hidden="true">
        Look closer
      </span>
    </div>
  );
}

/** Stand-in until the approved lens-detail photo is in public/brand/720m/ (two lenses with crew triangles inside). */
function LensPlaceholder() {
  return (
    <svg className="loupe-media" viewBox="0 0 650 270" role="img" aria-label="Lens detail photo coming soon" preserveAspectRatio="xMidYMid slice" data-placeholder>
      <defs>
        <radialGradient id="lg" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#3a2c45" />
          <stop offset="1" stopColor="#0f0c13" />
        </radialGradient>
      </defs>
      <rect width="650" height="270" fill="#17121C" />
      {[195, 455].map((cx, i) => (
        <g key={cx}>
          <circle cx={cx} cy="135" r="105" fill="url(#lg)" stroke="#F8E8D2" strokeOpacity=".35" strokeWidth="6" />
          <polygon points={`${cx - 22},${150 + i * 6} ${cx},${108 + i * 6} ${cx + 22},${150 + i * 6}`} fill={i ? "#B6FF3B" : "#FF7A59"} opacity=".75" />
          <polygon points={`${cx + 18},${168} ${cx + 30},${146} ${cx + 42},${168}`} fill="#8C7CFF" opacity=".6" />
        </g>
      ))}
      <path d="M300 128 Q325 112 350 128" stroke="#F8E8D2" strokeOpacity=".35" strokeWidth="6" fill="none" />
    </svg>
  );
}
