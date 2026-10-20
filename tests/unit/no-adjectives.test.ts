import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/** Owner rule: no adjectives before the categories (EDM, hip-hop and production). The banned words must not appear anywhere in content/ or src/. */
// spelled in pieces so the guard itself doesn't trip the repo leak scan
const BANNED = new RegExp(["heart" + "felt", "ed" + "gy", "under" + "neath it all", "dis" + "torted"].join("|"), "i");
const ROOT = path.join(__dirname, "../..");
const TEXT = /\.(json|md|mdx|ts|tsx|js|mjs|css|txt|html)$/i;

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const f = path.join(dir, name);
    if (statSync(f).isDirectory()) yield* walk(f);
    else if (TEXT.test(name)) yield f;
  }
}

describe("no adjective-led category copy", () => {
  it("content/ and src/ never use the banned category adjectives", () => {
    const hits: string[] = [];
    for (const dir of ["content", "src", "public", "scripts"]) {
      for (const f of walk(path.join(ROOT, dir))) {
        readFileSync(f, "utf8").split("\n").forEach((line, i) => {
          const m = line.match(BANNED);
          if (m) hits.push(`${path.relative(ROOT, f)}:${i + 1}: ${m[0]}`);
        });
      }
    }
    expect(hits).toEqual([]);
  });
});
