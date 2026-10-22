/**
 * Merch v2 views: each colorway can carry front, back, model-front and model-back images.
 * - With `models` (one man, one woman): exactly front, back, man front, man back, woman front, woman back.
 * - The thumbnail / swatch is always the front.
 * - Back is per colorway only (a back shot of another colour would be misleading).
 * - Model shots fall back to the hero colorway's when a colorway has none (model photos are usually shot in one colour).
 * Pure function so it can be unit tested without the catalog.
 */
/** One person wearing the colorway: front + back (+ blank-back variant when the product offers a blank back). */
export type ColorwayModel = { gender: "male" | "female"; frontAssetId: string; backAssetId: string; blankBackAssetId?: string };
export type ColorwayRef = { name: string; slug: string; assetId: string; backAssetId?: string; modelFrontAssetId?: string; modelBackAssetId?: string; blankBackAssetId?: string; blankModelBackAssetId?: string; modelExtras?: { assetId: string; side: "front" | "back" }[]; models?: ColorwayModel[] };
export type ViewKind = "front" | "back" | "model-front" | "model-back" | "model-front-extra" | "model-back-extra";
/** key: unique within the colorway (extras share a kind, so their key carries the asset id). */
export type ResolvedView = { kind: ViewKind; assetId: string; label: string; fromHero: boolean; key?: string };

export const VIEW_LABEL: Record<ViewKind, string> = { front: "Front", back: "Back", "model-front": "On model (front)", "model-back": "On model (back)", "model-front-extra": "On model (front)", "model-back-extra": "On model (back)" };

/** Uniform gallery order: men first, then women ("front, back, then 2 models front/back, m/f"). */
const GENDER_ORDER = { male: 0, female: 1 } as const;
export const orderedModels = (models: ColorwayModel[] = []) => [...models].sort((a, b) => GENDER_ORDER[a.gender] - GENDER_ORDER[b.gender]);

/** Extra on-model shots (more people in the same colorway): product page only, never on the shop card. */
export const isExtraView = (kind: string) => kind.endsWith("-extra");

/**
 * "Back: Blank" option: the same view set with the back and model-back swapped for the blank-back shots.
 * Returns undefined when the colorway has no blank-back option (no back choice is shown then).
 */
export function blankBackViews(c: ColorwayRef, views: ResolvedView[], exists: (id: string) => boolean = () => true): ResolvedView[] | undefined {
  const back = c.blankBackAssetId && exists(c.blankBackAssetId) ? c.blankBackAssetId : undefined;
  if (c.models?.length) {
    // per-person blank backs (matched by the printed back's asset id)
    const blankOf = new Map(c.models.filter((m) => m.blankBackAssetId && exists(m.blankBackAssetId)).map((m) => [m.backAssetId, m.blankBackAssetId!]));
    if (!back && !blankOf.size) return undefined;
    return views.map((v) =>
      v.kind === "back" && back ? { ...v, assetId: back, fromHero: false } : v.kind === "model-back" && blankOf.has(v.assetId) ? { ...v, assetId: blankOf.get(v.assetId)!, fromHero: false } : v,
    );
  }
  const mback = c.blankModelBackAssetId && exists(c.blankModelBackAssetId) ? c.blankModelBackAssetId : undefined;
  if (!back && !mback) return undefined;
  return views.map((v) =>
    v.kind === "back" && back ? { ...v, assetId: back, fromHero: false } : v.kind === "model-back" && mback ? { ...v, assetId: mback, label: VIEW_LABEL["model-back"], fromHero: false } : v,
  );
}

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
    if (c.models?.length) {
      // uniform 6-image set: front, back, then each person's front + back (men first). Older single-model fields and extras are not shown.
      for (const m of orderedModels(c.models)) {
        if (ok(m.frontAssetId)) out.push({ kind: "model-front", assetId: m.frontAssetId, label: VIEW_LABEL["model-front"], fromHero: false, key: `model-front:${m.gender}` });
        if (ok(m.backAssetId)) out.push({ kind: "model-back", assetId: m.backAssetId, label: VIEW_LABEL["model-back"], fromHero: false, key: `model-back:${m.gender}` });
      }
      return out;
    }
    for (const [kind, key] of [["model-front", "modelFrontAssetId"], ["model-back", "modelBackAssetId"]] as const) {
      const own = c[key];
      const fallback = hero && hero !== c ? hero[key] : undefined;
      if (ok(own)) out.push({ kind, assetId: own, label: VIEW_LABEL[kind], fromHero: false });
      else if (ok(fallback)) out.push({ kind, assetId: fallback, label: `${VIEW_LABEL[kind]} · shown in ${hero!.name}`, fromHero: true });
    }
    for (const x of c.modelExtras ?? []) {
      const kind = x.side === "front" ? "model-front-extra" : "model-back-extra";
      if (ok(x.assetId)) out.push({ kind, assetId: x.assetId, label: VIEW_LABEL[kind], fromHero: false, key: `${kind}:${x.assetId}` });
    }
    return out;
  });
}
