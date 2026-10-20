"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/catalog/schema";
import { BeatPlayer } from "./BeatPlayer";
import { OfferChooser } from "./OfferChooser";

export type Offer = Product & { terms: string; priceLabel: string; agreementUrl?: string; licenseTierId?: string };
export type BeatTileData = {
  id: string;
  title: string;
  bpm?: number;
  key?: string;
  durationSec?: number;
  src?: string;
  peaksSrc?: string;
  heard?: { title: string; url: string; credit: string };
  audience: string;
  /** Only set when checkout is live (see CHECKOUT_LIVE in lib/env). */
  payhipUrl?: string;
};

const HUES = [18, 150, 42, 265, 200, 330, 95];
const hueFor = (id: string) =>
  HUES[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length];

/** Peaks load when the tile mounts (only visible tiles are mounted). */
function usePeaks(src?: string, initial?: number[]) {
  const [peaks, setPeaks] = useState<number[]>(initial ?? []);
  useEffect(() => {
    if (initial?.length || !src) return;
    let live = true;
    fetch(src)
      .then((r) => r.json())
      .then((j) => live && setPeaks(j.peaks ?? []))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [src, initial]);
  return peaks;
}

/** A real beat for sale: typographic cover, full-length player (320 kbps MP3), lease tiers, one Buy / License button. */
/** `compact` (catalog grid): short cover band, tiers live in the Buy / License sheet. */
export function BeatTile({
  beat,
  offers,
  wide = false,
  compact = false,
  peaks: initialPeaks,
  mediaBase = "",
}: {
  beat: BeatTileData;
  offers: Offer[];
  wide?: boolean;
  compact?: boolean;
  peaks?: number[];
  mediaBase?: string;
}) {
  const peaks = usePeaks(beat.peaksSrc, initialPeaks);
  const from = offers
    .filter((o) => o.price !== null)
    .map((o) => o.price as number);
  const meta = [beat.bpm && `${beat.bpm} BPM`, beat.key]
    .filter(Boolean)
    .join(" · ");
  const hue = hueFor(beat.id);
  return (
    <article
      className={
        wide
          ? "flex flex-col gap-4 sm:col-span-2 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6"
          : compact
            ? "flex flex-col gap-3"
            : "flex flex-col gap-4"
      }
      data-beat-card={beat.id}
      data-audience={beat.audience}
      data-wide={wide || undefined}
      data-bpm={beat.bpm}
      data-key={beat.key}
    >
      <div className="flex flex-col gap-4">
        <div
          className={`relative flex flex-col justify-between overflow-hidden rounded-2xl ring-1 ring-line ${compact ? "aspect-[5/2] p-4" : "aspect-[4/3] p-5"}`}
          style={{
            background: `radial-gradient(120% 90% at 10% 0%, hsl(${hue} 85% 58% / 0.55) 0%, transparent 60%), radial-gradient(90% 80% at 100% 100%, hsl(${(hue + 40) % 360} 80% 55% / 0.35) 0%, transparent 60%), #28232D`,
          }}
        >
          <span className="kicker text-cream-dim">
            {wide
              ? "Featured beat · Flavorful Croissants"
              : "Beat · Flavorful Croissants"}
          </span>
          <span
            className={`display leading-none break-words ${compact ? "text-3xl sm:text-4xl" : "text-5xl sm:text-6xl"}`}
          >
            {beat.title}
          </span>
        </div>
        {beat.src && (
          <BeatPlayer
            src={mediaBase + beat.src}
            title={beat.title}
            peaks={peaks}
            durationSec={beat.durationSec}
          />
        )}
      </div>
      <div className={compact ? "flex flex-col gap-3" : "flex flex-col gap-4"}>
        <div>
          <h3 className="text-lg leading-snug font-semibold">{beat.title}</h3>
          <p className="text-sm text-muted">
            Flavorful Croissants{meta && ` · ${meta}`}
          </p>
          {beat.heard && (
            <p className="mt-1 text-sm text-cream-dim" data-heard-on>
              Heard on:{" "}
              <a
                href={beat.heard.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-line-strong underline-offset-2 hover:text-cream"
              >
                {beat.heard.title}
              </a>{" "}
              ({beat.heard.credit})
            </p>
          )}
        </div>
        {offers.length > 0 && (
          <>
            {!compact && (
              <ul
                className="divide-y divide-line rounded-xl border border-line text-sm"
                data-lease-tiers
              >
                {offers.map((o) => (
                  <li
                    key={o.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5"
                  >
                    {o.agreementUrl ? (
                      <Link href={o.agreementUrl} className="underline-offset-4 hover:underline" data-agreement-link>
                        {o.title.replace(`${beat.title}: `, "")}
                      </Link>
                    ) : (
                      <span>{o.title.replace(`${beat.title}: `, "")}</span>
                    )}
                    <span className="shrink-0 font-semibold whitespace-nowrap">
                      {o.priceLabel}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <OfferChooser
                title={beat.title}
                label={`Buy / License · from $${Math.min(...from)}`}
                offers={offers}
              />
              <Link
                href="/licensing#compare"
                className="text-sm text-cream-dim underline-offset-4 hover:text-cream hover:underline"
              >
                Lease terms
              </Link>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
