import type { BeatTileData } from "@/components/BeatTile";

export const BPM_RANGES = [
  { id: "lt90", label: "Under 90", test: (b: number) => b < 90 },
  { id: "90-109", label: "90–109", test: (b: number) => b >= 90 && b < 110 },
  { id: "110-129", label: "110–129", test: (b: number) => b >= 110 && b < 130 },
  { id: "130+", label: "130+", test: (b: number) => b >= 130 },
] as const;

const NOTE_ORDER = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const keySort = (a: string, b: string) => {
  const [na, ma] = a.split(" ");
  const [nb, mb] = b.split(" ");
  return NOTE_ORDER.indexOf(na) - NOTE_ORDER.indexOf(nb) || ma.localeCompare(mb);
};

/** Filter a beat list by text, BPM range and key. Exported for unit tests. */
export function filterBeats(beats: BeatTileData[], { q = "", bpm = "", key = "" }: { q?: string; bpm?: string; key?: string }) {
  const needle = q.trim().toLowerCase();
  const range = BPM_RANGES.find((r) => r.id === bpm);
  return beats.filter(
    (b) =>
      (!needle || b.title.toLowerCase().includes(needle) || (b.heard?.title.toLowerCase().includes(needle) ?? false)) &&
      (!range || (b.bpm !== undefined && range.test(b.bpm))) &&
      (!key || b.key === key),
  );
}

