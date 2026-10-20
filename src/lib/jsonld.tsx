import type { Artist, Product, Release, SoundCloudTrack } from "./catalog/schema";
import { siteUrl } from "./env";

export function JsonLd({ data }: { data: object | object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export const orgLd = (name: string, description: string, sameAs: string[]) => ({
  "@context": "https://schema.org",
  "@type": ["Organization", "MusicGroup"],
  name,
  url: siteUrl(),
  description,
  sameAs,
});

export const artistLd = (a: Artist) => ({
  "@context": "https://schema.org",
  "@type": a.slug === "dan-perales" || a.slug === "baylingual-entertainment" ? "Organization" : "MusicGroup",
  name: a.name,
  url: `${siteUrl()}/artists/${a.slug}`,
  description: a.bio[0],
  genre: a.genres,
  sameAs: a.links.filter((l) => l.verified).map((l) => l.url),
});

export const releaseLd = (r: Release, artist: string) => ({
  "@context": "https://schema.org",
  "@type": r.type === "single" ? "MusicRecording" : "MusicAlbum",
  name: r.title,
  byArtist: { "@type": "MusicGroup", name: artist },
  datePublished: r.year ? String(r.year) : undefined,
  url: r.externalUrls[0]?.url,
});

export const trackLd = (t: SoundCloudTrack, artist: string) => ({
  "@context": "https://schema.org",
  "@type": "MusicRecording",
  name: t.displayTitle ?? t.title,
  byArtist: { "@type": "MusicGroup", name: artist },
  url: t.url,
  duration: t.durationSec ? `PT${Math.floor(t.durationSec / 60)}M${t.durationSec % 60}S` : undefined,
  genre: t.genre,
});

/** Offers are only emitted for approved prices so search engines never see illustrative ones. */
export const productLd = (p: Product, image?: string) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: p.title,
  description: p.summary,
  image: image ? `${siteUrl()}${image}` : undefined,
  ...(p.priceApproved && p.price !== null
    ? { offers: { "@type": "Offer", price: p.price, priceCurrency: p.currency, availability: p.status === "available" ? "https://schema.org/InStock" : "https://schema.org/PreOrder", url: `${siteUrl()}/shop#${p.id}` } }
    : {}),
});
