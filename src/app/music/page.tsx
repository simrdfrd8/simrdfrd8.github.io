import type { Metadata } from "next";
import Link from "next/link";
import { catalog, getProducts, getReleases, getSamplePacks, getTracks, artistName, getCollection, collectionTracks, getAsset, getBeats } from "@/lib/catalog";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ShowMore } from "@/components/ShowMore";
import { BeatStore } from "@/components/BeatStore";
import { SoundCloudEmbed } from "@/components/SoundCloudEmbed";
import { getLatest } from "@/lib/soundcloud-latest";
import { creditLine } from "@/lib/catalog";
import { PageHeader } from "@/components/PageHeader";
import { ReleaseCard, TrackCard } from "@/components/TrackCard";
import { ProductCard } from "@/components/ProductCard";
import { SpotifyEmbed } from "@/components/SpotifyEmbed";
import { SupportBand } from "@/components/SupportBand";
import { ButtonLink, Section } from "@/components/ui";
import { JsonLd, releaseLd, trackLd } from "@/lib/jsonld";
import { Productions } from "@/components/Productions";
import { CHECKOUT_LIVE } from "@/lib/env";
import { SongList, SONG_SOUNDCLOUD_URLS } from "@/components/SongList";

export const metadata: Metadata = { title: "Music", description: "Play Flavorful Croissants in full, free, and lease beats. Also on Spotify and SoundCloud.", alternates: { canonical: "/music" } };

/** ISR: the "Latest on SoundCloud" list refreshes from public SoundCloud data at most every 6 hours. */
export const revalidate = 21600;

const FC_SPOTIFY = "7HVJPuRrvPJmyt0s5Rnvb0";

