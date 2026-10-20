import { readFileSync } from "node:fs";
import path from "node:path";
import type { Beat } from "@/lib/catalog/schema";
import { catalog, creditLine, laneOffers, trackTitle } from "@/lib/catalog";
import { LEGACY_720M, displayTitleFor } from "@/lib/catalog/credits";
import { formatPrice } from "@/lib/catalog/filters";
import { CHECKOUT_LIVE, mediaBase, mediaUrl } from "@/lib/env";
import { BeatTile, type BeatTileData, type Offer } from "./BeatTile";
import { offersFor } from "@/lib/offers";

/**
 * Build-time peaks for the featured tile. With NEXT_PUBLIC_MEDIA_BASE set (the public build), peaks live on R2 and the
 * tile fetches them in the browser instead; in local dev they are read from public/media when present.
 */
export function loadPeaks(src?: string): number[] {
  if (!src || mediaBase()) return [];
  try {
    return JSON.parse(readFileSync(path.join(process.cwd(), "public", src), "utf8")).peaks ?? [];
  } catch {
    return [];
  }
}

/** Serializable beat data for the client tiles. Audio and peaks both go through the media base URL (R2). */
export function beatTileData(beat: Beat): BeatTileData {
  const heard = beat.heardOn ? catalog.soundcloud.find((t) => t.id === beat.heardOn) : undefined;
  return {
    id: beat.id,
    title: beat.title,
    bpm: beat.bpm,
    key: beat.key,
    durationSec: beat.audio?.durationSec,
    src: beat.audio ? mediaUrl(beat.audio.src) : undefined,
    peaksSrc: beat.audio ? mediaUrl(beat.audio.peaksSrc) : undefined,
    heard: heard
      ? { title: trackTitle(heard), url: heard.url, credit: creditLine(heard) }
      : beat.heardOnUrl && beat.heardOnTitle
        ? { title: displayTitleFor(beat.heardOnTitle), url: beat.heardOnUrl, credit: LEGACY_720M.test(beat.heardOnTitle) ? "720M × Flavorful Croissants" : "Flavorful Croissants" }
        : undefined,
    audience: beat.audience,
    ...(CHECKOUT_LIVE && beat.payhipUrl ? { payhipUrl: beat.payhipUrl } : {}),
  };
}

/** The rapper-lane lease tiers once, with placeholder id/title (filled per beat by offersFor). */
export function offerTemplate(): Offer[] {
  return laneOffers({ id: "__beat__", title: "__title__", displayTitle: "__title__", audience: "rapper", artist: "flavorful-croissants", artworkUrl: undefined }).map((o) => ({
    ...o,
    priceLabel: formatPrice(o).label,
  }));
}

export function beatOffers(beat: Beat): Offer[] {
  const offers = laneOffers({ id: beat.id, title: beat.title, displayTitle: beat.title, audience: beat.audience, artist: beat.artist, artworkUrl: undefined }).map((o) => ({ ...o, priceLabel: formatPrice(o).label }));
  return offersFor(offers, beatTileData(beat));
}

/** Server-rendered beat card (used for the featured beat). */
export function BeatCard({ beat, wide = false }: { beat: Beat; index?: number; wide?: boolean }) {
  return <BeatTile beat={beatTileData(beat)} offers={beatOffers(beat)} wide={wide} peaks={loadPeaks(beat.audio?.peaksSrc)} />;
}
