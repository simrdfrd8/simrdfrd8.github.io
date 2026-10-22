/**
 * Merch v2 views: each colorway can carry front, back, model-front and model-back images.
 * - With `models`: exactly front, back, then ONE model's front + back, picked by the product category (pickModel).
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

/** Shop category (Men / Women tab): one per product. Women's cuts are "women"; every other cut (unisex-fit blanks too) is "men". */
export type MerchCategory = "men" | "women";
export const MERCH_CATEGORIES: { id: MerchCategory; label: string }[] = [
  { id: "men", label: "Men" },
  { id: "women", label: "Women" },
];

/**
 * The one model shown for a colorway: men -> the man, women -> the woman. Falls back to whoever is there, so the gallery
 * works with any cast (one person, two, or none).
 */
export function pickModel(models: ColorwayModel[] = [], category: MerchCategory = "men"): ColorwayModel | undefined {
  const want = category === "women" ? "female" : "male";
  return models.find((m) => m.gender === want) ?? models[0];
}

/** Gender order used when listing the whole cast (men first, then women). */
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

export function resolveViews(colorways: ColorwayRef[], heroSlug: string | undefined, exists: (id: string) => boolean = () => true, category: MerchCategory = "men"): ResolvedView[][] {
  const hero = heroColorwayOf(colorways, heroSlug);
  return colorways.map((c) => {
    const ok = (id?: string): id is string => !!id && exists(id);
    const out: ResolvedView[] = [];
    if (ok(c.assetId)) out.push({ kind: "front", assetId: c.assetId, label: VIEW_LABEL.front, fromHero: false });
    if (ok(c.backAssetId)) out.push({ kind: "back", assetId: c.backAssetId, label: VIEW_LABEL.back, fromHero: false });
    if (c.models?.length) {
      // uniform 4-image set: front, back, then one model's front + back. Older single-model fields, extras and the rest of the cast are not shown.
      const m = pickModel(c.models, category);
      if (m && ok(m.frontAssetId)) out.push({ kind: "model-front", assetId: m.frontAssetId, label: VIEW_LABEL["model-front"], fromHero: false });
      if (m && ok(m.backAssetId)) out.push({ kind: "model-back", assetId: m.backAssetId, label: VIEW_LABEL["model-back"], fromHero: false });
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

/** One cut of a design on the All tab: `item` is the product in that cut. */
export type DesignCut<T> = { cut: MerchCategory; label: string; item?: T };
export type MerchDesign<T> = { design: string; cuts: DesignCut<T>[]; defaultCut: MerchCategory };

/** The cut a design card opens on: Men when the design has it, else the first cut it has (Men, Women order). */
export function defaultCutOf<T>(cuts: DesignCut<T>[]): MerchCategory {
  return cuts.find((c) => c.item)?.cut ?? "men";
}

/**
 * All tab: one card per design (products sharing `design`, else their own id), in the order each design first appears.
 * A card lists only the cuts the design comes in (Men, then Women): both cuts -> a Men / Women selector, one cut -> just
 * that one. If two products claim the same design + cut the first wins (validate.ts flags it).
 */
export function groupByDesign<T extends { id: string; design?: string; category: MerchCategory }>(items: T[]): MerchDesign<T>[] {
  const byDesign = new Map<string, Partial<Record<MerchCategory, T>>>();
  for (const p of items) {
    const key = p.design ?? p.id;
    const cuts = byDesign.get(key) ?? {};
    cuts[p.category] ??= p;
    byDesign.set(key, cuts);
  }
  return [...byDesign.entries()].map(([design, have]) => {
    const cuts = MERCH_CATEGORIES.filter((c) => have[c.id]).map((c) => ({ cut: c.id, label: c.label, item: have[c.id] }));
    return { design, cuts, defaultCut: defaultCutOf(cuts) };
  });
}
