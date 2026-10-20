import type { SoundCloudTrack } from "@/lib/catalog/schema";
import { formatPrice } from "@/lib/catalog/filters";
import { catalog, laneInfo, laneOffers, trackTitle, creditLine } from "@/lib/catalog";
import { SoundCloudEmbed } from "./SoundCloudEmbed";
import { CheckoutButton } from "./CheckoutButton";
import { OfferChooser } from "./OfferChooser";
import { LaneTabs } from "./LaneTabs";
import { SamplePackCard } from "./SamplePackCard";
import { BeatStore } from "./BeatStore";
import { getBeats } from "@/lib/catalog";
import type { SamplePack } from "@/lib/catalog/schema";
import { formatDuration, yearOf } from "@/lib/format";

/** A solo production card: player + the lane's one obvious CTA (DJ: own the WAV; rapper: lease). */
export function ProductionCard({ track, beat }: { track: SoundCloudTrack; beat?: boolean }) {
  const offers = laneOffers(track).map((o) => ({ ...o, priceLabel: formatPrice(o).label }));
  const lane = track.audience === "dj" || track.audience === "rapper" ? catalog.templates.lanes[track.audience] : undefined;
  const primary = offers.find((o) => o.id.endsWith(`--${lane?.primary}`)) ?? offers[0];
  const rest = offers.filter((o) => o !== primary);
  const meta = [track.genre, yearOf(track.date), formatDuration(track.durationSec)].filter(Boolean).join(" · ");
  const from = offers.filter((o) => o.price !== null).map((o) => o.price as number);
  return (
    <article className="flex flex-col gap-4" data-production={track.id} data-audience={track.audience}>
      <SoundCloudEmbed url={track.url} scId={track.scId} kind={track.kind} title={trackTitle(track)} artworkUrl={track.artworkUrl} subtitle={meta} verified={track.verified} />
      <div>
        <h3 className="text-lg leading-snug font-semibold">{trackTitle(track)}</h3>
        <p className="text-sm text-muted">
          {creditLine(track)} · {lane?.label}
          {track.audienceInferred && <span className="sr-only"> (lane inferred)</span>}
        </p>
      </div>
      {beat && offers.length > 0 && (
        <ul className="divide-y divide-line rounded-xl border border-line text-sm" data-lease-tiers>
          {offers.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span>{o.title}</span>
              <span className="font-semibold">{o.priceLabel}</span>
            </li>
          ))}
        </ul>
      )}
      {primary && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {track.audience === "rapper" ? (
            <OfferChooser title={trackTitle(track)} label={beat ? `Buy / License · from $${Math.min(...from)}` : `Lease · from $${Math.min(...from)}`} offers={offers} />
          ) : (
            <>
              <CheckoutButton product={primary} priceLabel={primary.priceLabel} label={`Own the WAV · ${primary.priceLabel}`} size="sm" />
              {rest.length > 0 && <OfferChooser title={trackTitle(track)} label="More options" offers={offers} />}
            </>
          )}
        </div>
      )}
    </article>
  );
}

export function Productions({ tracks, packs = [] }: { tracks: SoundCloudTrack[]; packs?: SamplePack[] }) {
  const lanes = (["dj", "rapper", "producer"] as const).map((l) => ({
    id: l,
    label: laneInfo(l).label,
    blurb: laneInfo(l).blurb,
    gridClass: l === "rapper" && getBeats("rapper").length ? "block" : undefined,
    count: l === "rapper" && getBeats("rapper").length ? getBeats("rapper").length : undefined,
    // Rappers: real beats only (content/beats.json). DJs: solo productions. Producers: sample packs.
    cards:
      l === "producer"
        ? packs.length
          ? packs.map((p) => <SamplePackCard key={p.id} pack={p} />)
          : [<p key="packs-soon" className="text-cream-dim" data-packs-soon>Sample packs coming soon.</p>]
        : l === "rapper" && getBeats("rapper").length
          ? [<BeatStore key="beat-store" />]
          : tracks.filter((t) => t.audience === l).map((t) => <ProductionCard key={t.id} track={t} />),
  }));
  return <LaneTabs lanes={lanes} />;
}