export default async function MusicPage() {
  const fetched = await getLatest();
  const latest = { ...fetched, tracks: fetched.tracks.filter((t) => !SONG_SOUNDCLOUD_URLS.has(t.url)) };
  // First section: the owner's SoundCloud "Release" playlist (720M collabs only). The FANNYPACK-folder
  // collection (fc-x-720m) stays in content for the artist pages but no longer drives this section.
  const col = getCollection("release");
  const colTracks = collectionTracks("release");
  const colVideos = (col?.videoAssetIds ?? []).map((id) => getAsset(id)).filter((a) => a !== undefined);
  const beats = getBeats("rapper");
  const releases = getReleases();
  const tracks = getTracks().filter((t) => !SONG_SOUNDCLOUD_URLS.has(t.url));
  const playlist = tracks.find((t) => t.kind === "playlist" && t.featured);
  const featured = tracks.filter((t) => t.kind === "track" && t.featured);
  const more = tracks.filter((t) => t.kind === "track" && !t.featured && !t.collections.length && t.embeddable).slice(0, 8);
  const goods = getProducts().filter((p) => ["download", "stems", "sample-pack", "license"].includes(p.type));
  const sc = catalog.site.socials.find((s) => s.platform === "soundcloud")?.url;

  return (
    <>
      <PageHeader kicker="Stream free · buy what you love" title="Music" accent="#F8E8D2">
        Every song plays in full, free, right here. Press play and it keeps going while you browse.
      </PageHeader>

      <Section id="songs" kicker="Full length · free" title="Songs">
        <SongList id="music-songs" />
      </Section>

      {col && (
        <Section id="fc-x-720m" kicker={col.kicker} title={col.title} tone="raised" action={<ButtonLink href="/artists/720m" variant="secondary">720M</ButtonLink>}>
          <p className="-mt-4 mb-10 max-w-2xl text-lg text-cream-dim">{col.blurb}</p>
          <ShowMore initial={8} className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {colTracks.map((t) => (
              <TrackCard key={t.id} track={t} />
            ))}
          </ShowMore>
          {colVideos.length > 0 && (
            <div className="mt-14 grid items-start gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {colVideos.map((v) => (
                <VideoPlayer key={v.id} asset={v} />
              ))}
            </div>
          )}
          <JsonLd data={colTracks.filter((t) => t.embeddable).map((t) => trackLd(t, creditLine(t)))} />
        </Section>
      )}

      <Section
        id="latest"
        kicker={`SoundCloud · newest uploads${latest.stale ? " (cached)" : ""}`}
        title="Latest on SoundCloud"
        action={sc && <ButtonLink href={sc} target="_blank" rel="noopener noreferrer" variant="secondary">Follow ↗</ButtonLink>}
      >
        <ol className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-5" data-latest-count={latest.tracks.length}>
          {latest.tracks.map((t) => {
            const sub = [new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }), creditLine({ artist: "flavorful-croissants", artists: t.artists, collaborators: t.collaborators })].join(" · ");
            return (
              <li key={t.url} className="flex flex-col gap-3 border-t border-line pt-4" data-latest={t.url} data-date={t.date}>
                
                <div>
                  <p className="font-semibold">{t.displayTitle}</p>
                  <p className="text-sm text-muted">{sub}</p>
                  <SoundCloudEmbed url={t.url} title={t.displayTitle} verified />
                </div>
              </li>
            );
          })}
        </ol>
        <p className="mt-8 text-sm text-muted">Pulled from the public SoundCloud profile and RSS feed, newest first. They open on SoundCloud.</p>
      </Section>

      <Section
        id="most-played"
        kicker="Spotify · Flavorful Croissants only"
        title="Most played on Spotify"
        tone="raised"
        action={
          <ButtonLink href={`https://open.spotify.com/artist/${FC_SPOTIFY}`} target="_blank" rel="noopener noreferrer" variant="secondary">
            Follow on Spotify ↗
          </ButtonLink>
        }
      >
        <p className="text-cream-dim">Spotify keeps this list current, so it stays a link. <SpotifyEmbed kind="artist" id={FC_SPOTIFY} title="Flavorful Croissants: most played" /></p>
      </Section>

      {beats.length > 0 && (
        <Section
          id="buy-beats"
          kicker="For rappers & artists · lease or buy"
          title="Buy beats"
          action={<ButtonLink href="/shop?lane=rapper#lanes" variant="secondary">See all beats</ButtonLink>}
        >
          <BeatStore id="music-beats" />
          <p className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/shop?lane=dj#lanes" className="underline decoration-line-strong underline-offset-4 hover:text-cream">DJ edits →</Link>
            <Link href="/shop?lane=producer#lanes" className="underline decoration-line-strong underline-offset-4 hover:text-cream">Sample packs →</Link>
            {!CHECKOUT_LIVE && <span className="text-muted">Checkout is coming soon.</span>}
          </p>
        </Section>
      )}

      <Section id="spotify" kicker="Spotify · Flavorful Croissants" title="Releases">
        <div className="grid gap-x-6 gap-y-8 lg:grid-cols-2">
          {releases.map((r) => (
            <ReleaseCard key={r.id} release={r} />
          ))}
        </div>
        <JsonLd data={releases.map((r) => releaseLd(r, artistName(r.artist)))} />
      </Section>

      <Section
        id="soundcloud"
        kicker="SoundCloud · curated"
        title="Listen to Flavorful Croissants"
        tone="raised"
        action={
          sc && (
            <ButtonLink href={sc} target="_blank" rel="noopener noreferrer" variant="secondary">
              Follow on SoundCloud ↗
            </ButtonLink>
          )
        }
      >
        {playlist && (
          <div className="mb-14 grid items-center gap-8 md:grid-cols-[minmax(0,420px)_1fr]">
            <TrackCard track={playlist} size="lg" />
            <div className="hidden md:block">
              <p className="kicker text-muted">Beat tape · 2021</p>
              <p className="display mt-3 text-6xl lg:text-7xl">{playlist.title}</p>
              {playlist.description && <p className="mt-4 max-w-lg text-lg text-cream-dim">{playlist.description}</p>}
            </div>
          </div>
        )}
        <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((t) => (
            <TrackCard key={t.id} track={t} />
          ))}
        </div>
        {more.length > 0 && (
          <details className="group mt-14 rounded-2xl border border-line">
            <summary className="flex cursor-pointer list-none items-center justify-between p-6 text-lg font-semibold">
              More from the workshop <span className="kicker text-muted group-open:hidden">Show {more.length}</span>
              <span className="kicker hidden text-muted group-open:inline">Hide</span>
            </summary>
            <div className="grid gap-x-6 gap-y-12 p-6 pt-0 sm:grid-cols-2 lg:grid-cols-4">
              {more.map((t) => (
                <TrackCard key={t.id} track={t} />
              ))}
            </div>
          </details>
        )}
        <p className="mt-8 text-sm text-muted">These open on SoundCloud. Track notes come from public SoundCloud metadata.</p>
        <JsonLd data={featured.map((t) => trackLd(t, artistName(t.artist)))} />
      </Section>

      <Section
        id="productions"
        kicker="Flavorful Croissants · solo productions"
        title="Productions"
        action={
          <ButtonLink href="/licensing" variant="secondary">
            License terms
          </ButtonLink>
        }
      >
        <Productions tracks={tracks.filter((t) => t.kind === "track" && t.credit === "solo" && t.audience)} packs={getSamplePacks()} />
      </Section>

      {goods.length > 0 && (
        <Section id="downloads" kicker="Downloads · stems · sample packs" title="For your library" tone="raised">
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {goods.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Section>
      )}
      <SupportBand title="Liked what you heard?" />
    </>
  );
}
