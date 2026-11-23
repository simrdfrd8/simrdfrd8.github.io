import { describe, expect, it } from "vitest";
import { publicMusicVisible, publicSurfMapVisible, publicFilmVisible, publicArtistVisible, publicArtistSlugs, publicBeatSlugs, publicBeatVisible, public720mTrackSlugs, public720mTrackVisible, MUSIC_COMING_SOON, VIDEO_COMING_SOON } from "@/lib/public-visibility";
import { getBeats, getTracks, listedArtists, listedPublicBeats, listedPublic720mTracks } from "@/lib/catalog";
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

  it("allowlists the curated Flavorful Croissants public beats in order", () => {
    expect(publicBeatSlugs()).toEqual(["goodsleepix", "aba-aku", "blue-like-the-winds", "takeashowerdude", "aftrthat"]);
    expect(publicBeatVisible("goodsleepix")).toBe(true);
    expect(publicBeatVisible("takeashowerdude")).toBe(true);
    expect(publicBeatVisible("aftrthat")).toBe(true);
    expect(publicBeatVisible("deserts")).toBe(false);
    expect(getBeats()).toEqual([]);
    const listed = listedPublicBeats();
    expect(listed.map((b) => b.id)).toEqual(["goodsleepix", "aba-aku", "blue-like-the-winds", "takeashowerdude", "aftrthat"]);
    expect(listed.map((b) => b.title)).toEqual(["goodsleepix", "aba aku", "Blue like the winds", "takeashowerdude", "aftrthat"]);
    expect(listed.every((b) => b.artist === "flavorful-croissants")).toBe(true);
    expect(listed.map((b) => b.payhipUrl)).toEqual(["https://payhip.com/b/PeC0A", "https://payhip.com/b/Aygnc", "https://payhip.com/b/I1M4p", "https://payhip.com/b/1JX0z", "https://payhip.com/b/eQsP8"]);
    expect(listed.map((b) => b.audio?.src)).toEqual(["/media/beat-goodsleepix/audio.mp3", "/media/beat-aba-aku/audio.mp3", "/media/beat-blue-like-the-winds/audio.mp3", "/media/beat-takeashowerdude/audio.mp3", "/media/beat-aftrthat/audio.mp3"]);
    expect(listed.map((b) => b.audio?.src).join(" ")).not.toMatch(/\.wav|flavorful-croissants\//i);
    expect(listedPublicBeats("flavorful-croissants").map((b) => b.id)).toEqual(["goodsleepix", "aba-aku", "blue-like-the-winds", "takeashowerdude", "aftrthat"]);
    expect(listedPublicBeats("720m")).toEqual([]);
  });

  it("allowlists the curated 720M vocal tracks in order, play-only", () => {
    expect(public720mTrackSlugs()).toEqual(["stayathomesaturday", "srzydd", "ride", "da-amo", "bay-area", "aftrthat", "loudassprofecyz", "fannypack", "sugar-hi", "pandaspk", "bakin", "mellow-life", "blindspot"]);
    expect(public720mTrackVisible("blindspot")).toBe(true);
    expect(public720mTrackVisible("pandaspk")).toBe(true);
    expect(public720mTrackVisible("loudassprofecyz")).toBe(true);
    expect(public720mTrackVisible("da-amo")).toBe(true);
    expect(public720mTrackVisible("ride")).toBe(true);
    expect(public720mTrackVisible("srzydd")).toBe(true);
    expect(public720mTrackVisible("stayathomesaturday")).toBe(true);
    const listed = listedPublic720mTracks();
    expect(listed.map((t) => t.id)).toEqual(["stayathomesaturday", "srzydd", "ride", "da-amo", "bay-area", "aftrthat", "loudassprofecyz", "fannypack", "sugar-hi", "pandaspk", "bakin", "mellow-life", "blindspot"]);
    expect(listed.map((t) => t.title)).toEqual(["stayathomesaturday", "srzydd", "Ride", "Da Amo", "Bay Area", "aftrthat", "loudassprofecyz", "FANNYPACK", "sugar hi", "pandaspk", "bakin", "Mellow Life", "Blindspot"]);
    const byId = Object.fromEntries(listed.map((t) => [t.id, t]));
    expect(listed.filter((t) => t.id !== "pandaspk").every((t) => t.credit === "720M × Flavorful Croissants")).toBe(true);
    expect(byId.pandaspk.credit).toBe("720M × Dan Perales");
    expect(listed.filter((t) => t.id !== "loudassprofecyz").map((t) => t.src)).toEqual([
      "/media/720m-stayathomesaturday/audio.mp3",
      "/media/720m-srzydd/audio.mp3",
      "/media/720m-ride/audio.mp3",
      "/media/720m-da-amo/audio.mp3",
      "/media/720m-bay-area/audio.mp3",
      "/media/720m-aftrthat/audio.mp3",
      "/media/720m-fannypack/audio.mp3",
      "/media/720m-sugar-hi/audio.mp3",
      "/media/720m-pandaspk/audio.mp3",
      "/media/720m-bakin/audio.mp3",
      "/media/720m-mellow-life/audio.mp3",
      "/media/720m-blindspot/audio.mp3",
    ]);
    expect(byId.loudassprofecyz.src).toBeUndefined();
    expect(byId.loudassprofecyz.soundcloudUrl).toBe("https://soundcloud.com/user-536995429/loudassprofecyz-x-ricky");
    expect(byId.loudassprofecyz.scId).toBe(2177915880);
    expect(listed.map((t) => t.src ?? "").join(" ")).not.toMatch(/\.wav|beat-|flavorful-croissants\//i);
    expect(listed.every((t) => !("payhipUrl" in t))).toBe(true);
    expect(listedPublic720mTracks("720m").map((t) => t.id)).toEqual(listed.map((t) => t.id));
    expect(listed.every((t) => t.producedBy === "Flavorful Croissants")).toBe(true);
    expect(listedPublic720mTracks("flavorful-croissants")).toEqual([]);
    expect(getBeats()).toEqual([]);
  });
});
