import { SongList, songsFor } from "./SongList";
import Link from "next/link";
import type { Artist } from "@/lib/catalog/schema";
import { catalog, getAsset, getProducts, getReleases, getTracks, getSamplePacks, visibleAssets, creditLine, assetHasArtist, childArtists, getArtist, getCollaborator, merchProducts, brandApparelAssets } from "@/lib/catalog";
import type { SoundCloudTrack } from "@/lib/catalog/schema";
import { VideoPlayer } from "./VideoPlayer";
import { MediaImage } from "./MediaImage";
import { TrackCard, ReleaseCard } from "./TrackCard";
import { ProductCard } from "./ProductCard";
import { SpotifyEmbed } from "./SpotifyEmbed";
import { InquiryForm } from "./InquiryForm";
import { CheckoutButton } from "./CheckoutButton";
import { ButtonLink, Badge, Section, Heart } from "./ui";
import { formatPrice } from "@/lib/catalog/filters";
import { platformLabel } from "@/lib/format";
import { JsonLd, artistLd, trackLd } from "@/lib/jsonld";
import { Productions } from "./Productions";
import { ArtistCard } from "./ArtistCard";
import { MerchByBrand } from "./Merch";
import type { Release } from "@/lib/catalog/schema";
import Image from "next/image";
import { artistPortrait, hasMarks } from "@/lib/brand-assets";

