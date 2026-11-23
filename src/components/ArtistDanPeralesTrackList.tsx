import { getArtist, listedDanPeralesSingles } from "@/lib/catalog";
import { JsonLd, releaseLd } from "@/lib/jsonld";

const SPOTIFY_EMBED = (id: string) => `https://open.spotify.com/embed/track/${id}?utm_source=generator&theme=0`;

/**
 * Dan Perales's six Psychadelic Shorty singles as a compact official-Spotify list.
 * Playback is the official embed only — no downloaded or self-hosted audio.
 */
export function ArtistDanPeralesTrackList() {
  const tracks = listedDanPeralesSingles();
  const artistName = getArtist("dan-perales")?.name ?? "Dan Perales";
  return (
    <div data-artist-tracks="dan-perales">
      {/* Right + bottom padding on small screens keeps the last (and in-viewport) play button clear of the floating Support heart. */}
      <ol className="divide-y divide-line pr-16 pb-20 md:pr-0 md:pb-0">
        {tracks.map((release) => {
          const embedId = release.spotify?.kind === "track" ? release.spotify.id : null;
          return (
            <li key={release.id} data-release={release.id} data-track={release.id} className="py-3">
              {embedId ? (
                <iframe
                  title={`${release.title} on Spotify`}
                  data-embed="spotify"
                  className="w-full"
                  style={{ border: 0, borderRadius: 12 }}
                  width="100%"
                  height="80"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  src={SPOTIFY_EMBED(embedId)}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
      {tracks.length > 0 ? <JsonLd data={tracks.map((r) => releaseLd(r, artistName))} /> : null}
    </div>
  );
}
