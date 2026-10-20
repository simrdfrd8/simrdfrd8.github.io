// Build guard (runs as `prebuild` and in the unit tests): fail if a lossless master is under public/,
// or if any page source / content field points a URL at one. WAVs are sold via checkout only.
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const MASTER = /\.(wav|aiff?|flac)$/i;
// a URL or public path to a master (".../x.wav", "/media/x.wav", "https://…wav"); source-file name fields are allowed
const URLISH = /(?:https?:\/\/|["'`(]\/)[^"'`)\s]*\.(?:wav|aiff?|flac)\b/i;
const PROVENANCE = new Set(["sourcePath", "notes", "files", "unmatched", "source", "original"]);

const walk = (d) => readdirSync(d).flatMap((f) => { const p = path.join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });

export function findWavProblems() {
  const problems = [];
  for (const f of walk(path.join(ROOT, "public"))) if (MASTER.test(f)) problems.push(`master file under public/: ${path.relative(ROOT, f)}`);
  for (const f of walk(path.join(ROOT, "src"))) if (/\.(tsx?|css)$/.test(f) && URLISH.test(readFileSync(f, "utf8"))) problems.push(`page source links a master: ${path.relative(ROOT, f)}`);
  const visit = (v, file, key) => {
    if (typeof v === "string") { if (!PROVENANCE.has(key) && (MASTER.test(v) || URLISH.test(`"${v}`))) problems.push(`content links a master: ${file} ${key}=${v}`); }
    else if (Array.isArray(v)) v.forEach((x) => visit(x, file, key));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) visit(x, file, PROVENANCE.has(key) ? key : k);
  };
  for (const f of walk(path.join(ROOT, "content"))) if (f.endsWith(".json")) visit(JSON.parse(readFileSync(f, "utf8")), path.relative(ROOT, f), "");
  return problems;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const p = findWavProblems();
  if (p.length) { console.error("✗ WAV guard failed:\n  " + p.join("\n  ")); process.exit(1); }
  console.log("✓ WAV guard: no masters under public/ and none linked");
}
