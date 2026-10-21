import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { SamplePacksFile, type SamplePack } from "@/lib/catalog/schema";
import { libraryPacks, packDemo, PUBLIC_DEMO } from "@/lib/packs";

const base = (o: Partial<SamplePack> = {}): SamplePack =>
  SamplePacksFile.parse([{ id: "p", title: "P", contents: [], format: "x", license: "x", price: 20, status: "upcoming", ...o }])[0];

describe("sample pack library", () => {
  it("content/sample-packs.json holds only real packs (no examples) with public MP3 demos only", () => {
    const packs = SamplePacksFile.parse(JSON.parse(readFileSync(path.join(__dirname, "../../content/sample-packs.json"), "utf8")));
    for (const p of packs) {
      expect(p.example).toBe(false);
      expect(p.checkoutUrl).toBeNull();
      if (p.demo.clipSrc) expect(p.demo.clipSrc).toMatch(PUBLIC_DEMO);
    }
  });

  it("only plays MP3 previews from /media/ (never masters or other URLs)", () => {
    expect(packDemo(base({ demo: { clipSrc: "/media/pack-x/demo.mp3" } }))).toMatch(/\/media\/pack-x\/demo\.mp3$/);
    for (const bad of ["/media/pack-x/demo.wav", "/media/pack-x/demo.flac", "/media/x.aif", "https://example.com/x.mp3", "/brand/x.mp3", "/media/../x.mp3"]) {
      expect(packDemo(base({ demo: { clipSrc: bad } }))).toBeUndefined();
    }
  });

  it("drops example and draft packs and never exposes a price", () => {
    const tiles = libraryPacks([base({ id: "real", genres: ["Hip-Hop"] }), base({ id: "ex", example: true }), base({ id: "dr", status: "draft" })]);
    expect(tiles.map((t) => t.id)).toEqual(["real"]);
    expect(tiles[0].comingSoon).toBe(true);
    expect(JSON.stringify(tiles)).not.toMatch(/\$|price|checkout/i);
  });
});
