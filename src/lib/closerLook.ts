/**
 * "Closer look": production details for the merch line, shown on /shop/merch and on each launch product page.
 *
 * Every fact here is sourced (see the comment on each entry): the Apliiq production packet (STATUS, woven-label
 * README, spec sheet) or the blank maker's own spec sheet. Nothing unconfirmed goes in. Open items (label colour option, the back-neck
 * print, care labels) are deliberately left out until they're decided.
 *
 * Images live in /public/media/closer-look/<file>-<480|960>.<webp|avif> (4:5). To swap in real sample photos, drop
 * new files in with the SAME base name and widths and set `mockup: false`. While `mockup` is true the tile is marked
 * data-mockup="true" and the section shows a one-line "detail renders" note.
 */

export type CloserLookTile = {
  id: "label" | "cotton" | "print";
  title: string;
  body: string;
  /** small spec line under the copy */
  spec?: string;
  /** base file name in /public/media/closer-look/ (no width/extension) */
  file: string;
  alt: string;
  /** true = render or crop of a mockup, not a photo of a real sample yet */
  mockup: boolean;
};

export const CLOSER_LOOK_DIR = "/media/closer-look";
export const CLOSER_LOOK_WIDTHS = [480, 960] as const;

type Garment = "cc1717" | "cc3023cl" | "cc9360" | "as4063g";

/** Launch line only. Products not listed here get no Closer look block. */
const PRODUCTS: Record<string, { garment: Garment; label: boolean }> = {
  // label: the 1.5" woven label row exists in the spec sheet only for these 6 non-women's-cut pieces (04-spec-sheet/spec-sheet.csv)
  "merch-hotdog-tee-white": { garment: "cc1717", label: true },
  "merch-feelings-notice-tee": { garment: "cc1717", label: true },
  "merch-heartbeat-triangle-tee": { garment: "cc1717", label: true },
  "merch-no-thanks-tee": { garment: "cc1717", label: true },
  "merch-make-art-with-friends-tee": { garment: "cc1717", label: true },
  "merch-santa-cruz-dipper-tank": { garment: "cc9360", label: true },
  "merch-make-art-with-friends-womens-boxy-tee": { garment: "cc3023cl", label: false },
  "merch-feelings-notice-womens-boxy-tee": { garment: "cc3023cl", label: false },
  "merch-hotdo-g-womens-boxy-tee": { garment: "cc3023cl", label: false },
  "merch-santa-cruz-dipper-womens-rib-tank": { garment: "as4063g", label: false },
};

// Label: 01-woven-label/README.md (v1 mark, a croissant; packet files call it "dome"; 1.5" decided Oct 22, woven, two flat colours, thinnest line 1.10 mm,
// Apliiq 1 mm rule) + spec-sheet.csv (Left Hem, 0.5" up from the hem).
const LABEL: Omit<CloserLookTile, "file"> = {
  id: "label",
  title: "a woven label",
  body: "our little croissant, woven (not printed) into a 1.5-inch label and sewn just above the hem. every line is over a millimeter thick, so it weaves clean.",
  spec: "woven · 1.5 in · two colors, no text",
  alt: "Close-up of the square woven label with the red croissant mark, sewn above a tee's hem",
  mockup: true,
};

// Fabric facts: Comfort Colors / AS Colour spec sheets (1717, 3023CL, 9360: 6.1 oz 100% US ring-spun cotton,
// garment-dyed; 4063G: 330 GSM, 95% organic cotton 5% spandex, 2x2 rib, slim fit, preshrunk).
const COTTON: Record<Garment, Omit<CloserLookTile, "file" | "alt">> = {
  cc1717: {
    id: "cotton",
    title: "heavyweight, garment-dyed",
    body: "6.1 oz, 100% ring-spun US cotton, dyed after it's sewn. it feels lived-in from day one, and no two come out exactly alike.",
    spec: "Comfort Colors 1717 · twill-taped shoulders · double-needle hems",
    mockup: true,
  },
  cc3023cl: {
    id: "cotton",
    title: "heavyweight, garment-dyed",
    body: "the same 6.1 oz, 100% ring-spun US cotton, dyed after it's sewn, in a boxy, mid-length cut.",
    spec: "Comfort Colors 3023CL · shoulder-to-shoulder tape · double-needle hems",
    mockup: true,
  },
  cc9360: {
    id: "cotton",
    title: "heavyweight, garment-dyed",
    body: "6.1 oz, 100% ring-spun US cotton, dyed after it's sewn. soft-washed, with the neck and armholes bound in the same fabric.",
    spec: "Comfort Colors 9360 · bound neck and armholes · double-needle hems",
    mockup: true,
  },
  as4063g: {
    id: "cotton",
    title: "organic rib",
    body: "a heavy 2x2 rib knit, 95% organic cotton and 5% spandex, so it stretches with you. preshrunk, slim fit.",
    spec: "AS Colour 4063G · 330 gsm · wide self-fabric binding",
    mockup: true,
  },
};

// Print: STATUS.md "DTF transfer fixes" (Apliiq prints these blanks by transfer (DTF), 100% opacity, details >= ~1.4 mm).
const PRINT: Omit<CloserLookTile, "file" | "alt"> = {
  id: "print",
  title: "a print that holds its lines",
  body: "printed by DTF transfer in solid, full-opacity ink. we thickened the finest lines and dots in every design so nothing gets lost.",
  spec: "DTF transfer · details 1 mm and up",
  mockup: true,
};

const slug = (productId: string) => productId.replace(/^merch-/, "");

/** Tiles for one product page (empty for products outside the launch line). */
export function closerLookFor(productId: string, title: string): CloserLookTile[] {
  const p = PRODUCTS[productId];
  if (!p) return [];
  const s = slug(productId);
  return [
    ...(p.label ? [{ ...LABEL, file: "label" }] : []),
    { ...COTTON[p.garment], file: `cotton-${s}`, alt: `Close-up of the ${title}: the ${p.garment === "as4063g" ? "rib knit" : "collar and garment-dyed cotton"}` },
    { ...PRINT, file: `print-${s}`, alt: `Close-up of the ${title} print on the fabric` },
  ];
}

/** Tiles for the shop page: the label, the tee cotton and a print, all shown on the Heartbeat Triangle Tee. */
export function closerLookShop(): CloserLookTile[] {
  return [
    { ...LABEL, file: "label" },
    { ...COTTON.cc1717, spec: "Comfort Colors 1717 tees · 9360 tank · 3023CL boxy tees", file: "cotton-heartbeat-triangle-tee", alt: "Close-up of the Heartbeat Triangle Tee collar and garment-dyed cotton" },
    { ...PRINT, file: "print-heartbeat-triangle-tee", alt: "Close-up of the Heartbeat Triangle print, its fine lines and dots on violet cotton" },
  ];
}

export const closerLookSrc = (file: string, width: number, ext: "webp" | "avif") => `${CLOSER_LOOK_DIR}/${file}-${width}.${ext}`;
