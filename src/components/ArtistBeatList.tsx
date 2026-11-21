import Link from "next/link";
import type { Beat } from "@/lib/catalog/schema";
import { mediaUrl } from "@/lib/env";
import { formatDuration } from "@/lib/format";
import { AGREEMENTS, BEAT_LEASE } from "@/lib/licenses";
import { PlayButton } from "./player/PlayButton";

/**
 * Curated beats on an artist page: a playable MP3 preview and a buy link to the existing Payhip listing
 * under the Beat Lease License v1.0. Does not turn site checkout on.
 */
export function ArtistBeatList({ beats }: { beats: Beat[] }) {
  const mp3 = AGREEMENTS.find((a) => a.slug === "mp3-lease");
  const wav = AGREEMENTS.find((a) => a.slug === "wav-lease");
  return (
    <div data-artist-beats>
      <ol className="divide-y divide-line">
        {beats.map((beat) => {
          const src = beat.audio ? mediaUrl(beat.audio.src) : undefined;
          const meta = [beat.bpm ? `${beat.bpm} BPM` : null, formatDuration(beat.audio?.durationSec) || null].filter(Boolean).join(" · ");
          return (
            <li key={beat.id} data-beat={beat.id} className="flex flex-wrap items-center gap-4 py-4 sm:flex-nowrap">
              {src ? (
                <PlayButton
                  track={{ id: beat.id, title: beat.title, src, subtitle: "Flavorful Croissants", durationSec: beat.audio?.durationSec }}
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{beat.title}</p>
                {meta ? <p className="mt-0.5 text-xs text-muted tabular-nums">{meta}</p> : null}
              </div>
              {beat.payhipUrl ? (
                <a
                  href={beat.payhipUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-beat-buy={beat.id}
                  className="inline-flex h-11 shrink-0 items-center rounded-full bg-cream px-5 text-sm font-semibold text-ink transition hover:bg-logo"
                >
                  Buy{mp3 ? ` · from $${mp3.price}` : ""}
                </a>
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="mt-6 text-sm text-muted" data-beat-lease>
        Licensed under the{" "}
        <Link href={BEAT_LEASE.path} className="underline underline-offset-4 hover:text-cream">
          {BEAT_LEASE.title} (v{BEAT_LEASE.version})
        </Link>
        . {mp3 ? `MP3 Lease $${mp3.price}` : "MP3 Lease"}
        {wav ? ` · WAV Lease $${wav.price}` : ""}.
      </p>
    </div>
  );
}
