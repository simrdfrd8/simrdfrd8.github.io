"use client";

import { useRef, useState, type ReactNode } from "react";
import { PlayIcon } from "./ui";

/** Poster first; the <video> element is only created on click, then played (never autoplay). */
export function VideoFacade({ src, poster, title, ratio, posterNode }: { src?: string; poster?: string; title: string; ratio: string; posterNode: ReactNode }) {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);
  if (active && src) {
    return (
      <video
        ref={(el) => {
          ref.current = el;
          if (el && el.paused && !el.dataset.started) {
            el.dataset.started = "1";
            el.play().catch(() => undefined);
          }
        }}
        className="absolute inset-0 h-full w-full bg-black object-contain"
        style={{ aspectRatio: ratio }}
        src={src}
        poster={poster}
        controls
        playsInline
        preload="metadata"
        aria-label={title}
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      disabled={!src}
      aria-label={src ? `Play video: ${title}` : `${title} (video coming soon)`}
      className="group/play absolute inset-0 block h-full w-full cursor-pointer text-left disabled:cursor-default"
    >
      {posterNode}
      <span className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
      {src && (
        <span className="absolute bottom-4 left-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-cream text-ink shadow-xl transition-transform duration-300 group-hover/play:scale-110">
          <PlayIcon className="h-6 w-6 translate-x-0.5" />
        </span>
      )}
    </button>
  );
}
