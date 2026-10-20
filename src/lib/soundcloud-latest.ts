/**
 * "Latest on SoundCloud": the 5 newest public uploads on the Flavorful Croissants profile.
 *
 * Public data only (no API keys, no private endpoints):
 *  1. the public profile tracks page (server-rendered list, newest first, with upload times)
 *  2. the public RSS feed (feeds.soundcloud.com/users/soundcloud:users:<id>/sounds.rss, pubDate per track)
 *  3. oEmbed per track, to learn whether embedding is enabled (403 = disabled → link card)
 * Both lists are merged by URL and sorted by real upload date. Results revalidate every 6h (ISR);
 * if every fetch fails we fall back to the last cached list in content/soundcloud-latest.json,
 * which `npm run refresh:latest` rewrites.
 */
import cachedJson from "@content/soundcloud-latest.json";
import { catalog } from "@/lib/catalog";
import { creditFor, displayTitleFor } from "@/lib/catalog/credits";

export const SC_USER_ID = 495632685;
export const SC_PROFILE = "https://soundcloud.com/user-536995429";
export const SC_RSS = `https://feeds.soundcloud.com/users/soundcloud:users:${SC_USER_ID}/sounds.rss`;
export const LATEST_REVALIDATE = 21600; // 6h

export type LatestTrack = {
  url: string;
  title: string;
  displayTitle: string;
  date: string;
  scId?: number;
  artworkUrl?: string;
  durationSec?: number;
  embeddable: boolean;
  artists: string[];
  credit: "solo" | "720m-collab" | "collab";
  collaborators: string[];
};
export type LatestList = { fetchedAt: string; source: string; tracks: LatestTrack[] };

const UA = { "User-Agent": "Mozilla/5.0 (compatible; FlavorfulMusicSite/1.0; +https://flavorfulmusic.com)" };

async function get(url: string): Promise<Response> {
  return fetch(url, { headers: UA, next: { revalidate: LATEST_REVALIDATE }, signal: AbortSignal.timeout(8000) } as RequestInit);
}

const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
const hms = (s?: string) => (s ? s.split(":").reduce((a, b) => a * 60 + Number(b), 0) : undefined);

type Raw = { url: string; title?: string; date?: string; scId?: number; artworkUrl?: string; durationSec?: number };

export function parseRss(xml: string): Raw[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, it]) => {
    const pick = (re: RegExp) => it.match(re)?.[1];
    const pub = pick(/<pubDate>([^<]+)<\/pubDate>/);
    return {
      url: decode(pick(/<link>([^<]+)<\/link>/) ?? ""),
      title: decode(pick(/<title>([\s\S]*?)<\/title>/) ?? ""),
      date: pub ? new Date(pub).toISOString() : undefined,
      scId: Number(pick(/tracks\/(\d+)/)) || undefined,
      artworkUrl: pick(/<itunes:image href="([^"]+)"/)?.replace("t3000x3000", "t500x500"),
      durationSec: hms(pick(/<itunes:duration>([^<]+)<\/itunes:duration>/)),
    };
  }).filter((r) => r.url);
}

export function parseProfile(html: string): Raw[] {
  return [...html.matchAll(/<article class="audible"[\s\S]*?<\/article>/g)].map(([a]) => {
    const href = a.match(/itemprop="url" href="([^"]+)">([^<]*)</);
    return { url: href ? `https://soundcloud.com${href[1]}` : "", title: href ? decode(href[2]) : undefined, date: a.match(/<time[^>]*>([^<]+)<\/time>/)?.[1] };
  }).filter((r) => r.url && r.date);
}

/** Merge both public lists (profile wins on date, RSS fills artwork/ids), newest first. */
export function mergeLatest(lists: Raw[][], n = 5): Raw[] {
  const by = new Map<string, Raw>();
  for (const list of lists) for (const r of list) by.set(r.url, { ...r, ...by.get(r.url), ...Object.fromEntries(Object.entries(r).filter(([, v]) => v !== undefined)) } as Raw);
  return [...by.values()].filter((r) => r.date).sort((a, b) => Date.parse(b.date!) - Date.parse(a.date!)).slice(0, n);
}

/** Credit: a catalog/collection credit wins (owner rules), otherwise the title rules. */
export function creditForLatest(url: string, title: string) {
  const known = catalog.soundcloud.find((t) => t.url === url);
  if (known) return { artists: known.artists, credit: known.credit, collaborators: known.collaborators, displayTitle: known.displayTitle ?? displayTitleFor(title), artworkUrl: known.artworkUrl };
  const c = creditFor(title);
  return { artists: c.artists, credit: c.credit, collaborators: c.collaborators, displayTitle: displayTitleFor(title), artworkUrl: undefined };
}

async function embeddable(url: string): Promise<boolean> {
  const r = await get(`https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`);
  return r.ok; // 403 = embedding disabled by the uploader
}

export async function fetchLatest(n = 5): Promise<LatestList> {
  const [profile, rss] = await Promise.allSettled([get(`${SC_PROFILE}/tracks`).then((r) => (r.ok ? r.text() : Promise.reject(r.status))), get(SC_RSS).then((r) => (r.ok ? r.text() : Promise.reject(r.status)))]);
  const lists = [rss.status === "fulfilled" ? parseRss(rss.value) : [], profile.status === "fulfilled" ? parseProfile(profile.value) : []];
  if (!lists[0].length && !lists[1].length) throw new Error("SoundCloud public data unavailable");
  const top = mergeLatest(lists, n);
  const tracks = await Promise.all(
    top.map(async (r) => {
      const c = creditForLatest(r.url, r.title ?? "");
      const emb = await embeddable(r.url).catch(() => false);
      return { url: r.url, title: r.title ?? r.url, displayTitle: c.displayTitle, date: r.date!, scId: r.scId, artworkUrl: c.artworkUrl ?? r.artworkUrl, durationSec: r.durationSec, embeddable: emb, artists: c.artists, credit: c.credit, collaborators: c.collaborators };
    }),
  );
  const source = [profile.status === "fulfilled" && "profile page", rss.status === "fulfilled" && "RSS"].filter(Boolean).join(" + ");
  return { fetchedAt: new Date().toISOString(), source, tracks };
}

/** Live list, falling back to the last cached one. */
export async function getLatest(): Promise<LatestList & { stale: boolean }> {
  try {
    return { ...(await fetchLatest()), stale: false };
  } catch {
    return { ...(cachedJson as LatestList), stale: true };
  }
}
