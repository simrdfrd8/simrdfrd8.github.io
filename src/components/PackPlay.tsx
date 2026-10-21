"use client";

import clsx from "clsx";
import { usePlayer, type PlayerTrack } from "./player/PlayerProvider";
import { PauseIcon, PlayIcon } from "./player/icons";

/** Round play/pause on a pack cover: hands the demo (and the rest of the shelf) to the shared bottom player. */
export function PackPlay({ queue, index }: { queue: PlayerTrack[]; index: number }) {
  const p = usePlayer();
  const t = queue[index];
  const on = p.current?.src === t.src && p.playing;
  return (
    <button
      type="button"
      onClick={() => p.play(queue, index, "sample-packs")}
      aria-label={`${on ? "Pause" : "Play"} ${t.title} demo`}
      aria-pressed={on}
      className={clsx(
        "absolute bottom-2.5 left-2.5 z-10 grid size-11 place-items-center rounded-full backdrop-blur-sm transition",
        on ? "bg-[var(--tl-accent)] text-ink" : "bg-black/50 text-white hover:bg-cream hover:text-ink",
      )}
      data-pack-play={t.id}
    >
      {on ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
    </button>
  );
}
