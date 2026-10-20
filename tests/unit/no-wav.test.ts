import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { findWavProblems } from "../../scripts/check-no-wav.mjs";
import { catalog } from "@/lib/catalog";

describe("WAV masters are purchase-only", () => {
  it("no .wav/.aiff/.flac under public/ and none linked from pages or content", () => {
    expect(findWavProblems()).toEqual([]);
  });

  it("every beat plays the 320 kbps MP3 from <media base>/media/beat-<id>/", () => {
    expect(catalog.beats.length).toBeGreaterThan(0);
    for (const b of catalog.beats) {
      expect(b.audio?.src).toBe(`/media/beat-${b.id}/audio.mp3`);
      expect(b.audio?.peaksSrc).toBe(`/media/beat-${b.id}/peaks.json`);
      expect(existsSync(path.join("public", b.audio!.peaksSrc))).toBe(false); // peaks live on R2 with the MP3, never in the repo
      const mp3 = path.join("public", b.audio!.src);
      if (!existsSync(mp3)) continue; // media is gitignored; checked wherever it's present
      const rate = execFileSync("ffprobe", ["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=codec_name,bit_rate", "-of", "csv=p=0", mp3]).toString().trim();
      expect(rate).toBe("mp3,320000");
    }
  }, 120_000);

  it("beats are listed in the owner's order with no placeholder titles", () => {
    expect(catalog.beats.slice(0, 5).map((b) => b.title)).toEqual(["Deserts", "East County", "Name of Water", "Paino Drums", "DYdrm"]);
    expect(catalog.beats).toHaveLength(115);
    expect(new Set(catalog.beats.map((b) => b.id)).size).toBe(115);
    // owner: no held-back vocal beats, remixes or covers
    const titles = catalog.beats.map((b) => b.title.toLowerCase());
    for (const t of ["oldtownremix", "wagon wheel", "cowlagenics", "bay area"]) expect(titles).not.toContain(t);
    // held back for possible vocals, owner listened: keep
    for (const t of ["cheesecake", "takeashowerdude", "lezgolilsauce", "skass", "glowen", "laughter and shit"]) expect(titles).toContain(t);
    for (const t of ["panda", "contingent", "magnumrubberxz", "crzysht", "wearethecolorzx", "apocolypse your face", "some days we live", "wave"]) expect(titles).toContain(t);
    expect(catalog.beats.every((b) => b.publishApproved && b.artist === "flavorful-croissants" && b.audience === "rapper")).toBe(true);
    expect(catalog.beats.some((b) => b.title === "Water")).toBe(false);
  });
});
