import Link from "next/link";
import type { Artist } from "@/lib/catalog/schema";
import { getAsset } from "@/lib/catalog";
import { MediaImage } from "./MediaImage";
import { Arrow } from "./ui";

export function ArtistCard({ artist, index, label }: { artist: Artist; index?: number; label?: string }) {
  const hero = getAsset(artist.portraitAssetId ?? artist.heroAssetId);
  return (
    <Link
      href={`/artists/${artist.slug}`}
      className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl bg-surface p-5 ring-1 ring-line transition hover:ring-[var(--accent)] sm:aspect-[3/4]"
      style={{ ["--accent" as string]: artist.accent, ["--accent-ink" as string]: artist.accentInk }}
    >
      {hero && <MediaImage asset={hero} sizes="(min-width: 1024px) 25vw, 50vw" className="absolute inset-0" imgClassName="transition-transform duration-700 group-hover:scale-105" showMark={false} />}
      <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
      <span className="absolute top-0 left-0 h-1.5 w-full origin-left scale-x-[0.25] bg-[var(--accent)] transition-transform duration-500 group-hover:scale-x-100" />
      {typeof index === "number" && <span className="kicker absolute top-5 left-5 text-cream-dim">{String(index + 1).padStart(2, "0")}</span>}
      <span className="relative">
        <span className="kicker hidden !text-[0.65rem] text-[var(--accent)] sm:block">{artist.role}</span>
        <span className={`display mt-2 flex items-end justify-between gap-2 break-words ${artist.name.length > 14 ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl"}`}>
          {label ?? artist.name}
          <Arrow className="mb-1 h-6 w-6 shrink-0 -translate-x-2 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
        </span>
      </span>
    </Link>
  );
}
