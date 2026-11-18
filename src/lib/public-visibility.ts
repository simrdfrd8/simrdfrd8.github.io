/**
 * Build-time public-surface switches. Read from content/public-visibility.json so a rebuild
 * can restore music, the surf map, or the brand film without rewriting pages.
 */
import flags from "@content/public-visibility.json";

export type PublicVisibility = {
  publicMusicVisible: boolean;
  publicSurfMapVisible: boolean;
  publicFilmVisible: boolean;
};

export const publicMusicVisible = () => flags.publicMusicVisible === true;
export const publicSurfMapVisible = () => flags.publicSurfMapVisible === true;
export const publicFilmVisible = () => flags.publicFilmVisible === true;

/** Short crew-voice stand-in for /music/ and /music/songs/ while the catalog is under review. */
export const MUSIC_COMING_SOON = "New music lineup coming soon.";

/** Short stand-in for /video/ while the brand film (and the video page) is hidden. */
export const VIDEO_COMING_SOON = "Videos coming soon.";
