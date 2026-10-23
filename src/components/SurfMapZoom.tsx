"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Zoomable San Diego surf map (OpenSeadragon deep zoom, tiles in public/surf-map/v5.1/).
 * - Nothing heavy loads until the section nears the viewport: then the locally bundled OpenSeadragon script
 *   (public/vendor/openseadragon, no CDN) and the low tile levels load. No autoplay, no animation on its own.
 * - It never traps page scrolling: until the visitor taps/clicks the map, a transparent cover sits on top and
 *   scrolls/swipes pass through to the page. Once active, pinch/drag/wheel zoom and pan the map; "Done", Esc,
 *   or scrolling the section out of view hands scrolling back to the page.
 * The tile set decides how far it zooms (map.dzi): the capped set is half the print resolution.
 */
const BASE = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
const OSD_SRC = `${BASE}/vendor/openseadragon/openseadragon.min.js`;
const DZI = `${BASE}/surf-map/v5.1/map.dzi`;
const POSTER = `${BASE}/surf-map/v5.1/poster.webp`;

type Viewer = {
  setMouseNavEnabled(on: boolean): void;
  setFullScreen(on: boolean): void;
  addHandler(name: string, fn: () => void): void;
  destroy(): void;
  viewport: { goHome(immediately?: boolean): void; zoomBy(factor: number): void; applyConstraints(): void };
};
type OSDFactory = (options: Record<string, unknown>) => Viewer;

let osdPromise: Promise<OSDFactory> | null = null;
function loadOSD(): Promise<OSDFactory> {
  const w = window as unknown as { OpenSeadragon?: OSDFactory };
  if (w.OpenSeadragon) return Promise.resolve(w.OpenSeadragon);
  osdPromise ??= new Promise<OSDFactory>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = OSD_SRC;
    s.async = true;
    s.onload = () => (w.OpenSeadragon ? resolve(w.OpenSeadragon) : reject(new Error("OpenSeadragon missing")));
    s.onerror = () => {
      osdPromise = null;
      reject(new Error("OpenSeadragon failed to load"));
    };
    document.head.appendChild(s);
  });
  return osdPromise;
}

export function SurfMapZoom({ alt }: { alt: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [active, setActive] = useState(false);

  // Load once the section is close to the viewport.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let cancelled = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        setState("loading");
        loadOSD()
          .then((OSD) => {
            if (cancelled || !host.current) return;
            const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            const v = OSD({
              element: host.current,
              tileSources: DZI,
              showNavigationControl: false,
              showNavigator: false,
              mouseNavEnabled: false,
              visibilityRatio: 1,
              constrainDuringPan: true,
              minZoomImageRatio: 1,
              maxZoomPixelRatio: 2,
              animationTime: reduce ? 0 : 0.6,
              springStiffness: reduce ? 20 : 8,
              zoomPerScroll: 1.3,
              gestureSettingsMouse: { clickToZoom: false, dblClickToZoom: true, scrollToZoom: true, dragToPan: true },
              gestureSettingsTouch: { pinchToZoom: true, dragToPan: true, flickEnabled: true, clickToZoom: false, dblClickToZoom: true },
              crossOriginPolicy: false,
              ajaxWithCredentials: false,
            });
            v.addHandler("open", () => setState("ready"));
            v.addHandler("open-failed", () => setState("error"));
            viewer.current = v;
          })
          .catch(() => !cancelled && setState("error"));
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      viewer.current?.destroy();
      viewer.current = null;
    };
  }, []);

  const activate = useCallback(() => {
    if (!viewer.current) return;
    viewer.current.setMouseNavEnabled(true);
    setActive(true);
  }, []);
  const deactivate = useCallback(() => {
    viewer.current?.setMouseNavEnabled(false);
    viewer.current?.viewport.goHome();
    setActive(false);
  }, []);

  // Hand scrolling back when the map leaves the screen or Esc is pressed.
  useEffect(() => {
    if (!active || !wrap.current) return;
    const io = new IntersectionObserver((entries) => entries.every((e) => !e.isIntersecting) && deactivate(), { threshold: 0 });
    io.observe(wrap.current);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && deactivate();
    window.addEventListener("keydown", onKey);
    return () => {
      io.disconnect();
      window.removeEventListener("keydown", onKey);
    };
  }, [active, deactivate]);

  const btn = "flex h-9 min-w-9 items-center justify-center rounded-full bg-ink/85 px-3 text-sm font-bold text-cream ring-1 ring-line backdrop-blur transition-colors hover:bg-ink";
  return (
    <div ref={wrap} className="relative mx-auto aspect-[2/3] w-full max-w-[420px] overflow-hidden rounded-2xl border border-line bg-raised" data-surf-map data-surf-map-state={state} data-surf-map-active={active ? "true" : "false"}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={POSTER} alt={alt} width={450} height={675} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-contain" />
      <div ref={host} className="absolute inset-0" aria-hidden={!active} />
      {!active && (
        <button
          type="button"
          onClick={activate}
          disabled={state !== "ready"}
          className="group absolute inset-0 flex items-end justify-center pb-5 [touch-action:pan-y_pinch-zoom] disabled:cursor-progress"
          aria-label="Explore the map: zoom and pan"
          data-surf-map-activate
        >
          <span className="rounded-full bg-ink/85 px-4 py-2 text-xs font-bold tracking-[2px] text-cream uppercase ring-1 ring-line backdrop-blur transition-transform group-hover:scale-105">
            {state === "error" ? "Map unavailable" : state === "ready" ? "Tap to zoom" : "Loading map…"}
          </span>
        </button>
      )}
      {active && (
        <div className="absolute top-3 right-3 flex gap-2" data-surf-map-controls>
          <button type="button" className={btn} onClick={() => viewer.current?.viewport.zoomBy(1.6)} aria-label="Zoom in"><svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg></button>
          <button type="button" className={btn} onClick={() => { viewer.current?.viewport.zoomBy(1 / 1.6); viewer.current?.viewport.applyConstraints(); }} aria-label="Zoom out"><svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14" /></svg></button>
          <button type="button" className={btn} onClick={() => viewer.current?.setFullScreen(true)} aria-label="Full screen"><svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg></button>
          <button type="button" className={btn} onClick={deactivate} data-surf-map-done>Done</button>
        </div>
      )}
    </div>
  );
}
