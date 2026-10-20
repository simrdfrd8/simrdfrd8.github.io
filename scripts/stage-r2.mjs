#!/usr/bin/env node
// Collects exactly the files that go to the Cloudflare R2 media bucket: one 320 kbps MP3 + peaks.json per beat in
// content/beats.json, under the same keys the site requests (<NEXT_PUBLIC_MEDIA_BASE>/media/beat-<id>/audio.mp3).
//
//   node scripts/stage-r2.mjs [--from <dir containing media/>] [--out <staging dir>]
//   defaults: --from ../site/public   --out ../r2-upload   (relative to this repo)
//
// Upload the staging folder's contents as-is (e.g. `rclone copy <out> r2:<bucket>`), so keys start with media/.
// Lossless masters (.wav/.aif/.aiff/.flac) are never staged: the script refuses them.
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const arg = (name, def) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : def; };
const FROM = path.resolve(ROOT, arg("--from", "../site/public"));
const OUT = path.resolve(ROOT, arg("--out", "../r2-upload"));
const MASTER = /\.(wav|aiff?|flac)$/i;

const beats = JSON.parse(readFileSync(path.join(ROOT, "content", "beats.json"), "utf8"));
const keys = beats.flatMap((b) => (b.audio ? [b.audio.src, b.audio.peaksSrc] : [])).map((k) => k.replace(/^\//, ""));
const bad = keys.filter((k) => MASTER.test(k) || !/^media\/beat-[a-z0-9-]+\/(audio\.mp3|peaks\.json)$/.test(k));
if (bad.length) { console.error("✗ refusing unexpected keys:\n  " + bad.join("\n  ")); process.exit(1); }
const missing = keys.filter((k) => !existsSync(path.join(FROM, k)));
if (missing.length) { console.error(`✗ ${missing.length} source files missing under ${FROM}:\n  ` + missing.slice(0, 20).join("\n  ")); process.exit(1); }

rmSync(OUT, { recursive: true, force: true });
let total = 0;
const manifest = [];
for (const k of keys) {
  const dst = path.join(OUT, k);
  mkdirSync(path.dirname(dst), { recursive: true });
  copyFileSync(path.join(FROM, k), dst);
  const size = statSync(dst).size;
  total += size;
  manifest.push({ key: k, bytes: size, contentType: k.endsWith(".mp3") ? "audio/mpeg" : "application/json" });
}
writeFileSync(path.join(OUT, "..", "r2-upload-manifest.json"), JSON.stringify({ count: manifest.length, totalBytes: total, files: manifest }, null, 2) + "\n");
const mp3 = manifest.filter((m) => m.key.endsWith(".mp3")).length;
console.log(`✓ staged ${manifest.length} files (${mp3} MP3 + ${manifest.length - mp3} peaks.json) = ${(total / 1024 / 1024).toFixed(1)} MiB in ${OUT}`);
console.log("  manifest: r2-upload-manifest.json (next to the staging folder)");
