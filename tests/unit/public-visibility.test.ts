import { describe, expect, it } from "vitest";
import { publicMusicVisible, publicSurfMapVisible, publicFilmVisible, MUSIC_COMING_SOON, VIDEO_COMING_SOON } from "@/lib/public-visibility";
import { getBeats, getTracks } from "@/lib/catalog";
import { visiblePrimaryNav, visibleSecondaryNav, primaryNav, secondaryNav } from "@/lib/brand";

describe("public visibility flags", () => {
  it("exposes a short placeholder line for hidden music routes", () => {
    expect(MUSIC_COMING_SOON).toBe("New music lineup coming soon.");
  });

  it("hides beats, self-hosted songs, and SoundCloud catalogs when music is off", () => {
    if (publicMusicVisible()) {
      expect(getBeats().length).toBeGreaterThan(0);
      expect(getTracks().length).toBeGreaterThan(0);
      expect(visiblePrimaryNav().map((i) => i.label)).toEqual(primaryNav.map((i) => i.label));
      return;
    }
    expect(getBeats()).toEqual([]);
    expect(getTracks()).toEqual([]);
    expect(visiblePrimaryNav().map((i) => i.label)).toEqual(["Artists", "Merch", "Contact"]);
  });

  it("hides the Video footer item when the brand film is off", () => {
    if (publicFilmVisible()) {
      expect(visibleSecondaryNav().map((i) => i.label)).toEqual(secondaryNav.map((i) => i.label));
      return;
    }
    expect(visibleSecondaryNav().some((i) => i.href === "/video")).toBe(false);
    expect(VIDEO_COMING_SOON).toBe("Videos coming soon.");
  });

  it("defaults the public switches off while those surfaces are under review", () => {
    // Flip content/public-visibility.json to restore. This assertion documents the current review state.
    expect(publicMusicVisible()).toBe(false);
    expect(publicSurfMapVisible()).toBe(false);
    expect(publicFilmVisible()).toBe(false);
  });
});
