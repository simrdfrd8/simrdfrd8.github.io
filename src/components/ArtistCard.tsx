import Link from "next/link";
import type { Artist } from "@/lib/catalog/schema";
import { getAsset } from "@/lib/catalog";
import { MediaImage } from "./MediaImage";
import { artistRosterImage, hasMarks, monogram } from "@/lib/brand-assets";
import { Arrow } from "./ui";

export function ArtistCard({ artist, index, label }: { artist: Artist; index?: number; label?: string }) {
  const roster = artistRosterImage(artist.slug);
  const hero = roster ? undefined : getAsset(artist.portraitAssetId ?? artist.heroAssetId);
  return (
    <Link
      href={`/artists/${artist.slug}`}
      className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl bg-surface p-5 ring-1 ring-line transition hover:ring-[var(--accent)] sm:aspect-[3/4]"
      style={{ ["--accent" as string]: artist.accent, ["--accent-ink" as string]: artist.accentInk }}
    >
      {roster ? (
        <picture>
          <source type="image/webp" srcSet={roster.webpSet} sizes="(min-width: 1024px) 25vw, 50vw" />
          <img
            src={roster.src}
            srcSet={roster.srcSet}
            sizes="(min-width: 1024px) 25vw, 50vw"
            alt={artist.name}
            width={roster.width}
            height={roster.height}
            loading={typeof index === "number" && index < 4 ? "eager" : "lazy"}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-[50%_25%] transition-transform duration-700 group-hover:scale-105"
            data-roster-photo
          />
        </picture>
      ) : !hero ? (
        <span className="absolute inset-0 flex items-center justify-center bg-[#17121C] pb-[42%] sm:pb-[28%]" data-roster-monogram aria-hidden="true">
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,color-mix(in_srgb,var(--accent)_16%,transparent),transparent_62%)]" />
          <span className="relative flex aspect-square w-[46%] sm:w-[58%] items-center justify-center rounded-full border-2 border-[var(--accent)]">
            <span className="display text-[clamp(2.25rem,9vw,6.5rem)] leading-none text-[var(--accent)]">{monogram(artist.shortName ?? artist.name)}</span>
          </span>
        </span>
      ) : null}
      {hero && <MediaImage asset={hero} sizes="(min-width: 1024px) 25vw, 50vw" className="absolute inset-0" imgClassName="transition-transform duration-700 group-hover:scale-105" showMark={false} />}
      <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
      <span className="absolute top-0 left-0 h-1.5 w-full origin-left scale-x-[0.25] bg-[var(--accent)] transition-transform duration-500 group-hover:scale-x-100" />
      {typeof index === "number" && <span className="kicker absolute top-5 left-5 text-cream-dim">{String(index + 1).padStart(2, "0")}</span>}
      <span className="relative">
        <span className="kicker hidden !text-[0.65rem] text-[var(--accent)] sm:block">{artist.role}</span>
        <span className={`display mt-2 flex items-end justify-between gap-2 break-words ${artist.name.length > 14 ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl"} ${hasMarks(label ?? artist.name) ? "!leading-[1.08] pt-[0.12em]" : ""}`}>
          {label ?? artist.name}
          <Arrow className="mb-1 h-6 w-6 shrink-0 -translate-x-2 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
        </span>
      </span>
    </Link>
  );
}
