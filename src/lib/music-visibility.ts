/**
 * Public music (data-driven): which beats the beat store shows, in which order, and which songs / releases the Songs page lists.
 * Source of truth: the PUBLISHED music snapshot (content/music-published.json), exported from the admin music catalog on the
 * accounts Worker (/_admin/music/) and committed here for a rebuild Ricky approves. Anything not listed is private.
 *
 * The beat filter is a BUILD-TIME switch, off by default: only `BEATS_PUBLIC_SET=1` applies it (today's live build shows all beats).
 * With it on, private beats aren't rendered anywhere and scripts/check-beats-public.mjs fails the build if out/ still names
 * a private beat's Payhip product or preview path. Their preview MP3s stay on R2: they were already public.
 * Song and album purchase stays off until music rights are cleared (`buy` is false for every song and album today).
 */
import snapJson from "@content/music-published.json";

export type PublishedTier = { price_cents: number | null; sale: { price_cents: number; starts_at: number | null; ends_at: number | null } | null };
export type PublishedBeat = { id: string; payhip: string | null; tiers: Record<"mp3-lease" | "wav-lease", PublishedTier> };
export type PublishedMusic = { schema: string; release: number | null; exportedAt: string | null; beats: PublishedBeat[]; songs: { id: string; buy: boolean }[]; albums: { id: string; buy: boolean }[] };

export const MUSIC_SCHEMA = "fm-music-published/1";
export const publishedMusic = snapJson as unknown as PublishedMusic;
export const beatsFilterOn = (env: Record<string, string | undefined> = process.env) => env.BEATS_PUBLIC_SET === "1";

/** With the filter on: only the published beats, in the published order. Off: unchanged. */
export function applyBeatFilter<T extends { id: string }>(beats: T[], on = beatsFilterOn(), src: PublishedMusic = publishedMusic): T[] {
  if (!on) return beats;
  const pos = new Map(src.beats.map((b, i) => [b.id, i]));
  return beats.filter((b) => pos.has(b.id)).sort((a, b) => pos.get(a.id)! - pos.get(b.id)!);
}

export const publishedSongIds = (src: PublishedMusic = publishedMusic) => new Set(src.songs.map((s) => s.id));
export const publishedReleaseIds = (src: PublishedMusic = publishedMusic) => new Set(src.albums.map((a) => a.id));
/** Songs can't be bought until music rights are cleared; the snapshot says so per item (false for all today). */
export const songBuyable = (id: string, src: PublishedMusic = publishedMusic) => src.songs.some((s) => s.id === id && s.buy) || src.albums.some((a) => a.id === id && a.buy);

/** Songs page artist order (Ricky, Oct 23, 2026): Flavorful Croissants, 720M, Dan Perales first, then everyone else in roster order. */
export const SONGS_ARTISTS_FIRST = ["flavorful-croissants", "720m", "dan-perales"] as const;
export function songsArtistOrder<T extends { slug: string }>(artists: T[]): T[] {
  const rank = (slug: string) => {
    const i = (SONGS_ARTISTS_FIRST as readonly string[]).indexOf(slug);
    return i === -1 ? SONGS_ARTISTS_FIRST.length : i;
  };
  return artists.map((a, i) => ({ a, i })).sort((x, y) => rank(x.a.slug) - rank(y.a.slug) || x.i - y.i).map((x) => x.a);
}
