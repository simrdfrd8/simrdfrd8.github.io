import { describe, expect, it } from "vitest";
import { filterBeats } from "@/lib/beat-filter";
import type { BeatTileData } from "@/components/BeatTile";

const b = (id: string, bpm?: number, key?: string, heard?: string): BeatTileData => ({ id, title: id, bpm, key, audience: "rapper", heard: heard ? { title: heard, url: "#", credit: "" } : undefined });
const beats = [b("East County", 124, "G major"), b("Paino Drums", 90, "A minor"), b("Name of Water", undefined, "G major"), b("DYdrm", 125, "A major", "DYdrm song"), b("slow one", 70)];

describe("beat catalog filters", () => {
  it("searches titles and 'heard on' songs, case-insensitive", () => {
    expect(filterBeats(beats, { q: "PAINO" }).map((x) => x.id)).toEqual(["Paino Drums"]);
    expect(filterBeats(beats, { q: "song" }).map((x) => x.id)).toEqual(["DYdrm"]);
  });
  it("filters by BPM range and excludes beats without a measured BPM", () => {
    expect(filterBeats(beats, { bpm: "110-129" }).map((x) => x.id)).toEqual(["East County", "DYdrm"]);
    expect(filterBeats(beats, { bpm: "lt90" }).map((x) => x.id)).toEqual(["slow one"]);
    expect(filterBeats(beats, { bpm: "90-109" }).map((x) => x.id)).toEqual(["Paino Drums"]);
  });
  it("filters by exact key and combines filters", () => {
    expect(filterBeats(beats, { key: "G major" }).map((x) => x.id)).toEqual(["East County", "Name of Water"]);
    expect(filterBeats(beats, { key: "G major", bpm: "110-129" }).map((x) => x.id)).toEqual(["East County"]);
  });
});
