#!/usr/bin/env node
/**
 * Copies the San Diego surf map deep-zoom tiles (Mandy's v5.1 package) into public/surf-map/v5.1/ for the home page viewer.
 *
 *   node scripts/surf-map-tiles.mjs capped   # default: levels 0-13, 3600x5400 (half the print resolution)
 *   node scripts/surf-map-tiles.mjs full     # levels 0-14, 7200x10800 (true 300 dpi print resolution)
 *
 * Source (read-only, never modified): SURF_MAP_SRC or /workspace/merch/sd-surf-map/v5.1/deepzoom.
 * Only *.jpg tiles are copied, plus a rewritten map.dzi and a small poster.webp stitched from level-10 tiles.
 * The master PNG/TIFF / 300 dpi print file is never read or copied (it isn't in the package either; we refuse anything else).
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SRC = process.env.SURF_MAP_SRC ?? "/workspace/merch/sd-surf-map/v5.1/deepzoom";
const OUT = path.join(ROOT, "public/surf-map/v5.1");
const variant = process.argv[2] ?? "capped";
if (!["capped", "full"].includes(variant)) throw new Error(`variant must be "capped" or "full", got ${variant}`);

const dzi = fs.readFileSync(path.join(SRC, "map.dzi"), "utf8");
const num = (k) => Number(new RegExp(`${k}="(\\d+)"`).exec(dzi)?.[1]);
const [W, H, TILE, OVERLAP] = [num("Width"), num("Height"), num("TileSize"), num("Overlap")];
const srcMax = Math.ceil(Math.log2(Math.max(W, H)));
const drop = variant === "full" ? 0 : 1;
const maxLevel = srcMax - drop;
const w = Math.ceil(W / 2 ** drop);
const h = Math.ceil(H / 2 ** drop);
if (Math.ceil(Math.log2(Math.max(w, h))) !== maxLevel) throw new Error("level math mismatch");

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "map_files"), { recursive: true });
let files = 0;
let bytes = 0;
for (let l = 0; l <= maxLevel; l++) {
  const from = path.join(SRC, "map_files", String(l));
  const to = path.join(OUT, "map_files", String(l));
  fs.mkdirSync(to);
  for (const f of fs.readdirSync(from)) {
    if (!/^\d+_\d+\.jpg$/.test(f)) throw new Error(`unexpected file in tiles: ${l}/${f}`);
    fs.copyFileSync(path.join(from, f), path.join(to, f));
    files++;
    bytes += fs.statSync(path.join(to, f)).size;
  }
}
fs.writeFileSync(
  path.join(OUT, "map.dzi"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<Image xmlns="http://schemas.microsoft.com/deepzoom/2008" Format="jpg" Overlap="${OVERLAP}" TileSize="${TILE}">\n  <Size Width="${w}" Height="${h}"/>\n</Image>\n`,
);

// Poster (no-JS fallback + placeholder): level 10 is 450x675 in both variants, split over 0_0 and 0_1 (1 px overlap).
const L = 10;
const pw = Math.ceil(W / 2 ** (srcMax - L));
const ph = Math.ceil(H / 2 ** (srcMax - L));
const rows = Math.ceil(ph / TILE);
const parts = [];
for (let r = 0; r < rows; r++) {
  const top = r === 0 ? 0 : OVERLAP;
  const height = Math.min(TILE, ph - r * TILE);
  const buf = await sharp(path.join(SRC, "map_files", String(L), `0_${r}.jpg`)).extract({ left: 0, top, width: pw, height }).toBuffer();
  parts.push({ input: buf, left: 0, top: r * TILE });
}
await sharp({ create: { width: pw, height: ph, channels: 3, background: "#16111b" } }).composite(parts).webp({ quality: 82 }).toFile(path.join(OUT, "poster.webp"));

console.log(`surf map ${variant}: ${w}x${h}, levels 0-${maxLevel}, ${files} tiles, ${(bytes / 1e6).toFixed(1)} MB -> ${path.relative(ROOT, OUT)}`);
