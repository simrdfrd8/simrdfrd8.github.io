import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalog, getArtist } from "@/lib/catalog";
import { publicArtistVisible } from "@/lib/public-visibility";
import { ArtistPage } from "@/components/ArtistPage";
import { Artist720mIntro } from "@/components/brand/Artist720m";
import { ArtistDanPeralesIntro } from "@/components/brand/ArtistDanPerales";

export const dynamicParams = false;
export function generateStaticParams() {
  return catalog.artists.filter((a) => publicArtistVisible(a.slug)).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = getArtist((await params).slug);
  if (!a) return {};
  return { title: a.name, description: `${a.name}, ${a.role}. ${a.tagline}`, alternates: { canonical: `/artists/${a.slug}` }, openGraph: { title: `${a.name} · Flavorful Music`, description: a.tagline } };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const artist = getArtist((await params).slug);
  if (!artist || !publicArtistVisible(artist.slug)) notFound();
  const intro = artist.slug === "720m" ? <Artist720mIntro artist={artist} /> : artist.slug === "dan-perales" ? <ArtistDanPeralesIntro artist={artist} /> : undefined;
  return <ArtistPage artist={artist} intro={intro} />;
}