export function ArtistHero({ artist }: { artist: Artist }) {
  const hero = getAsset(artist.heroAssetId);
  const support = getProducts().find((p) => p.type === "support" && p.artist === artist.slug) ?? getProducts().find((p) => p.type === "support");
  const portraitVideo = hero?.type === "video" && hero.orientation === "portrait";
  const portraitImage = hero && hero.type !== "video" && hero.orientation === "portrait";
  const twoCol = portraitVideo || portraitImage;
  const mark = getAsset(artist.markAssetId);
  const parent = artist.parentArtist ? getArtist(artist.parentArtist) : undefined;
  return (
    <section className="relative overflow-hidden px-5 pt-10 pb-14 sm:px-8 md:pt-16 lg:px-12">
      <div className="pointer-events-none absolute -top-40 -right-40 h-[36rem] w-[36rem] rounded-full opacity-25 blur-3xl" style={{ background: artist.accent }} />
      {artist.motif === "triangles" && <TriangleField />}
      <div className={twoCol ? "relative mx-auto grid max-w-[1440px] items-center gap-12 md:grid-cols-[1.3fr_1fr]" : "relative mx-auto max-w-[1440px]"}>
        <div className="animate-rise">
          <p className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/artists" className="kicker text-muted hover:text-cream">
              ← All artists
            </Link>
            {parent && (
              <Link href={`/artists/${parent.slug}`} className="kicker text-cream-dim hover:text-cream" data-parent-link>
                Part of {parent.name} →
              </Link>
            )}
          </p>
          <p className="kicker mt-8 text-[var(--accent)]">{artist.role}</p>
          <div className="mt-3 flex items-center gap-5">
            {mark && <MediaImage asset={mark} sizes="96px" showMark={false} className="aspect-square w-16 shrink-0 overflow-hidden rounded-2xl ring-1 ring-line md:w-24" />}
            <h1 className={`display artist-title${hasMarks(artist.name) ? " !leading-[1.08] pt-[0.12em]" : ""}`} style={titleSize(artist.name, 10)}>{artist.name}</h1>
          </div>
          <p className="mt-6 max-w-xl text-xl text-cream-dim">{artist.tagline}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {artist.bookable && (
              <ButtonLink href="#book" variant="accent" size="lg">
                {artist.slug === "baylingual-entertainment" ? "Start a project" : artist.slug === "not-daf" ? "Book a DJ set" : `Book ${artist.name}`}
              </ButtonLink>
            )}
            {support && (
              <CheckoutButton product={support} priceLabel={formatPrice(support).label} label={`Support ${artist.slug === "ricky" ? "Ricky" : "the workshop"}`} variant="secondary" size="lg" />
            )}
          </div>
          {artist.links.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-2">
              {artist.links.map((l) => (
                <li key={l.url}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong px-4 text-sm text-cream-dim hover:border-cream hover:text-cream">
                    {l.label ?? platformLabel(l.platform)} <span aria-hidden="true">↗</span>
                    {!l.verified && <span className="sr-only">(unverified)</span>}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        {hero && portraitVideo && <VideoPlayer asset={hero} priority />}
        {hero && portraitImage && <MediaImage asset={hero} priority sizes="(min-width:768px) 40vw, 100vw" className="mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-[1.75rem] ring-1 ring-line" />}
      </div>
      {hero && !twoCol && (
        <div className="relative mx-auto mt-12 max-w-[1440px]">
          {hero.type === "video" ? <VideoPlayer asset={hero} priority /> : <MediaImage asset={hero} priority sizes="100vw" className="aspect-[16/9] rounded-2xl ring-1 ring-line md:aspect-[21/9]" />}
        </div>
      )}
    </section>
  );
}

/** Fluid title size so the longest single word always fits the viewport (wraps only between words, never mid-word). */
function titleSize(name: string, maxRem: number): React.CSSProperties {
  // Floor of 5 so very short words ("NOT DÄF") don't blow past the viewport in the wide hero face.
  const longest = Math.max(5, ...name.split(/\s+/).map((w) => w.length));
  return { fontSize: `clamp(2rem, calc((100vw - 3rem) / ${(longest * 0.7).toFixed(2)}), ${maxRem}rem)` };
}

/** Full-bleed portrait hero (720M pattern) for artists with an approved `<slug>-portrait` brand image. */
function PortraitHero({ artist, img }: { artist: Artist; img: NonNullable<ReturnType<typeof artistPortrait>> }) {
  return (
    <header className="relative -mt-px flex h-[92svh] max-h-[1500px] min-h-[560px] items-end overflow-hidden bg-[#0f0c13] md:h-[118vh] md:min-h-[680px]" data-hero>
      <Image src={img.webp} alt={img.alt} fill priority sizes="100vw" quality={82} className="object-cover object-[50%_28%] md:object-[50%_30%]" style={img.focus ? { objectPosition: img.focus } : undefined} data-portrait />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(23,18,28,0)_55%,rgba(23,18,28,.55)_80%,#17121C_100%)]" />
      <div className="relative z-[2] mx-auto w-full max-w-[1120px] px-5 pb-8 sm:px-8 md:pb-14">
        <p className="kicker text-[var(--accent)]">{artist.role}</p>
        <h1 className={`brand-h artist-title mt-4 mb-2.5 tracking-[4px] [text-shadow:0_2px_30px_rgba(23,18,28,.45)] ${hasMarks(artist.name) ? "leading-[1.1]" : "leading-[.9]"}`} style={titleSize(artist.name, 10)} data-artist-title>{artist.name}</h1>
      </div>
    </header>
  );
}

/** `intro` replaces the generic hero + About (used by the custom 720M page); everything below it stays shared. */
export function ArtistPage({ artist, intro }: { artist: Artist; intro?: React.ReactNode }) {
  const releases = getReleases().filter((r) => r.artist === artist.slug);
  const tracks = getTracks().filter((t) => t.artist === artist.slug || t.artists.includes(artist.slug));
  const byFeatured = (list: SoundCloudTrack[]) => [...list].sort((a, b) => Number(b.featured) - Number(a.featured) || a.order - b.order);
  // Flavorful Croissants: solo productions vs 720M collabs. 720M: lead with the RICKAAAY playlist.
  const groups: { id: string; kicker: string; title: string; lead?: SoundCloudTrack; items: SoundCloudTrack[] }[] =
    artist.slug === "flavorful-croissants"
      ? [
          { id: "productions", kicker: "Solo · produced by Flavorful Croissants", title: "Productions", ...leadSplit(byFeatured(tracks.filter((t) => t.credit === "solo")), "playlist") },
          { id: "collabs", kicker: "With 720M & friends", title: "Collabs", items: byFeatured(tracks.filter((t) => t.credit !== "solo" && t.kind === "track")).slice(0, 8) },
        ]
      : tracks.length
        ? [{ id: "soundcloud", kicker: artist.slug === "720m" ? "720M × Flavorful Croissants" : "On SoundCloud", title: "Listen", ...leadSplit(byFeatured(tracks), "playlist") }]
        : [];
  const videos = visibleAssets().filter((a) => a.type === "video" && assetHasArtist(a, artist.slug) && a.id !== artist.heroAssetId && !a.tags.includes("merch"));
  const art = visibleAssets().filter((a) => a.artist === artist.slug && ["artwork", "illustration", "photo"].includes(a.type) && a.id !== artist.heroAssetId && !a.tags.includes("merch"));
  const products = getProducts().filter((p) => p.artist === artist.slug && p.type !== "support" && p.type !== "merch");
  const merch = merchProducts().filter((p) => p.brand === artist.slug);
  const apparel = brandApparelAssets(artist.slug);
  const children = childArtists(artist.slug);
  const coverReleases = releases.filter((r) => r.artworkAssetId);
  const services = catalog.services.filter((s) => artist.serviceSlugs.includes(s.slug));
  const spotifyArtist = artist.links.find((l) => l.platform === "spotify" && l.verified)?.url.match(/artist\/([A-Za-z0-9]{22})/)?.[1];
  const empty = !releases.length && !tracks.length && !videos.length && !art.length && !products.length && !spotifyArtist;
  const rich = artist.layout === "rich";
  const portrait = artistPortrait(artist.slug);

  const page = (
    <div style={{ ["--accent" as string]: artist.accent, ["--accent-ink" as string]: artist.accentInk }}>
      {intro ?? (
        <>
      {portrait ? <PortraitHero artist={artist} img={portrait} /> : <ArtistHero artist={artist} />}

      <Section id="about" kicker="About" tone="raised">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5 text-lg leading-relaxed text-cream-dim md:text-xl">
            {artist.bio.map((p, i) => (
              <p key={i} className={i === 0 ? "text-2xl leading-snug text-cream md:text-3xl" : undefined}>
                {p}
              </p>
            ))}
          </div>
          <dl className="grid content-start gap-px overflow-hidden rounded-2xl bg-line sm:grid-cols-2 md:grid-cols-1">
            {[...artist.highlights, ...(artist.genres.length ? [{ label: "Sound", value: artist.genres.join(" · ") }] : []), ...(artist.disciplines.length ? [{ label: "Does", value: artist.disciplines.join(" · ") }] : [])].map((h) => (
              <div key={h.label} className="bg-raised p-5">
                <dt className="kicker text-muted">{h.label}</dt>
                <dd className="mt-1 text-lg font-semibold">{h.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>
        </>
      )}

      {songsFor(artist.slug).length > 0 && (
        <Section id="songs" kicker="Full length · free" title="Songs">
          <SongList id={`${artist.slug}-songs`} artist={artist.slug} />
        </Section>
      )}

      {(spotifyArtist || releases.length > 0) && (
        <Section id="releases" kicker="On Spotify" title="Releases">
          {spotifyArtist && (
            <div className="mb-8">
              <SpotifyEmbed kind="artist" id={spotifyArtist} title={`${artist.name} on Spotify`} compact={false} />
            </div>
          )}
          {coverReleases.length > 0 && (
            <div className="mb-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {coverReleases.map((r) => (
                <CoverRelease key={r.id} release={r} />
              ))}
            </div>
          )}
          <div className="grid gap-5 lg:grid-cols-2">
            {releases.filter((r) => !r.artworkAssetId).map((r) => (
              <ReleaseCard key={r.id} release={r} />
            ))}
          </div>
        </Section>
      )}

      {groups.map((g, gi) => (
        <Section
          key={g.id}
          id={g.id}
          kicker={g.kicker}
          title={g.title}
          tone={(gi + (releases.length || spotifyArtist ? 1 : 0)) % 2 ? "raised" : "ink"}
          action={
            <ButtonLink href="/music#soundcloud" variant="secondary">
              Full gallery
            </ButtonLink>
          }
        >
          {g.lead && (
            <div className="mb-14 grid items-center gap-8 md:grid-cols-[minmax(0,420px)_1fr]">
              <TrackCard track={g.lead} size="lg" />
              <div className="hidden md:block">
                <p className="kicker text-muted">{g.lead.kind === "playlist" ? "Playlist" : "Featured"}</p>
                <p className="display mt-3 text-6xl">{g.lead.displayTitle ?? g.lead.title}</p>
                {g.lead.description && <p className="mt-4 max-w-lg text-lg text-cream-dim">{g.lead.description}</p>}
              </div>
            </div>
          )}
          {g.id === "productions" ? (
            <Productions tracks={g.items} packs={getSamplePacks()} />
          ) : (
            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {g.items.slice(0, 8).map((t) => (
                <TrackCard key={t.id} track={t} />
              ))}
            </div>
          )}
          <JsonLd data={g.items.filter((t) => t.kind === "track").map((t) => trackLd(t, creditLine(t)))} />
        </Section>
      ))}

      {videos.length > 0 && (
        <Section id="video" kicker="Video" title="Watch">
          <div className="grid items-start gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => (
              <VideoPlayer key={v.id} asset={v} />
            ))}
          </div>
        </Section>
      )}

      {art.length > 0 && (
        <Section id="art" kicker="Visual art" title="Stills & art" tone="raised" action={<ButtonLink href="/art" variant="secondary">Gallery</ButtonLink>}>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {art.slice(0, 8).map((a) => (
              <MediaImage key={a.id} asset={a} sizes="(min-width:768px) 25vw, 50vw" className="aspect-square rounded-2xl ring-1 ring-line" />
            ))}
          </div>
        </Section>
      )}

      {empty && (
        <Section id="coming-soon" kicker="Work" title="Coming soon">
          <p className="max-w-xl text-lg text-cream-dim">Nothing published here yet. New work lands here first.</p>
        </Section>
      )}

      {merch.length > 0 && (
        <Section id="merch" kicker="Coming soon · not on sale yet" title="Merch" action={<ButtonLink href="/shop/merch" variant="secondary">All merch</ButtonLink>}>
          <MerchByBrand only={artist.slug} />
        </Section>
      )}

      {apparel.length > 0 && (
        <Section id="apparel" kicker="Brand art" title="Apparel designs">
          <div className="grid items-start gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4" data-apparel-art>
            {apparel.map((a) =>
              a.type === "video" ? (
                <VideoPlayer key={a.id} asset={a} sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" />
              ) : (
                <figure key={a.id}>
                  <MediaImage asset={a} sizes="(min-width:1024px) 25vw, 50vw" className="aspect-[3/4] rounded-2xl ring-1 ring-line" />
                  <figcaption className="mt-3 text-sm text-cream-dim">{a.title}</figcaption>
                </figure>
              ),
            )}
          </div>
        </Section>
      )}

      {children.length > 0 && (
        <Section id="presents" kicker={`Also by ${artist.name}`} title={`${artist.name} presents`} tone="raised">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {children.map((c) => (
              <ArtistCard key={c.slug} artist={c} />
            ))}
          </div>
        </Section>
      )}

      {products.length > 0 && (
        <Section id="shop" kicker="Shop" title={`Own a piece`}>
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Section>
      )}

      {rich && artist.events.length > 0 && (
        <Section id="events" kicker="Dates" title="Upcoming" tone="raised">
          <ul className="divide-y divide-line border-y border-line">
            {artist.events.map((e, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-4 py-6">
                <span className="display text-3xl text-[var(--accent)]">{e.date}</span>
                <span className="flex-1 text-lg">{e.title}</span>
                <span className="text-muted">{e.city}</span>
                {e.placeholder && <Badge>Placeholder</Badge>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {artist.bookable && (
        <Section id="book" kicker={artist.bookingNote} title={artist.slug === "baylingual-entertainment" ? "Start a project" : `Book ${artist.name}`}>
          <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
            <div className="space-y-4">
              {(artist.packages.length ? artist.packages : services.map((s) => ({ title: s.title, detail: s.summary }))).map((p) => (
                <div key={p.title} className="rounded-2xl bg-raised p-6 ring-1 ring-line">
                  <p className="text-xl font-semibold">{p.title}</p>
                  <p className="mt-1 text-cream-dim">{p.detail}</p>
                </div>
              ))}
              {products.length === 0 && (
                <p className="flex items-center gap-2 pt-2 text-cream-dim">
                  <Heart className="text-[var(--accent)]" /> Not booking? <Link href="/support" className="underline underline-offset-4">Leave a tip</Link>.
                </p>
              )}
            </div>
            <InquiryForm defaultType={artist.slug === "baylingual-entertainment" ? "service" : "booking"} who={artist.name} />
          </div>
        </Section>
      )}
      <JsonLd data={artistLd(artist)} />
    </div>
  );
  return page;
}

/** A single with owner-supplied cover art, credits from collaborators.json and the official Spotify player. */
function CoverRelease({ release }: { release: Release }) {
  const cover = getAsset(release.artworkAssetId);
  const role = { producer: "prod.", featuring: "feat.", collaborator: "with" } as const;
  return (
    <article className="flex flex-col gap-4" data-release={release.id}>
      {cover && <MediaImage asset={cover} sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="aspect-square overflow-hidden rounded-2xl ring-1 ring-line" />}
      <div>
        {release.series && <p className="kicker text-[var(--accent)]">{release.series}</p>}
        <h3 className="display mt-1 text-4xl">{release.title}</h3>
        {release.credits.length > 0 && (
          <p className="mt-1 text-sm text-cream-dim">{release.credits.map((c) => `${role[c.role]} ${getCollaborator(c.id)?.name ?? c.id}`).join(" · ")}</p>
        )}
      </div>
      {release.spotify && <SpotifyEmbed kind={release.spotify.kind} id={release.spotify.id} title={`${release.title} on Spotify`} />}
    </article>
  );
}

/** Not Däf's visual signature: the triangle crew, as a quiet drifting field behind the hero. */
function leadSplit(list: SoundCloudTrack[], kind: "playlist") {
  const lead = list.find((t) => t.kind === kind);
  return { lead, items: list.filter((t) => t !== lead && t.kind === "track") };
}

function TriangleField() {
  const crew = ["#FF7A59", "#F8E8D2", "#B6FF3B", "#8C7CFF", "#B6FF3B", "#FF7A59", "#8C7CFF"];
  const tris = Array.from({ length: 14 }, (_, i) => ({
    x: (i * 37) % 100,
    y: (i * 53) % 100,
    s: 18 + ((i * 29) % 46),
    r: (i * 47) % 360,
    c: crew[i % crew.length],
    d: 8 + (i % 5) * 2,
  }));
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {tris.map((t, i) => (
        <svg
          key={i}
          viewBox="0 0 10 10"
          className="absolute opacity-40 motion-safe:animate-[drift_var(--d)_ease-in-out_infinite_alternate]"
          style={{ left: `${t.x}%`, top: `${t.y}%`, width: t.s, height: t.s, transform: `rotate(${t.r}deg)`, ["--d" as string]: `${t.d}s` }}
        >
          <polygon points="5,0.5 9.5,9.5 0.5,9.5" fill={t.c} />
        </svg>
      ))}
    </div>
  );
}
