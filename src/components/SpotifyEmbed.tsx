"use client";

import { useEffect, useRef, useState } from "react";

export const spotifySrc = (kind: string, id: string) => `https://open.spotify.com/embed/${kind}/${id}?utm_source=generator&theme=0`;

/**
 * Official Spotify embed. The iframe is mounted only when the slot nears the viewport and also
 * carries loading="lazy"; no autoplay permission is granted.
 */
export function SpotifyEmbed({ kind, id, title, compact = true, facade }: { kind: "track" | "album" | "artist" | "playlist"; id: string; title: string; compact?: boolean; facade?: { label: string; note?: string } }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const height = compact ? 152 : 352;
  const clickToLoad = Boolean(facade);
  useEffect(() => {
    if (clickToLoad) return; // click-to-load: nothing is fetched until the visitor asks
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) return setVisible(true);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [clickToLoad]);
  return (
    <div ref={ref} className="overflow-hidden rounded-xl bg-raised" style={{ height }}>
      {visible ? (
        <iframe
          title={`Spotify player: ${title}`}
          src={spotifySrc(kind, id)}
          width="100%"
          height={height}
          loading="lazy"
          allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          className="block w-full border-0"
          data-embed="spotify"
        />
      ) : facade ? (
        <button
          type="button"
          onClick={() => setVisible(true)}
          data-facade="spotify"
          className="group flex h-full w-full flex-col items-start justify-end gap-3 bg-[radial-gradient(120%_90%_at_10%_0%,#1db95433_0%,transparent_60%)] p-6 text-left"
        >
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#1db954] text-ink transition group-hover:scale-105" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current"><path d="M8 5v14l11-7z" /></svg>
          </span>
          <span className="text-xl font-semibold">{facade.label}</span>
          {facade.note && <span className="text-sm text-cream-dim">{facade.note}</span>}
        </button>
      ) : (
        <div className="flex h-full items-center px-5 text-sm text-muted" aria-hidden="true">
          Loading Spotify…
        </div>
      )}
    </div>
  );
}
