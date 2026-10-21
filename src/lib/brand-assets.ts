import { existsSync } from "node:fs";
import path from "node:path";
import brandJson from "@content/brand-assets.json";
import { isPreview } from "./env";

/**
 * Brand finals in public/brand/ (manifest: content/brand-assets.json). An image renders only if its files exist and it is
 * approved (or this is the preview build), so production never shows a broken or unapproved brand image.
 */
export type BrandImage = { id: string; src: string; webp: string; srcSet: string; webpSet: string; width: number; height: number; alt: string; caption?: string; focus?: string };
type Entry = (typeof brandJson.images)[number];

const pub = (rel: string) => existsSync(path.join(process.cwd(), "public", "brand", rel));

export function brandImage(id: string): BrandImage | null {
  const e = brandJson.images.find((x) => x.id === id) as (Entry & { web?: string; webWidth?: number; caption?: string; focus?: string }) | undefined;
  if (!e || (!e.approved && !isPreview())) return null;
  if (!pub(`${e.stem}.jpg`) || !pub(`${e.stem}.webp`)) return null;
  const at = (stem: string, ext: string) => `/brand/${stem}.${ext}`;
  const set = (ext: string) =>
    [e.web && pub(`${e.web}.${ext}`) ? `${at(e.web, ext)} ${e.webWidth}w` : null, `${at(e.stem, ext)} ${e.width}w`].filter(Boolean).join(", ");
  return { id, src: at(e.stem, "jpg"), webp: at(e.stem, "webp"), srcSet: set("jpg"), webpSet: set("webp"), width: e.width, height: e.height, alt: e.alt, ...(e.caption ? { caption: e.caption } : {}), ...(e.focus ? { focus: e.focus } : {}) };
}

export const artistCardImages = (slug: string) =>
  ((brandJson.cards as Record<string, string[]>)[slug] ?? []).map(brandImage).filter((x): x is BrandImage => !!x);

export const brandLogo = (key: keyof typeof brandJson.logos) => {
  const rel = brandJson.logos[key];
  return pub(rel) ? `/brand/${rel}` : null;
};

export const art720m = () => ({
  portrait: brandImage("720m-portrait"),
  collageWide: brandImage("720m-collage-wide"),
  collageSquare: brandImage("720m-collage-square"),
  lens: brandImage("720m-lens"),
});

/** Full-bleed artist-page hero portrait (`<slug>-portrait` in the manifest), same pattern as the 720M page. */
export const artistPortrait = (slug: string) => brandImage(`${slug}-portrait`);


/** Roster tile on /artists (`roster` in the manifest, 4:5 at 800px); falls back to the artist's first homepage card. */
export const artistRosterImage = (slug: string) => {
  const id = (brandJson as { roster?: Record<string, string> }).roster?.[slug];
  return (id ? brandImage(id) : null) ?? artistCardImages(slug)[0] ?? null;
};

/** Small round thumbnail (`thumbs` in the manifest, square crop); falls back to the artist's first homepage card. */
export const artistThumbImage = (slug: string) => {
  const id = (brandJson as { thumbs?: Record<string, string> }).thumbs?.[slug];
  return (id ? brandImage(id) : null) ?? artistCardImages(slug)[0] ?? null;
};

/** Two-letter monogram for artists without approved art ("Not Däf" → "ND"). */
export const monogram = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");


export { hasMarks } from "./marks";
