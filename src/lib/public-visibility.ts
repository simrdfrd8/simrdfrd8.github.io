/**
 * Build-time public-surface switches. Read from content/public-visibility.json so a rebuild
 * can restore music or the surf map without rewriting pages.
 */
import flags from "@content/public-visibility.json";

export type PublicVisibility = {
  publicMusicVisible: boolean;
  publicSurfMapVisible: boolean;
};

export const publicMusicVisible = () => flags.publicMusicVisible === true;
export const publicSurfMapVisible = () => flags.publicSurfMapVisible === true;

/** Short crew-voice stand-in for /music/ and /music/songs/ while the catalog is under review. */
export const MUSIC_COMING_SOON = "New music lineup coming soon.";
