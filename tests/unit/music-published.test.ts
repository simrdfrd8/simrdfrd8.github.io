import { describe, expect, it } from "vitest";
import beats from "@content/beats.json";
import songs from "@content/songs.json";
import releases from "@content/releases.json";
import templates from "@content/product-templates.json";
import snapJson from "@content/music-published.json";
import { applyBeatFilter, publishedReleaseIds, publishedSongIds, songBuyable, type PublishedMusic } from "@/lib/music-visibility";
import { checkMusicSnapshot, privateBeatNeedles } from "../../scripts/check-beats-public.mjs";

const snap = snapJson as unknown as PublishedMusic;
const LAUNCH = ["deserts", "east-county", "dydrm", "we-r-the-total-air-pt2", "loudassprofecyx", "sugar-hi", "bakin", "fannypack", "heard", "dolfinz"];

describe("published music snapshot (content/music-published.json)", () => {
  it("is valid and public-only: the 10 launch beats Ricky approved, in order, at MP3 $10 / WAV $25, no sales", () => {
    expect(checkMusicSnapshot(snap, beats, templates)).toEqual([]);
    expect(snap.beats.map((b) => b.id)).toEqual(LAUNCH);
    expect(snap.beats.every((b) => b.tiers["mp3-lease"].price_cents === 1000 && b.tiers["wav-lease"].price_cents === 2500 && !b.tiers["mp3-lease"].sale)).toBe(true);
    expect(JSON.stringify(snap)).not.toMatch(/visibility|rights_status|updated_by|\.wav|\.aif|\.flac|cost/i);
  });
  it("no song or album is buyable (music rights pending)", () => {
    expect([...snap.songs, ...snap.albums].every((x) => x.buy === false)).toBe(true);
    for (const s of snap.songs) expect(songBuyable(s.id)).toBe(false);
  });
  it("songs and releases listed are only ones already public on the site", () => {
    const songIds = new Set(songs.songs.map((s) => s.id)), relIds = new Set(releases.map((r) => r.id));
    for (const id of publishedSongIds()) expect(songIds.has(id)).toBe(true);
    for (const id of publishedReleaseIds()) expect(relIds.has(id)).toBe(true);
  });
  it("filter: off = every beat unchanged; on = only published beats in snapshot order", () => {
    const all = beats.map((b) => ({ id: b.id }));
    expect(applyBeatFilter(all, false)).toEqual(all);
    expect(applyBeatFilter(all, true).map((b) => b.id)).toEqual(LAUNCH);
  });
  it("checker catches a private beat, a changed price, a sale and a buyable song", () => {
    const bad = structuredClone(snap) as PublishedMusic;
    bad.beats[0].tiers["mp3-lease"].price_cents = 900;
    bad.beats[1].tiers["wav-lease"].sale = { price_cents: 2000, starts_at: null, ends_at: null };
    bad.beats.push({ id: "nope", payhip: null, tiers: bad.beats[2].tiers });
    bad.songs[0].buy = true;
    expect(checkMusicSnapshot(bad, beats, templates).length).toBe(4);
    const needles = privateBeatNeedles(snap, beats);
    expect(needles.some((n: { beat: string; needle: string }) => n.needle === "media/beat-name-of-water/")).toBe(true);
    expect(needles.some((n: { beat: string; needle: string }) => n.beat === "deserts")).toBe(false);
  });
});
