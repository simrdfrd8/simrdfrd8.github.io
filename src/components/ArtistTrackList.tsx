import type { Public720mTrack } from "@/lib/catalog";
import { mediaUrl } from "@/lib/env";
import { formatDuration } from "@/lib/format";
import { PlayButton } from "./player/PlayButton";

/**
 * Curated vocal tracks on 720M's page: a playable MP3 preview only. No Payhip or site checkout.
 */
export function ArtistTrackList({ tracks }: { tracks: Public720mTrack[] }) {
  return (
    <div data-artist-tracks>
      <ol className="divide-y divide-line">
        {tracks.map((track) => {
          const src = mediaUrl(track.src);
          const meta = formatDuration(track.durationSec) || null;
          return (
            <li key={track.id} data-track={track.id} className="flex flex-wrap items-center gap-4 py-4 sm:flex-nowrap">
              {src ? (
                <PlayButton
                  track={{ id: `720m-${track.id}`, title: track.title, src, subtitle: track.credit, durationSec: track.durationSec }}
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{track.title}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {track.credit}
                  {meta ? <span className="tabular-nums"> · {meta}</span> : null}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
