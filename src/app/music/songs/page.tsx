import type { Metadata } from "next";
import Link from "next/link";
import { artistName, catalog, getReleases } from "@/lib/catalog";
import { PageHeader } from "@/components/PageHeader";
import { SongList, songsFor } from "@/components/SongList";
import { SpotifyEmbed } from "@/components/SpotifyEmbed";
import { ButtonLink, Section } from "@/components/ui";
import { publishedReleaseIds, publishedSongIds, songBuyable } from "@/lib/music-visibility";

export const metadata: Metadata = {
  title: "Songs",
  description: "Songs by artist: play the self-hosted songs in full, free, and find every release on Spotify and SoundCloud.",
  alternates: { canonical: "/music/songs" },
};

/**
 * /music/songs/: songs by artist, then releases (albums & EPs, singles), then more on SoundCloud. Only what the published music
 * snapshot lists, and only songs that are already public (self-hosted on /music/ or released on Spotify/SoundCloud).
 * Every artist is listed on their own. Song and album downloads stay "Coming soon" until music rights are cleared.
 */
export default function SongsPage() {
  const songIds = publishedSongIds();
  const relIds = publishedReleaseIds();
  const releases = getReleases().filter((r) => relIds.has(r.id));
  const sc = catalog.site.socials.find((s) => s.platform === "soundcloud")?.url;
  const scArtists = new Set(catalog.soundcloud.flatMap((t) => [t.artist, ...(t.artists ?? [])]));
  // artist order: the roster order, only artists with something to play here
  const artists = catalog.artists.filter((a) => songsFor(a.slug).some((s) => songIds.has(s.id)) || releases.some((r) => r.artist === a.slug));

  return (
    <>
      <PageHeader kicker="By artist · stream free" title="Songs" accent="#F8E8D2">
        Pick an artist. Songs hosted here play in full in the player; everything else opens on Spotify or SoundCloud.
      </PageHeader>

      <nav aria-label="Artists" className="px-5 sm:px-8 lg:px-12">
        <ul className="mx-auto flex max-w-[1440px] flex-wrap gap-2" data-artist-chips>
          {artists.map((a) => (
            <li key={a.slug}>
              <a href={`#${a.slug}`} className="inline-flex rounded-full border border-line-strong px-4 py-2 text-sm font-semibold hover:bg-cream hover:text-ink" data-artist-chip={a.slug}>
                {a.name}
              </a>
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-4 max-w-[1440px] text-sm text-muted" data-downloads-soon>
          Song and album downloads are coming soon. Looking for beats? <Link href="/music#buy-beats" className="underline underline-offset-4 hover:text-cream">Buy beats →</Link>
        </p>
      </nav>

      {artists.map((a, i) => {
        const own = releases.filter((r) => r.artist === a.slug);
        const albums = own.filter((r) => r.type === "album" || r.type === "ep");
        const singles = own.filter((r) => r.type !== "album" && r.type !== "ep");
        const hasSongs = songsFor(a.slug).some((s) => songIds.has(s.id));
        return (
          <Section
            key={a.slug}
            id={a.slug}
            kicker={a.role ?? "Artist"}
            title={a.name}
            tone={i % 2 ? "raised" : "ink"}
            action={<ButtonLink href={`/artists/${a.slug}`} variant="secondary">About {a.name}</ButtonLink>}
          >
            <div data-artist-section={a.slug} className="flex flex-col gap-14">
              {hasSongs && (
                <div>
                  <h3 className="kicker mb-4 text-muted">Songs · full length</h3>
                  <SongList id={`songs-${a.slug}`} artist={a.slug} only={[...songIds]} />
                </div>
              )}
              {albums.length > 0 && <Releases title="Albums & EPs" items={albums} />}
              {singles.length > 0 && <Releases title="Singles" items={singles} />}
              {sc && scArtists.has(a.slug) && (
                <p className="text-sm">
                  <a href={sc} target="_blank" rel="noopener noreferrer" className="underline decoration-line-strong underline-offset-4 hover:text-cream" data-more-soundcloud>
                    More on SoundCloud ↗
                  </a>
                </p>
              )}
            </div>
          </Section>
        );
      })}
    </>
  );

  function Releases({ title, items }: { title: string; items: typeof releases }) {
    return (
      <div>
        <h3 className="kicker mb-4 text-muted">{title}</h3>
        <div className="grid gap-x-6 gap-y-8 lg:grid-cols-2">
          {items.map((r) => (
            <article key={r.id} className="flex flex-col gap-3 border-t border-line pt-4" data-release={r.id}>
              <h4 className="text-lg font-semibold">{r.title}</h4>
              {r.spotify ? <SpotifyEmbed kind={r.spotify.kind} id={r.spotify.id} title={`${r.title} by ${artistName(r.artist)}`} /> : <p className="text-sm text-muted">Streaming link coming soon.</p>}
              <p className="kicker flex flex-wrap justify-between gap-2 px-1 text-muted">
                <span>{[r.type, r.year].filter(Boolean).join(" · ")}{r.trackCount && r.trackCount > 1 ? ` · ${r.trackCount} tracks` : ""}</span>
                {!songBuyable(r.id) && <span data-buy-soon>Download: coming soon</span>}
              </p>
            </article>
          ))}
        </div>
      </div>
    );
  }
}
