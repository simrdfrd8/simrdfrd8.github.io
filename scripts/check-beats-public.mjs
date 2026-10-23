#!/usr/bin/env node
/**
 * Post-build check for the public beat set (content/music-published.json, exported from the admin music catalog).
 * Only acts when BEATS_PUBLIC_SET=1 (off by default, so today's builds are untouched).
 * 1. Validates the snapshot: schema, every beat id exists, Payhip keys match beats.json, MP3/WAV prices equal the lease template
 *    (the site shows the template price; per-beat prices or sales need site support first), no song/album is buyable
 *    (music rights pending), nothing lossless, no admin fields.
 * 2. Fails the build if any file in out/ still names a private beat's Payhip product (payhip.com/b/<key>) or preview path
 *    (media/beat-<id>/). Private previews stay on R2 (already public); they just aren't rendered.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const TEXT = /\.(html|txt|json|js|xml|rsc)$/i;

export function checkMusicSnapshot(snap, beats, templates) {
  const out = [];
  if (snap.schema !== "fm-music-published/1") out.push("bad schema");
  const s = JSON.stringify(snap);
  for (const k of ["visibility", "rights_status", "updated_by", "payhip_mirrored", "fee_override", "position", "note"]) if (s.includes(`"${k}"`)) out.push(`admin field ${k}`);
  if (/\.(wav|aiff?|flac)\b/i.test(s)) out.push("names a lossless file");
  const byId = new Map(beats.map((b) => [b.id, b]));
  const price = Object.fromEntries((templates.lanes.rapper.offers ?? []).map((o) => [o.licenseTierId ?? o.id, o.price]));
  const seen = new Set();
  for (const b of snap.beats ?? []) {
    if (seen.has(b.id)) out.push(`duplicate beat ${b.id}`);
    seen.add(b.id);
    const src = byId.get(b.id);
    if (!src) { out.push(`unknown beat ${b.id}`); continue; }
    const key = src.payhipUrl?.match(/payhip\.com\/b\/([A-Za-z0-9]+)/)?.[1] ?? null;
    if (b.payhip !== key) out.push(`${b.id}: Payhip key ${b.payhip} != beats.json ${key}`);
    for (const t of ["mp3-lease", "wav-lease"]) {
      const tier = b.tiers?.[t];
      if (!tier || tier.price_cents !== Math.round(price[t] * 100)) out.push(`${b.id}: ${t} price ${tier?.price_cents} != template ${price[t]} (per-beat prices aren't shown by the site yet)`);
      if (tier?.sale) out.push(`${b.id}: ${t} sale (sales aren't shown by the site yet)`);
    }
  }
  for (const x of [...(snap.songs ?? []), ...(snap.albums ?? [])]) if (x.buy) out.push(`${x.id}: buyable before music rights are cleared`);
  return out;
}

export function privateBeatNeedles(snap, beats) {
  const pub = new Set(snap.beats.map((b) => b.id));
  return beats.filter((b) => !pub.has(b.id)).flatMap((b) => {
    const key = b.payhipUrl?.match(/payhip\.com\/b\/([A-Za-z0-9]+)/)?.[1];
    return [...(key ? [{ beat: b.id, needle: `payhip.com/b/${key}` }] : []), { beat: b.id, needle: `media/beat-${b.id}/` }];
  });
}

function* walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.env.BEATS_PUBLIC_SET !== "1") {
    console.log("[beats-public] BEATS_PUBLIC_SET is off: all beats ship (no change)");
    process.exit(0);
  }
  const snap = read("content/music-published.json"), beats = read("content/beats.json"), templates = read("content/product-templates.json");
  const problems = checkMusicSnapshot(snap, beats, templates);
  if (problems.length) { console.error("[beats-public] snapshot problems:\n  " + problems.join("\n  ")); process.exit(1); }
  const needles = privateBeatNeedles(snap, beats);
  const hits = [];
  const OUT = path.join(ROOT, "out");
  for (const f of walk(OUT)) {
    if (!TEXT.test(f)) continue;
    const t = fs.readFileSync(f, "utf8");
    for (const n of needles) if (t.includes(n.needle)) hits.push(`${path.relative(OUT, f)}: ${n.needle}`);
  }
  if (hits.length) { console.error(`[beats-public] private beats still in out/ (${hits.length}):\n  ` + hits.slice(0, 20).join("\n  ")); process.exit(1); }
  console.log(`[beats-public] ok: ${snap.beats.length} public beats, ${beats.length - snap.beats.length} private beats not in out/`);
}
