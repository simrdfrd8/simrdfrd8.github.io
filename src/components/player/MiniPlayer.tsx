"use client";

import { formatDuration } from "@/lib/format";
import { usePlayer, usePlayerTime } from "./PlayerProvider";
import { NextIcon, PauseIcon, PlayIcon, PrevIcon } from "./icons";

const btn = "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-cream transition hover:bg-cream/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream disabled:opacity-30";

/** Persistent bottom mini-player: title, prev / play-pause / next, scrubber, time. Lives in the root layout. */
export function MiniPlayer() {
  const { current, playing, toggle, next, prev, seek, close, index, queue } = usePlayer();
  const { time, duration } = usePlayerTime();
  if (!current) return null;
  const pct = duration ? Math.min(100, (time / duration) * 100) : 0;
  return (
    <div role="region" aria-label="Audio player" className="fixed inset-x-0 bottom-0 z-[45] border-t border-line bg-[#17121C]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md" data-mini-player data-playing={playing || undefined}>
      <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-3 py-2 sm:gap-4 sm:px-8 lg:px-12">
        <div className="flex items-center">
          <button type="button" className={btn} onClick={prev} disabled={index === 0} aria-label="Previous track"><PrevIcon /></button>
          <button type="button" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream text-ink transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream" onClick={toggle} aria-label={`${playing ? "Pause" : "Play"} ${current.title}`} data-mini-toggle>
            {playing ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
          </button>
          <button type="button" className={btn} onClick={next} disabled={index >= queue.length - 1} aria-label="Next track"><NextIcon /></button>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate text-sm font-semibold" data-mini-title aria-live="polite">{current.title}</p>
            <p className="shrink-0 text-xs text-muted tabular-nums" data-mini-time>
              {formatDuration(time) ?? "0:00"} <span aria-hidden="true">/</span> {formatDuration(duration) ?? "–"}
            </p>
          </div>
          <label className="sr-only" htmlFor="mini-seek">Seek {current.title}</label>
          <input
            id="mini-seek"
            type="range"
            min={0}
            max={Math.max(1, Math.round(duration))}
            step={1}
            value={Math.round(time)}
            onChange={(e) => seek(Number(e.target.value))}
            aria-valuetext={`${formatDuration(time) ?? "0:00"} of ${formatDuration(duration) ?? ""}`}
            className="mini-seek mt-1 block w-full"
            style={{ ["--pct" as string]: `${pct}%` }}
            data-mini-seek
          />
        </div>
        <button type="button" className={`${btn} text-muted`} onClick={close} aria-label="Close player">
          <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-current" fill="none" strokeWidth={2} aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
    </div>
  );
}
