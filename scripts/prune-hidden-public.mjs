#!/usr/bin/env node
/**
 * After a static export, drop surfaces that public-visibility.json has turned off.
 * Repo sources (content/, public/surf-map, catalog JSON) stay in place so a flag flip restores them.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const flags = JSON.parse(fs.readFileSync(path.join(ROOT, "content/public-visibility.json"), "utf8"));
const OUT = path.join(ROOT, "out");
const TEXT = /\.(html|txt|json|js|xml|rsc|css|map)$/i;
const errors = [];

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

if (!flags.publicSurfMapVisible) {
  const p = path.join(OUT, "surf-map");
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
  const osd = path.join(OUT, "vendor/openseadragon");
  if (fs.existsSync(osd)) fs.rmSync(osd, { recursive: true, force: true });
}

if (!flags.publicMusicVisible) {
  for (const f of walk(OUT)) {
    if (f.endsWith(".mp3")) fs.rmSync(f);
  }
}

if (!flags.publicFilmVisible) {
  const filmDir = path.join(OUT, "media/film");
  if (fs.existsSync(filmDir)) fs.rmSync(filmDir, { recursive: true, force: true });
  for (const f of walk(OUT)) {
    if (/brand-film/i.test(path.basename(f))) fs.rmSync(f);
  }
}

if (!fs.existsSync(OUT)) {
  console.error("prune-hidden-public: out/ is missing");
  process.exit(1);
}

const files = walk(OUT).filter((f) => TEXT.test(f) && !f.includes("/."));
const leak = (re, label, extraOk = () => false) => {
  for (const f of files) {
    const t = fs.readFileSync(f, "utf8");
    if (!re.test(t)) continue;
    if (extraOk(t, f)) continue;
    errors.push(`${label} in ${path.relative(OUT, f)}`);
  }
};

if (!flags.publicMusicVisible) {
  leak(/payhip\.com/i, "payhip.com");
  leak(/\.mp3\b/i, ".mp3");
  // leftover beat-preview paths in the export
  leak(/\/media\/beat-[^"' \n]+\/audio\.mp3|media\/flavorful-croissants\/[^"' \n]+\.mp3/i, "preview audio path");
}

if (!flags.publicSurfMapVisible) {
  if (fs.existsSync(path.join(OUT, "surf-map"))) errors.push("out/surf-map still present");
  // tiles must not ship; a leftover JS string is reported so we can tighten the bundle later
  leak(/surf-map\/v5\.1\//, "surf-map tile path");
}

if (!flags.publicFilmVisible) {
  if (fs.existsSync(path.join(OUT, "media/film"))) errors.push("out/media/film still present");
  leak(/brand-film-v6-\d+\.mp4|brand-film-poster|brand-film-v[1-6]/i, "brand film asset");
  leak(/\/media\/film\//i, "film media path");
}

if (errors.length) {
  console.error("prune-hidden-public failed:\n" + errors.slice(0, 40).join("\n"));
  process.exit(1);
}
console.log(
  `prune-hidden-public: ok (music ${flags.publicMusicVisible ? "on" : "off"}, map ${flags.publicSurfMapVisible ? "on" : "off"}, film ${flags.publicFilmVisible ? "on" : "off"})`,
);
