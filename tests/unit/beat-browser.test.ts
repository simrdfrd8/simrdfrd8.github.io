import { describe, expect, it } from "vitest";
import { filterBeats } from "@/lib/beat-filter";
import type { BeatTileData } from "@/lib/beat-data";

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

import { sortBeats } from "@/lib/beat-filter";
describe("sortBeats", () => {
  const list = [b("c", 120, "G major"), b("a", 90, "A minor"), b("b", undefined, undefined), b("d", 100, "C major")];
  it("keeps catalog order by default", () => expect(sortBeats(list).map((x) => x.id)).toEqual(["c", "a", "b", "d"]));
  it("sorts by BPM with unknown last", () => {
    expect(sortBeats(list, "bpm-asc").map((x) => x.id)).toEqual(["a", "d", "c", "b"]);
    expect(sortBeats(list, "bpm-desc").map((x) => x.id)).toEqual(["c", "d", "a", "b"]);
  });
  it("sorts by key and title", () => {
    expect(sortBeats(list, "key").map((x) => x.id)).toEqual(["d", "c", "a", "b"]);
    expect(sortBeats(list, "title").map((x) => x.id)).toEqual(["a", "b", "c", "d"]);
  });
});
