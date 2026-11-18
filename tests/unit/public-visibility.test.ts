import { describe, expect, it } from "vitest";
import { publicMusicVisible, publicSurfMapVisible, publicFilmVisible, publicArtistVisible, publicArtistSlugs, MUSIC_COMING_SOON, VIDEO_COMING_SOON } from "@/lib/public-visibility";
import { getBeats, getTracks, listedArtists } from "@/lib/catalog";
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

  it("limits the public Artists roster to Flavorful Croissants, 720M, and Not DAF", () => {
    const slugs = publicArtistSlugs();
    expect(slugs).toEqual(["flavorful-croissants", "720m", "not-daf"]);
    expect(publicArtistVisible("flavorful-croissants")).toBe(true);
    expect(publicArtistVisible("720m")).toBe(true);
    expect(publicArtistVisible("not-daf")).toBe(true);
    expect(publicArtistVisible("dan-perales")).toBe(false);
    expect(publicArtistVisible("andrew-bigs")).toBe(false);
    expect(publicArtistVisible("baylingual-entertainment")).toBe(false);
    expect(publicArtistVisible("ricky")).toBe(true);
    expect(publicArtistVisible("ookie")).toBe(true);
    expect(listedArtists().map((a) => a.slug)).toEqual(["720m", "not-daf", "flavorful-croissants"]);
    expect(listedArtists().find((a) => a.slug === "not-daf")?.name).toBe("Not DAF");
  });

  it("defaults the public switches off while those surfaces are under review", () => {
    // Flip content/public-visibility.json to restore. This assertion documents the current review state.
    expect(publicMusicVisible()).toBe(false);
    expect(publicSurfMapVisible()).toBe(false);
    expect(publicFilmVisible()).toBe(false);
  });
});
