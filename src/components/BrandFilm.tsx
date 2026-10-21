"use client";

import { useRef, useState } from "react";
import { usePlayer } from "./player/PlayerProvider";

export type FilmSource = { src: string; media?: string };

/**
 * Vertical 9:16 brand film. Poster first; nothing loads until click (preload="none", no autoplay). On click the
 * source is picked for the screen (phones / narrow → 720, desktop → 1080), then it plays muted with controls on.
 * Without sources (not approved) it's poster + "Coming soon".
 */
export function BrandFilm({ sources, poster, title }: { sources?: FilmSource[]; poster: string; title: string }) {
  const [src, setSrc] = useState<string>();
  const ref = useRef<HTMLVideoElement>(null);
  const player = usePlayer();
  const ready = !!sources?.length;
  const start = () => {
    if (!sources?.length) return;
    const pick = sources.find((s) => !s.media || window.matchMedia(s.media).matches) ?? sources[sources.length - 1];
    if (player.playing) player.toggle();
    setSrc(pick.src);
    requestAnimationFrame(() => ref.current?.play().catch(() => {}));
  };
  return (
    <div className="relative mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-2xl border border-line bg-raised" data-film-slot data-film-state={ready ? (src ? "playing" : "poster") : "coming-soon"}>
      {src ? (
        <video ref={ref} src={src} poster={poster} controls muted playsInline preload="none" className="absolute inset-0 h-full w-full bg-ink object-contain" aria-label={title} data-brand-film />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={poster} alt="Illustrated triangle-headed crew dancing" className="absolute inset-0 h-full w-full object-cover" />
          {ready ? (
            <button type="button" onClick={start} className="group absolute inset-0 flex items-center justify-center" aria-label={`Play: ${title}`} data-film-play>
              <span className="flex size-16 items-center justify-center rounded-full bg-cream/90 text-ink shadow-lg transition-transform group-hover:scale-105">
                <svg viewBox="0 0 24 24" className="ml-1 size-7" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
              </span>
            </button>
          ) : (
            <span className="absolute bottom-0 left-0 m-4 bg-ink/80 px-3 py-1.5 text-xs font-bold tracking-[2px] uppercase">Film · coming soon</span>
          )}
        </>
      )}
    </div>
  );
}
