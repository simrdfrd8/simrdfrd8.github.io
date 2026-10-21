"use client";

import { useRef, useState } from "react";
import { usePlayer } from "./player/PlayerProvider";

/**
 * Vertical 9:16 brand film. Poster first; the video mounts only on click (no autoplay), starts muted with
 * controls on so the viewer chooses to unmute. Without `src` (public build, cut not approved) it's poster + "Coming soon".
 */
export function BrandFilm({ src, poster, title }: { src?: string; poster: string; title: string }) {
  const [on, setOn] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);
  const player = usePlayer();
  const start = () => {
    if (player.playing) player.toggle();
    setOn(true);
    requestAnimationFrame(() => ref.current?.play().catch(() => {}));
  };
  return (
    <div className="relative mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-2xl border border-line bg-raised" data-film-slot data-film-state={src ? (on ? "playing" : "poster") : "coming-soon"}>
      {on && src ? (
        <video ref={ref} src={src} poster={poster} controls muted playsInline preload="metadata" className="absolute inset-0 h-full w-full bg-ink object-contain" aria-label={title} data-brand-film />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={poster} alt="Illustrated triangle-headed crew dancing" className="absolute inset-0 h-full w-full object-cover" />
          {src ? (
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
