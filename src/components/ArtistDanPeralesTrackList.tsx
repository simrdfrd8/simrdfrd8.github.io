import { getAsset, getArtist, getCollaborator, listedDanPeralesSingles } from "@/lib/catalog";
import type { Release } from "@/lib/catalog/schema";
import { JsonLd, releaseLd } from "@/lib/jsonld";
import { MediaImage } from "./MediaImage";

const ROLE = { producer: "prod.", featuring: "feat.", collaborator: "with" } as const;

const SPOTIFY_EMBED = (id: string) => `https://open.spotify.com/embed/track/${id}?utm_source=generator&theme=0`;

function creditBits(release: Release) {
  return release.credits.map((c) => `${ROLE[c.role]} ${getCollaborator(c.id)?.name ?? c.id}`).join(" · ");
}

function storeLinks(release: Release) {
  const spotifyUrl = release.spotify ? `https://open.spotify.com/${release.spotify.kind}/${release.spotify.id}` : null;
  const links = [
    ...release.externalUrls.filter((u) => u.platform !== "spotify"),
    ...(spotifyUrl ? [{ platform: "spotify", url: spotifyUrl }] : []),
  ];
  return links.filter((l, i, all) => all.findIndex((x) => x.url === l.url) === i);
}

function label(platform: string) {
  if (platform === "apple-music") return "Apple Music";
  if (platform === "bandcamp") return "Bandcamp";
  if (platform === "spotify") return "Spotify";
  return platform;
}

/**
 * Dan Perales's six Psychadelic Shorty singles as a 720M-style list.
 * Playback is the official Spotify embed only — no downloaded or self-hosted audio.
 */
export function ArtistDanPeralesTrackList() {
  const tracks = listedDanPeralesSingles();
  const artistName = getArtist("dan-perales")?.name ?? "Dan Perales";
  return (
    <div data-artist-tracks="dan-perales">
      <ol className="divide-y divide-line">
        {tracks.map((release) => {
          const cover = getAsset(release.artworkAssetId);
          const bits = creditBits(release);
          const embedId = release.spotify?.kind === "track" ? release.spotify.id : null;
          const links = storeLinks(release);
          return (
            <li key={release.id} data-release={release.id} data-track={release.id} className="py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  {cover ? (
                    <MediaImage
                      asset={cover}
                      sizes="72px"
                      className="h-[72px] w-[72px] shrink-0 rounded-md ring-1 ring-line"
                      showMark={false}
                      alt={`${release.title} cover`}
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{release.title}</p>
                    <p className="mt-0.5 text-xs text-muted">{artistName}</p>
                    {bits ? <p className="mt-0.5 text-xs text-muted">{bits}</p> : null}
                    {links.length > 0 ? (
                      <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                        {links.map((l) => (
                          <a
                            key={l.url}
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-muted underline-offset-2 hover:text-cream hover:underline"
                          >
                            {label(l.platform)} ↗
                          </a>
                        ))}
                      </p>
                    ) : null}
                  </div>
                </div>
                {embedId ? (
                  <iframe
                    title={`${release.title} on Spotify`}
                    data-embed="spotify"
                    className="w-full shrink-0 lg:w-[420px]"
                    style={{ border: 0, borderRadius: 12 }}
                    width="100%"
                    height="80"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    src={SPOTIFY_EMBED(embedId)}
                  />
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
      {tracks.length > 0 ? <JsonLd data={tracks.map((r) => releaseLd(r, artistName))} /> : null}
    </div>
  );
}
