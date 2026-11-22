import type { Public720mTrack } from "@/lib/catalog";
import { mediaUrl } from "@/lib/env";
import { formatDuration } from "@/lib/format";
import { PlayButton } from "./player/PlayButton";

const SC_WIDGET = (scId: number) =>
  `https://w.soundcloud.com/player/?url=${encodeURIComponent(`https://api.soundcloud.com/tracks/${scId}`)}&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`;

/**
 * Curated vocal tracks on 720M's page: a playable MP3 preview, or an official SoundCloud embed when that is the source.
 * Play-only. No Payhip or site checkout. Never hosts ripped SoundCloud audio.
 */
export function ArtistTrackList({ tracks }: { tracks: Public720mTrack[] }) {
  return (
    <div data-artist-tracks>
      <ol className="divide-y divide-line">
        {tracks.map((track) => {
          const src = track.src ? mediaUrl(track.src) : "";
          const meta = formatDuration(track.durationSec) || null;
          const scEmbed = track.scId && track.soundcloudUrl ? SC_WIDGET(track.scId) : "";
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
                {track.producedBy ? (
                  <p className="mt-0.5 text-xs text-muted">Produced by {track.producedBy}</p>
                ) : null}
                {scEmbed && track.soundcloudUrl ? (
                  <>
                    <iframe
                      title={`${track.title} on SoundCloud`}
                      data-embed="soundcloud"
                      className="mt-3 w-full"
                      width="100%"
                      height="120"
                      loading="lazy"
                      scrolling="no"
                      allow="autoplay"
                      src={scEmbed}
                    />
                    <a
                      href={track.soundcloudUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs text-muted underline-offset-2 hover:underline"
                    >
                      Listen on SoundCloud ↗
                    </a>
                  </>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
