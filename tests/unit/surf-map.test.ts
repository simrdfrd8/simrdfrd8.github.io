import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/** Home page surf map: only deep-zoom JPEG tiles, the .dzi and the small poster ship. Never the print master. */
const DIR = path.join(__dirname, "../../public/surf-map");
const DZI = path.join(DIR, "v5.1/map.dzi");

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const f = path.join(dir, name);
    if (statSync(f).isDirectory()) yield* walk(f);
    else yield f;
  }
}

describe("surf map tiles", () => {
  it("ship only tiles, map.dzi and poster.webp (no PNG/TIFF master, no 300 dpi print file)", () => {
    const bad = [...walk(DIR)].map((f) => path.relative(DIR, f)).filter((f) => !/^v5\.1\/(map\.dzi|poster\.webp|map_files\/\d+\/\d+_\d+\.jpg)$/.test(f));
    expect(bad).toEqual([]);
  });

  it("tile levels match the size declared in map.dzi", () => {
    const dzi = readFileSync(DZI, "utf8");
    const w = Number(/Width="(\d+)"/.exec(dzi)?.[1]);
    const h = Number(/Height="(\d+)"/.exec(dzi)?.[1]);
    const tile = Number(/TileSize="(\d+)"/.exec(dzi)?.[1]);
    const max = Math.ceil(Math.log2(Math.max(w, h)));
    const levels = readdirSync(path.join(DIR, "v5.1/map_files")).map(Number).sort((a, b) => a - b);
    expect(levels).toEqual(Array.from({ length: max + 1 }, (_, i) => i));
    const cols = Math.ceil(w / tile);
    const rows = Math.ceil(h / tile);
    expect(readdirSync(path.join(DIR, `v5.1/map_files/${max}`)).length).toBe(cols * rows);
  });

  it("OpenSeadragon is bundled locally", () => {
    expect(existsSync(path.join(__dirname, "../../public/vendor/openseadragon/openseadragon.min.js"))).toBe(true);
  });
});
