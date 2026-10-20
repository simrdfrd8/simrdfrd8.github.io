import Link from "next/link";
import type { Product, SoundCloudTrack, Release } from "@/lib/catalog/schema";
import { formatPrice, productsFor } from "@/lib/catalog/filters";
import { artistName, creditLine, getProducts, supportProduct, trackTitle } from "@/lib/catalog";
import { SoundCloudEmbed } from "./SoundCloudEmbed";
import { SpotifyEmbed } from "./SpotifyEmbed";
import { SoundCloudLinkCard } from "./SoundCloudLinkCard";
import { CheckoutButton } from "./CheckoutButton";
import { formatDuration, yearOf } from "@/lib/format";

/** Primary + secondary purchase actions for anything playable. One obvious primary action. */
export function TrackActions({ productIds, artist, compact }: { productIds: string[]; artist?: string; compact?: boolean }) {
  const all = getProducts();
  const linked = productsFor(productIds, all);
  const support = all.find((p) => p.type === "support" && p.artist === artist) ?? supportProduct();
  const BUYABLE: Product["type"][] = ["download", "stems", "sample-pack", "digital-art", "print"];
  const primary: Product | undefined = linked.find((p) => p.status === "available" && BUYABLE.includes(p.type)) ?? support;
  const secondary = linked.filter((p) => p !== primary).slice(0, 2);
  if (!primary) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <CheckoutButton
        product={primary}
        priceLabel={formatPrice(primary).label}
        size={compact ? "sm" : "md"}
        variant={primary.type === "support" ? "accent" : "primary"}
        label={primary.type === "support" ? "Support" : `${primary.type === "stems" ? "Get the stems" : "Own the WAV"} · ${formatPrice(primary).label}`}
      />
      {secondary.map((p) => (
        <CheckoutButton key={p.id} product={p} priceLabel={formatPrice(p).label} size="sm" variant="ghost" label={p.type === "stems" ? "Get the stems" : p.type === "license" ? "License" : undefined} />
      ))}
      {primary.type !== "support" && !secondary.length && (
        <Link href="/support" className="text-sm text-cream-dim underline-offset-4 hover:text-cream hover:underline">
          or tip
        </Link>
      )}
    </div>
  );
}

export function TrackCard({ track, size = "md" }: { track: SoundCloudTrack; size?: "md" | "lg" }) {
  const meta = [track.kind === "playlist" ? "Playlist" : track.genre, yearOf(track.date), formatDuration(track.durationSec)].filter(Boolean).join(" · ");
  return (
    <article className="flex flex-col gap-4" data-track={track.id} data-credit={track.credit}>
      {track.embeddable ? (
        <SoundCloudEmbed url={track.url} scId={track.scId} kind={track.kind} title={trackTitle(track)} artworkUrl={track.artworkUrl} subtitle={meta} verified={track.verified} size={size} />
      ) : (
        <SoundCloudLinkCard url={track.url} title={trackTitle(track)} subtitle={meta} artworkUrl={track.artworkUrl} size={size} />
      )}
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-lg leading-snug font-semibold">{trackTitle(track)}</h3>
          <p className="text-sm text-muted">{creditLine(track)}</p>
          {track.description && size === "lg" && <p className="mt-2 max-w-prose text-cream-dim">{track.description}</p>}
        </div>
        <TrackActions productIds={track.productIds} artist={track.artist} compact />
      </div>
    </article>
  );
}

export function ReleaseCard({ release }: { release: Release }) {
  return (
    <article className="flex flex-col gap-3" data-release={release.id}>
      {release.spotify ? (
        <SpotifyEmbed kind={release.spotify.kind} id={release.spotify.id} title={`${release.title} by ${artistName(release.artist)}`} />
      ) : (
        <p className="text-sm text-muted">Streaming link coming soon.</p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <p className="kicker text-muted">
          {[release.series, release.type, release.year].filter(Boolean).join(" · ")}
          {release.trackCount && release.trackCount > 1 ? ` · ${release.trackCount} tracks` : ""}
        </p>
        <TrackActions productIds={release.productIds} artist={release.artist} compact />
      </div>
    </article>
  );
}
