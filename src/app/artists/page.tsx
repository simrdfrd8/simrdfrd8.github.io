import type { Metadata } from "next";
import { listedArtists } from "@/lib/catalog";
import { ArtistCard } from "@/components/ArtistCard";
import { Section } from "@/components/ui";

export const metadata: Metadata = { title: "Artists", description: "The Flavorful Music roster: EDM, hip-hop and production. A small roster, made with friends.", alternates: { canonical: "/artists" } };

export default function ArtistsPage() {
  return (
    <>
      <section className="px-5 pt-12 sm:px-8 md:pt-20 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          <p className="kicker text-muted">Roster</p>
          <h1 className="display mt-3 text-[clamp(4rem,12vw,9rem)]">Artists</h1>
          <p className="mt-4 max-w-xl text-lg text-cream-dim">A small roster, made with friends. Five artists, three shades, one table.</p>
        </div>
      </section>
      <Section>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {listedArtists().map((a, i) => (
            <ArtistCard key={a.slug} artist={a} index={i} />
          ))}
        </div>
      </Section>
    </>
  );
}
