import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalog, getArtist } from "@/lib/catalog";
import { ArtistPage } from "@/components/ArtistPage";
import { Artist720mIntro } from "@/components/brand/Artist720m";

export const dynamicParams = false;
export function generateStaticParams() {
  return catalog.artists.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = getArtist((await params).slug);
  if (!a) return {};
  return { title: a.name, description: `${a.name}, ${a.role}. ${a.tagline}`, alternates: { canonical: `/artists/${a.slug}` }, openGraph: { title: `${a.name} · Flavorful Music`, description: a.tagline } };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const artist = getArtist((await params).slug);
  if (!artist) notFound();
  return <ArtistPage artist={artist} intro={artist.slug === "720m" ? <Artist720mIntro artist={artist} /> : undefined} />;
}
