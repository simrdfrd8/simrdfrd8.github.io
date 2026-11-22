import Image from "next/image";
import Link from "next/link";
import type { Artist } from "@/lib/catalog/schema";
import { art720m } from "@/lib/brand-assets";
import { ShadeBar } from "./BrandButton";

/** 720M artist page intro: hero, bio, and collage. */
export function Artist720mIntro({ artist }: { artist: Artist }) {
  const img = art720m();
  const sc = artist.links.find((l) => l.platform === "soundcloud" && l.verified);
  const collage = img.collageWide ?? img.collageSquare;
  const sp = artist.links.find((l) => l.platform === "spotify" && l.verified);
  return (
    <div className="shade-hiphop" data-artist-page="720m">
      {/* Hero: full-bleed, full colour */}
      <header className={img.portrait ? "relative -mt-px flex h-[92svh] max-h-[1500px] min-h-[560px] items-end overflow-hidden bg-[#0f0c13] md:h-[118vh] md:min-h-[680px]" : "relative -mt-px flex h-[62svh] min-h-[420px] items-end overflow-hidden bg-[#0f0c13] md:h-[72vh]"} data-hero>
        {img.portrait ? (
          <Image src={img.portrait.webp} alt={img.portrait.alt} fill priority sizes="100vw" quality={82} className="object-cover object-[50%_28%] md:object-[50%_30%]" data-portrait />
        ) : (
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(80%_60%_at_70%_25%,rgba(255,122,89,0.35)_0%,transparent_60%),radial-gradient(60%_50%_at_15%_70%,rgba(140,124,255,0.22)_0%,transparent_60%),#17121C]" data-hero-fallback />
        )}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(23,18,28,0)_55%,rgba(23,18,28,.55)_80%,#17121C_100%)]" />
        <div className="relative z-[2] mx-auto w-full max-w-[1120px] px-5 pb-8 sm:px-8 md:pb-14">
          <div className="mb-[22px] h-1.5 w-40 bg-hiphop" />
          <span className="bg-hiphop px-2.5 py-1 text-[11px] font-extrabold tracking-[2px] text-ink uppercase">Hip-Hop</span>
          <h1 className="brand-h mt-4 mb-2.5 text-[clamp(84px,14vw,200px)] leading-[.9] tracking-[4px] [text-shadow:0_2px_30px_rgba(23,18,28,.45)]">{artist.name}</h1>
          {artist.aka && <p className="text-sm font-semibold tracking-[3px] text-[#E6DFEC] uppercase">{artist.aka}</p>}
        </div>
      </header>

      {/* Bio */}
      <section className="px-5 pt-7 pb-[60px] sm:px-8 md:pt-12 md:pb-[88px]" id="about">
        <div className="mx-auto max-w-[1120px]">
          <div>
            <p className="eyebrow">About</p>
            <h2 className="brand-h mt-2 mb-5 text-[28px] tracking-[3px] md:text-[34px]">{artist.tagline}</h2>
            {artist.bio.map((p, i) => (
              <p key={i} className="mb-[18px] text-xl text-cream md:text-[22px]" data-bio>
                {p}
              </p>
            ))}
            <div className="mt-[26px] flex flex-wrap gap-3">
              <Link href="#soundcloud" className="border-2 border-hiphop bg-hiphop px-[26px] py-3.5 text-[13px] font-extrabold tracking-[2px] text-ink uppercase hover:brightness-110">
                Listen
              </Link>
              {sp && (
                <a href={sp.url} target="_blank" rel="noopener" className="border-2 border-hiphop px-[26px] py-3.5 text-[13px] font-extrabold tracking-[2px] text-hiphop uppercase hover:bg-[var(--shade-tint)]">
                  Spotify
                </a>
              )}
              {sc && (
                <a href={sc.url} target="_blank" rel="noopener" className="border-2 border-hiphop px-[26px] py-3.5 text-[13px] font-extrabold tracking-[2px] text-hiphop uppercase hover:bg-[var(--shade-tint)]">
                  SoundCloud
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Collage band: full-bleed wide on desktop, square below 820px */}
      {collage && (
        <figure className="overflow-hidden bg-ink" aria-label="Collage of the crew's artwork" data-collage>
          <picture>
            {img.collageSquare && <source media="(max-width:820px)" type="image/webp" srcSet={img.collageSquare.webpSet} sizes="100vw" />}
            {img.collageSquare && <source media="(max-width:820px)" srcSet={img.collageSquare.srcSet} sizes="100vw" />}
            {img.collageWide && <source type="image/webp" srcSet={img.collageWide.webpSet} sizes="100vw" />}
            { }
            <img className="collage-img block h-auto w-full" src={collage.src} srcSet={collage.srcSet} sizes="100vw" width={collage.width} height={collage.height} loading="lazy" decoding="async" alt={collage.alt} />
          </picture>
          <figcaption className="mx-auto max-w-[1120px] px-5 pt-3 text-xs tracking-[2px] text-muted uppercase before:mr-2.5 before:inline-block before:h-0.5 before:w-[22px] before:bg-hiphop before:align-middle before:content-[''] sm:px-8">Art by Flavorful Croissants</figcaption>
        </figure>
      )}

      <div className="border-t border-line px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-[1120px] items-center gap-6">
          <ShadeBar className="!w-16" />
          <Link href="/#artists" className="text-[13px] font-semibold tracking-[2px] text-hiphop uppercase hover:underline">
            ← All artists
          </Link>
        </div>
      </div>
    </div>
  );
}
