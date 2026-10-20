import Image from "next/image";
import Link from "next/link";
import { artistCardImages } from "@/lib/brand-assets";
import clsx from "clsx";
import type { Artist } from "@/lib/catalog/schema";
import { categoryOf, getAsset } from "@/lib/catalog";
import { MediaImage } from "../MediaImage";

/**
 * Homepage roster card (Brandy's .card). Photo cards are B&W with a 9% shade wash by default and go full colour on
 * hover / keyboard focus (instant under reduced motion). Cards without an approved photo get the striped shade gradient.
 */
export function HomeArtistCard({ artist, wide }: { artist: Artist; wide?: boolean }) {
  const cat = categoryOf(artist.category);
  const [card, cardAlt] = artistCardImages(artist.slug);
  const photo = card ? undefined : getAsset(artist.portraitAssetId);
  const page = `/artists/${artist.slug}`;
  const spotify = artist.links.find((l) => l.platform === "spotify" && l.verified);
  const soundcloud = artist.links.find((l) => l.platform === "soundcloud" && l.verified);
  const cta =
    artist.slug === "720m"
      ? { href: page, label: `Meet ${artist.name} →`, external: false }
      : spotify && artist.slug !== "flavorful-croissants"
        ? { href: spotify.url, label: "Listen on Spotify →", external: true }
        : artist.slug === "flavorful-croissants" && soundcloud
          ? { href: soundcloud.url, label: "Listen on SoundCloud →", external: true }
          : { href: page, label: "Watch / listen →", external: false };
  return (
    <article id={artist.slug} className={clsx("group flex scroll-mt-24 flex-col border-t-4 border-[var(--shade)] bg-raised", cat?.shade)} data-artist-card={artist.slug}>
      <Link href={page} aria-hidden="true" tabIndex={-1} className={clsx("relative block overflow-hidden", wide ? "aspect-[16/9] md:aspect-auto md:h-[170px]" : "aspect-[4/5]")}>
        {card ? (
          <>
            <Image src={card.webp} alt={card.alt} fill sizes="(min-width:768px) 33vw, (min-width:640px) 50vw, 100vw" className={clsx("object-cover grayscale transition-[filter,transform,opacity] duration-400 group-focus-within:grayscale-0 group-hover:scale-[1.03] group-hover:grayscale-0 motion-reduce:group-hover:scale-100", cardAlt && "group-focus-within:opacity-0 group-hover:opacity-0")} data-card-photo />
            {cardAlt && <Image src={cardAlt.webp} alt="" fill sizes="(min-width:768px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover opacity-0 transition-[opacity,transform] duration-400 group-focus-within:opacity-100 group-hover:scale-[1.03] group-hover:opacity-100 motion-reduce:group-hover:scale-100" data-card-photo-alt />}
            <span className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-transparent from-60% to-ink/50" />
            <span className="pointer-events-none absolute inset-0 z-[2] bg-[color-mix(in_srgb,var(--shade)_9%,transparent)] transition-opacity duration-400 group-focus-within:opacity-0 group-hover:opacity-0" />
            <span className="absolute inset-x-0 bottom-0 z-[3] h-0.5 bg-[var(--shade)]" />
          </>
        ) : photo && photo.type !== "video" ? (
          <>
            <MediaImage asset={photo} sizes="(min-width:768px) 33vw, 100vw" showMark className="absolute inset-0" imgClassName="grayscale transition-[filter,transform] duration-400 group-hover:scale-[1.03] group-hover:grayscale-0 group-focus-within:grayscale-0 motion-reduce:group-hover:scale-100" />
            <span className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-transparent from-60% to-ink/50" />
            <span className="pointer-events-none absolute inset-0 z-[2] bg-[color-mix(in_srgb,var(--shade)_9%,transparent)] transition-opacity duration-400 group-focus-within:opacity-0 group-hover:opacity-0" />
            <span className="absolute inset-x-0 bottom-0 z-[3] h-0.5 bg-[var(--shade)]" />
          </>
        ) : (
          <span className="brand-art-stripes absolute inset-0 bg-[linear-gradient(135deg,var(--shade-deep)_0%,#1b1620_85%)]">
            <span className="brand-h absolute bottom-3 left-4 text-5xl text-[var(--shade)] opacity-30" aria-hidden="true">
              {artist.shortName ?? artist.name}
            </span>
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-[22px] pb-6">
        {cat && <span className="mb-3.5 self-start bg-[var(--shade)] px-2.5 py-1 text-[11px] font-extrabold tracking-[2px] text-[var(--shade-on)] uppercase">{cat.label}</span>}
        <h3 className={clsx("font-extrabold tracking-[1px]", wide ? "text-[21px]" : "text-2xl")}>
          <Link href={page} className="hover:underline">
            {artist.name}
          </Link>
        </h3>
        <p className="mb-3 text-[13px] tracking-[1px] text-muted uppercase">{artist.cardRole ?? artist.role}</p>
        <p className="flex-1 text-[15px] text-cream-dim">{artist.cardBlurb ?? artist.bio[0]}</p>
        {cta.external ? (
          <a href={cta.href} target="_blank" rel="noopener" className="mt-4 self-start text-[13px] font-semibold tracking-[1px] text-[var(--shade-text)] hover:underline">
            {cta.label}
          </a>
        ) : (
          <Link href={cta.href} className="mt-4 self-start text-[13px] font-semibold tracking-[1px] text-[var(--shade-text)] hover:underline">
            {cta.label}
          </Link>
        )}
      </div>
    </article>
  );
}
