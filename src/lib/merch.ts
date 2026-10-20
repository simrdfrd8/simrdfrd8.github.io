/**
 * Merch v2 views: each colorway can carry front, back, model-front and model-back images.
 * - The thumbnail / swatch is always the front.
 * - Back is per colorway only (a back shot of another colour would be misleading).
 * - Model shots fall back to the hero colorway's when a colorway has none (model photos are usually shot in one colour).
 * Pure function so it can be unit tested without the catalog.
 */
export type ColorwayRef = { name: string; slug: string; assetId: string; backAssetId?: string; modelFrontAssetId?: string; modelBackAssetId?: string };
export type ViewKind = "front" | "back" | "model-front" | "model-back";
export type ResolvedView = { kind: ViewKind; assetId: string; label: string; fromHero: boolean };

export const VIEW_LABEL: Record<ViewKind, string> = { front: "Front", back: "Back", "model-front": "On model", "model-back": "On model (back)" };

export function heroColorwayOf<T extends ColorwayRef>(colorways: T[], heroSlug?: string): T | undefined {
  return colorways.find((c) => c.slug === heroSlug) ?? colorways.find((c) => c.modelFrontAssetId || c.modelBackAssetId) ?? colorways[0];
}

export function resolveViews(colorways: ColorwayRef[], heroSlug: string | undefined, exists: (id: string) => boolean = () => true): ResolvedView[][] {
  const hero = heroColorwayOf(colorways, heroSlug);
  return colorways.map((c) => {
    const ok = (id?: string): id is string => !!id && exists(id);
    const out: ResolvedView[] = [];
    if (ok(c.assetId)) out.push({ kind: "front", assetId: c.assetId, label: VIEW_LABEL.front, fromHero: false });
    if (ok(c.backAssetId)) out.push({ kind: "back", assetId: c.backAssetId, label: VIEW_LABEL.back, fromHero: false });
    for (const [kind, key] of [["model-front", "modelFrontAssetId"], ["model-back", "modelBackAssetId"]] as const) {
      const own = c[key];
      const fallback = hero && hero !== c ? hero[key] : undefined;
      if (ok(own)) out.push({ kind, assetId: own, label: VIEW_LABEL[kind], fromHero: false });
      else if (ok(fallback)) out.push({ kind, assetId: fallback, label: `${VIEW_LABEL[kind]} · shown in ${hero!.name}`, fromHero: true });
    }
    return out;
  });
}
