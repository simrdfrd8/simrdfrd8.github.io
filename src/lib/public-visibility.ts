/**
 * Build-time public-surface switches. Read from content/public-visibility.json so a rebuild
 * can restore music, the surf map, the brand film, or hidden artist pages without rewriting pages.
 */
import flags from "@content/public-visibility.json";
import labelArtists from "@content/artists-label.json";

/** Label runners (Ricky, Ookie) keep their existing pages; they are not the public Artists roster. */
const LABEL_ARTIST_SLUGS = new Set((labelArtists as { slug: string }[]).map((a) => a.slug));

export type PublicVisibility = {
  publicMusicVisible: boolean;
  publicSurfMapVisible: boolean;
  publicFilmVisible: boolean;
  publicArtistSlugs?: string[];
  /** Curated beats shown on artist pages while the rest of the music catalog stays hidden. */
  publicBeats?: string[];
};

export const publicMusicVisible = () => flags.publicMusicVisible === true;
export const publicSurfMapVisible = () => flags.publicSurfMapVisible === true;
export const publicFilmVisible = () => flags.publicFilmVisible === true;

/** Short crew-voice stand-in for /music/ and /music/songs/ while the catalog is under review. */
export const MUSIC_COMING_SOON = "New music lineup coming soon.";

/** Short stand-in for /video/ while the brand film (and the video page) is hidden. */
export const VIDEO_COMING_SOON = "Videos coming soon.";

/** Public Artists roster. If publicArtistSlugs is set, only those slugs appear; omit the key to show every listed artist. */
export const publicArtistSlugs = (): string[] | null =>
  Array.isArray(flags.publicArtistSlugs) ? flags.publicArtistSlugs : null;

export const publicArtistVisible = (slug: string) => {
  const slugs = publicArtistSlugs();
  if (slugs === null) return true;
  if (LABEL_ARTIST_SLUGS.has(slug)) return true;
  return slugs.includes(slug);
};

/** Curated public beat ids, in list order. Empty when the key is omitted. */
export const publicBeatSlugs = (): string[] => (Array.isArray(flags.publicBeats) ? flags.publicBeats : []);

export const publicBeatVisible = (id: string) => publicBeatSlugs().includes(id);
