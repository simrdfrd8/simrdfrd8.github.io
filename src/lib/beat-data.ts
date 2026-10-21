import type { Product } from "@/lib/catalog/schema";

/** Serializable beat row data shared by the beat store list (formerly in BeatTile). */
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
  /** Public Payhip product URL (MP3/WAV leases), only when checkout is live. */
  payhipUrl?: string;
};

/** Offers are identical per beat apart from id/title; the template uses "__beat__" / "__title__". */
export const offersFor = (tpl: Offer[], b: { id: string; title: string }) =>
  tpl.map((o) => ({ ...o, id: o.id.replace("__beat__", b.id), title: o.title.replace("__title__", b.title) }));
