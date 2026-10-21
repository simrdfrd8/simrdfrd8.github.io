import type { BeatTileData } from "@/lib/beat-data";

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
export function filterBeats<T extends BeatTileData>(beats: T[], { q = "", bpm = "", key = "" }: { q?: string; bpm?: string; key?: string }) {
  const needle = q.trim().toLowerCase();
  const range = BPM_RANGES.find((r) => r.id === bpm);
  return beats.filter(
    (b) =>
      (!needle || b.title.toLowerCase().includes(needle) || (b.heard?.title.toLowerCase().includes(needle) ?? false)) &&
      (!range || (b.bpm !== undefined && range.test(b.bpm))) &&
      (!key || b.key === key),
  );
}


export const BEAT_SORTS = [
  { id: "", label: "Featured" },
  { id: "bpm-asc", label: "BPM, slow → fast" },
  { id: "bpm-desc", label: "BPM, fast → slow" },
  { id: "key", label: "Key" },
  { id: "title", label: "Title A–Z" },
] as const;

/** Light sort for the beat list. "" keeps catalog order (Deserts first). Unknown BPM / key sort last. */
export function sortBeats<T extends { title: string; bpm?: number; key?: string }>(beats: T[], sort = ""): T[] {
  const out = [...beats];
  const last = Number.POSITIVE_INFINITY;
  if (sort === "bpm-asc") out.sort((a, b) => (a.bpm ?? last) - (b.bpm ?? last));
  else if (sort === "bpm-desc") out.sort((a, b) => (b.bpm ?? -1) - (a.bpm ?? -1));
  else if (sort === "key") out.sort((a, b) => (!a.key ? 1 : !b.key ? -1 : keySort(a.key, b.key)));
  else if (sort === "title") out.sort((a, b) => a.title.localeCompare(b.title));
  return out;
}
