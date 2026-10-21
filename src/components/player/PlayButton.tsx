"use client";

import { usePlayer, type PlayerTrack } from "./PlayerProvider";
import { PauseIcon, PlayIcon } from "./icons";

/** Single-track spot: one button that hands the track to the global mini-player. */
export function PlayButton({ track, label }: { track: PlayerTrack; label?: string }) {
  const p = usePlayer();
  const active = p.current?.src === track.src;
  const on = active && p.playing;
  return (
    <button
      type="button"
      onClick={() => p.play([track], 0, `single:${track.id}`)}
      aria-label={`${on ? "Pause" : "Play"} ${track.title}`}
      aria-pressed={on}
      className="inline-flex h-11 items-center gap-2 self-start rounded-full px-4 text-sm font-semibold ring-1 ring-line-strong transition hover:bg-cream hover:text-ink"
      data-play-button={track.id}
    >
      {on ? <PauseIcon /> : <PlayIcon />} {label ?? (on ? "Pause" : "Play")}
    </button>
  );
}
