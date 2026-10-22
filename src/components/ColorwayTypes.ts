import type { Asset } from "@/lib/catalog/schema";

export type GalleryView = { kind: string; label: string; asset: Asset; fromHero: boolean; key?: string };
/** blankViews: the same views with a blank back (no back print), offered as a separate "Back: Printed / Blank" choice. */
export type ColorwayView = { name: string; slug: string; asset: Asset; swatch?: string; ink?: string; views?: GalleryView[]; blankViews?: GalleryView[] };
