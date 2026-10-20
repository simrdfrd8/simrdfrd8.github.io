/** Shared attribution helpers (used by scripts/import-streaming.ts and the live "Latest on SoundCloud" feed). */
/**
 * ATTRIBUTION RULE (from Flavorful, 2026-10-19): on the Flavorful Croissants SoundCloud, any
 * "Ricky" credit (ricky, RICKAYYY, RICKAAAY, ...) is legacy labelling for 720M (720Mission).
 * Such tracks are credited to ['flavorful-croissants', '720m'], never to the separate Ricky identity.
 */
export const LEGACY_720M = /\b(ricky|rick+a+y+|rickay+)\b/i;
export const LEGACY_720M_G = /\b(ricky|rick+a+y+|rickay+)\b/gi;

export function featuringFromTitle(title: string): string[] {
  return LEGACY_720M.test(title) ? ["720m"] : [];
}

export type Credit = { artists: string[]; credit: "solo" | "720m-collab" | "collab"; collaborators: string[]; role: "producer" | "collab" };

/**
 * Attribution rules for Flavorful Croissants SoundCloud uploads:
 *  1. Any Ricky variant in the credits  → 720M × Flavorful Croissants  (credit "720m-collab")
 *  2. No feature / "x" / "ft." credit    → solo Flavorful Croissants production (credit "solo", role producer)
 *  3. Other named features               → Flavorful Croissants + external collaborator credit (credit "collab")
 *  Rules 1 and 3 can combine (720M + externals → "720m-collab" with collaborators listed).
 */
export function creditFor(title: string): Credit {
  const m = title.match(/\s+(?:x|ft\.?|feat\.?|with)\s+(.+)$/i);
  const names = m ? m[1].split(/\s*(?:&|,|\band\b|\bx\b)\s*/i).map((n) => n.trim()).filter(Boolean) : [];
  const has720 = LEGACY_720M.test(title);
  const externals = names.filter((n) => !LEGACY_720M.test(n));
  if (has720) return { artists: ["flavorful-croissants", "720m"], credit: "720m-collab", collaborators: externals, role: "collab" };
  if (externals.length) return { artists: ["flavorful-croissants"], credit: "collab", collaborators: externals, role: "collab" };
  return { artists: ["flavorful-croissants"], credit: "solo", collaborators: [], role: "producer" };
}

/** Solo productions are for DJs or rappers. Guess from genre/tags/title; always flagged audienceInferred. */
export function inferAudience(genre?: string, tags: string[] = [], title = ""): "dj" | "rapper" {
  const DJ = /techno|house|edm|dance|ambient|electronic|trance|dnb|drum ?& ?bass|dubstep|club/;
  const RAP = /hip.?hop|rap|trap|boom ?bap|instrumental|beat|lo.?fi/;
  // genre is the strongest signal, then tags, then title
  for (const hay of [genre ?? "", tags.join(" "), title].map((s) => s.toLowerCase())) {
    if (RAP.test(hay)) return "rapper";
    if (DJ.test(hay)) return "dj";
  }
  return "rapper"; // default lane for unclassified beats; flagged as inferred
}

export function artistsFor(title: string): string[] {
  return LEGACY_720M.test(title) ? ["flavorful-croissants", "720m"] : ["flavorful-croissants"];
}

/**
 * Clean display title: every feature suffix is dropped because credits live in `artists` / `collaborators`.
 * "we r the total air pt 2 x ricky" → "we r the total air pt 2"; "Love and Tears ft. tondo & azazaka & RICKAYYY" → "Love and Tears".
 */
export function displayTitleFor(title: string): string {
  let t = title
    .replace(/\s+(x|ft\.?|feat\.?|with)\s+.+$/i, "")
    .replace(/[^\p{L}\p{N}\s.&,'()-]/gu, "")
    .trim();
  if (!t || LEGACY_720M.test(t)) t = t.replace(LEGACY_720M_G, "720M").trim() || "720M";
  return t;
}

export const rewriteLegacyCredit = (text?: string) => text?.replace(/RICKAYYY\/Ricky|Ricky\/RICKAYYY/g, "720M").replace(LEGACY_720M_G, "720M");

export function normTitle(t: string) {
  return t.toLowerCase().replace(/\s+(x|ft\.?|feat\.?|with)\s+.*$/i, "").replace(/[^a-z0-9]/g, "");
}

