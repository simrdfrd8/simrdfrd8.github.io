import Image from "next/image";
import Link from "next/link";
import { brandLogo } from "@/lib/brand-assets";
import { artistThumbImage, monogram } from "@/lib/brand-assets";
import { listedArtists, CATEGORIES } from "@/lib/catalog";
import { CategoryFold } from "@/components/CategoryFold";
import { publicMusicVisible } from "@/lib/public-visibility";
import { HomeSurfMapSection } from "@/components/HomeSurfMapGate";
import { HomeFilmSection } from "@/components/HomeFilmGate";

/**
 * Landing page, kept extremely simple: mark + one line, three plain categories that fold open to their artists,
 * one path to merch (and beats when public music is visible); the zoomable San Diego surf map only when publicSurfMapVisible is on; the brand film only when publicFilmVisible is on.
 */
const ROLE: Record<string, string> = { "hip-hop": "Rapper", edm: "DJ", production: "Producer" };

export default function Home() {
  const heroMark = brandLogo("cream");
  const artists = listedArtists();

  return (
    <>
      <header className="px-5 pt-16 pb-14 text-center sm:px-8 md:pt-24 md:pb-20">
        <div className="mx-auto flex max-w-[720px] flex-col items-center" data-hero-mark>
          {heroMark && <Image src={heroMark} alt="Flavorful Music label mark: a winking croissant on a lightning triangle" width={489} height={473} unoptimized priority className="h-auto w-[140px] md:w-[180px]" />}
          <h1 className="brand-h mt-8 text-[clamp(2.6rem,9vw,64px)] tracking-[2px]">Make art with friends.</h1>
          <p className="mt-5 text-lg text-cream-dim md:text-xl">
            A San Diego artist collective disguised as a record label: <span className="hl-hh">hip-hop</span>, <span className="hl-edm">EDM</span> and <span className="hl-prod">production</span>.
          </p>
        </div>
      </header>

      <section id="artists" aria-label="Artists" className="px-5 pb-16 sm:px-8">
        {/* Without JS every list stays rolled out. */}
        <noscript>
          <style>{".cat-panel{visibility:visible!important;grid-template-rows:1fr!important;opacity:1!important}"}</style>
        </noscript>
        <div className="mx-auto max-w-[1120px] border-t border-line">
          {CATEGORIES.map((c) => {
            const list = artists.filter((a) => a.category === c.id);
            return (
              <div key={c.id} className={`${c.shade} border-b border-line`} data-shade={c.id}>
                <CategoryFold
                  id={c.id}
                  label={c.label}
                  slugs={list.map((a) => a.slug)}
                  header={
                    <>
                      {brandLogo(c.id) && <Image src={brandLogo(c.id)!} alt="" width={489} height={473} unoptimized className="h-auto w-9 shrink-0" />}
                      <span className="brand-h flex-1 text-[22px] tracking-[2px] text-[var(--shade-text)]" data-cat-label>{c.label}</span>
                      <span className="text-xs tracking-[1px] text-muted tabular-nums" data-cat-count>{list.length}</span>
                    </>
                  }
                >
                  <ul className="grid gap-1 pt-1 pb-6 md:grid-cols-3 md:gap-x-6">
                    {list.map((a) => {
                      const card = artistThumbImage(a.slug);
                      return (
                        <li key={a.slug} id={a.slug} className="scroll-mt-24" data-artist-card={a.slug}>
                          <Link href={`/artists/${a.slug}`} className="group flex items-center gap-4 rounded-md px-2 py-2.5 transition-colors hover:bg-[var(--shade-tint)] focus-visible:bg-[var(--shade-tint)]">
                            <span className="relative block size-12 shrink-0 overflow-hidden rounded-full border border-line bg-raised">
                              {card ? <Image src={card.webp} alt={card.alt} fill sizes="48px" className="object-cover grayscale transition-[filter] group-hover:grayscale-0" data-card-photo /> : <span className="absolute inset-0 flex items-center justify-center bg-[#17121C] text-[15px] font-extrabold tracking-[1px] text-[var(--shade)]" aria-hidden="true" data-card-monogram>{monogram(a.shortName ?? a.name)}</span>}
                            </span>
                            <span className="min-w-0 flex-1">
                              <b className="block text-lg leading-tight">{a.name}</b>
                              <span className="text-xs tracking-[1px] text-muted uppercase">{a.cardRole ?? ROLE[c.id]}</span>
                            </span>
                            <span aria-hidden="true" className="text-[var(--shade-text)] transition-transform group-hover:translate-x-1">→</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </CategoryFold>
              </div>
            );
          })}
        </div>
      </section>

      <section id="shop" aria-label="Shop" className="px-5 pb-16 sm:px-8">
        {/* Merch on the left; when music is public, Beats stacks over Producers. When hidden, Merch and Producers sit side by side with no filler. */}
        <div className="mx-auto grid max-w-[1120px] gap-4 md:grid-cols-2">
          <Link href="/shop/merch" className={`group flex items-center justify-between gap-6 border border-line bg-raised p-6 transition-colors hover:border-logo md:p-8${publicMusicVisible() ? " md:row-span-2" : ""}`} data-home-merch>
            <span>
              <b className="brand-h block text-2xl tracking-[2px]">Merch</b>
              <span className="text-cream-dim">Designed in-house. Coming soon.</span>
            </span>
            <span aria-hidden="true" className="text-2xl text-logo transition-transform group-hover:translate-x-1">→</span>
          </Link>
          {publicMusicVisible() && (
          <Link href="/music#buy-beats" className="shade-prod group flex items-center justify-between gap-6 border border-line bg-raised p-6 transition-colors hover:border-[var(--shade)] md:p-8" data-home-beats>
            <span>
              <b className="brand-h block text-2xl tracking-[2px]">Beats</b>
              <span className="text-cream-dim">Press play, then license. MP3 $10 · WAV $25.</span>
            </span>
            <span aria-hidden="true" className="text-2xl text-[var(--shade-text)] transition-transform group-hover:translate-x-1">→</span>
          </Link>
          )}
          <Link href="/shop/sample-packs" className="shade-prod group flex items-center justify-between gap-6 border border-line bg-raised p-6 transition-colors hover:border-[var(--shade)] md:p-8" data-home-producers>
            <span>
              <b className="brand-h block text-2xl tracking-[2px]">Producers</b>
              <span className="text-cream-dim">Sample packs &amp; Foley sounds. For beatmakers, post-production, and video game sound designers. Coming soon.</span>
            </span>
            <span aria-hidden="true" className="text-2xl text-[var(--shade-text)] transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </section>

      <HomeSurfMapSection />

      <HomeFilmSection />
    </>
  );
}
