import { describe, expect, it } from "vitest";
import { publicMusicVisible, publicSurfMapVisible, publicFilmVisible, publicArtistVisible, publicArtistSlugs, publicBeatSlugs, publicBeatVisible, MUSIC_COMING_SOON, VIDEO_COMING_SOON } from "@/lib/public-visibility";
import { getBeats, getTracks, listedArtists, listedPublicBeats } from "@/lib/catalog";
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

  it("limits the public Artists roster to Flavorful Croissants, 720M, Not DAF, and Dan Perales", () => {
    const slugs = publicArtistSlugs();
    expect(slugs).toEqual(["flavorful-croissants", "720m", "not-daf", "dan-perales"]);
    expect(publicArtistVisible("flavorful-croissants")).toBe(true);
    expect(publicArtistVisible("720m")).toBe(true);
    expect(publicArtistVisible("not-daf")).toBe(true);
    expect(publicArtistVisible("dan-perales")).toBe(true);
    expect(publicArtistVisible("andrew-bigs")).toBe(false);
    expect(publicArtistVisible("baylingual-entertainment")).toBe(false);
    expect(publicArtistVisible("ricky")).toBe(true);
    expect(publicArtistVisible("ookie")).toBe(true);
    expect(listedArtists().map((a) => a.slug)).toEqual(["720m", "dan-perales", "not-daf", "flavorful-croissants"]);
    expect(listedArtists().find((a) => a.slug === "not-daf")?.name).toBe("Not DAF");
  });

  it("defaults the public switches off while those surfaces are under review", () => {
    // Flip content/public-visibility.json to restore. This assertion documents the current review state.
    expect(publicMusicVisible()).toBe(false);
    expect(publicSurfMapVisible()).toBe(false);
    expect(publicFilmVisible()).toBe(false);
  });

  it("allowlists only goodsleepix as a public beat on Flavorful Croissants' page", () => {
    expect(publicBeatSlugs()).toEqual(["goodsleepix"]);
    expect(publicBeatVisible("goodsleepix")).toBe(true);
    expect(publicBeatVisible("deserts")).toBe(false);
    expect(getBeats()).toEqual([]);
    const listed = listedPublicBeats();
    expect(listed.map((b) => b.id)).toEqual(["goodsleepix"]);
    expect(listed[0].artist).toBe("flavorful-croissants");
    expect(listed[0].payhipUrl).toBe("https://payhip.com/b/PeC0A");
    expect(listed[0].audio?.src).toBe("/media/beat-goodsleepix/audio.mp3");
    expect(listed[0].audio?.src).not.toMatch(/\.wav$/i);
    expect(listedPublicBeats("flavorful-croissants").map((b) => b.id)).toEqual(["goodsleepix"]);
    expect(listedPublicBeats("720m")).toEqual([]);
  });
});
