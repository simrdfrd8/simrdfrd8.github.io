/**
 * Slide lists for the merch swipe galleries. Generic over the asset type so the logic is unit tested without the catalog
 * (tests/unit/carousel.test.ts).
 *
 *  - Card (shop grid): the hero colorway's views in order (front flat first = the thumbnail, back, model front, model back),
 *    then every other colorway's front. Extra on-model shots (more people) stay on the product page.
 *  - Product page: every colorway's views in order, then extra photos. Model shots borrowed from the hero colorway
 *    (fromHero) are skipped for the other colorways, so the same photo never repeats. Each slide knows its colorway, so
 *    swiping into a colorway selects it (and tapping a swatch scrolls to that colorway's first slide).
 */
export type SlideViewLike<A> = { kind: string; label: string; asset: A; fromHero: boolean; key?: string };
export type SlideColorwayLike<A> = { name: string; slug: string; asset: A; views?: SlideViewLike<A>[]; blankViews?: SlideViewLike<A>[] };
export type MerchSlide<A> = { key: string; asset: A; colorway: number | null; view?: SlideViewLike<A> };

const viewsOf = <A>(c: SlideColorwayLike<A>, blank: boolean): SlideViewLike<A>[] => {
  const v = blank && c.blankViews?.length ? c.blankViews : c.views;
  return v?.length ? v : [{ kind: "front", label: "Front", asset: c.asset, fromHero: false }];
};

export function cardSlides<A>(colorways: SlideColorwayLike<A>[]): MerchSlide<A>[] {
  if (!colorways.length) return [];
  const [hero, ...rest] = colorways;
  return [
    ...viewsOf(hero, false)
      .filter((v) => !v.kind.endsWith("-extra"))
      .map((v) => ({ key: `${hero.slug}:${v.key ?? v.kind}`, asset: v.asset, colorway: 0, view: v })),
    ...rest.map((c, i) => ({ key: `${c.slug}:front`, asset: c.asset, colorway: i + 1, view: { kind: "front", label: "Front", asset: c.asset, fromHero: false } })),
  ];
}

export function pageSlides<A>(colorways: SlideColorwayLike<A>[], extras: A[] = [], blank = false, extraKey: (a: A, i: number) => string = (_, i) => `extra:${i}`): MerchSlide<A>[] {
  return [
    ...colorways.flatMap((c, ci) =>
      viewsOf(c, blank)
        .filter((v) => ci === 0 || !v.fromHero)
        .map((v) => ({ key: `${c.slug}:${v.key ?? v.kind}`, asset: v.asset, colorway: ci, view: v })),
    ),
    ...extras.map((a, i) => ({ key: extraKey(a, i), asset: a, colorway: null })),
  ];
}

/** Colorway shown at slide i; extra photos keep whatever colorway was selected before. */
export const colorwayAt = <A>(slides: MerchSlide<A>[], i: number, previous: number): number => slides[i]?.colorway ?? previous;

/** First slide of a colorway (where a swatch tap scrolls to); -1 if it has none. */
export const firstSlideOf = <A>(slides: MerchSlide<A>[], colorway: number): number => slides.findIndex((s) => s.colorway === colorway);

/** Colorway index from a "#cw-<slug>" link (the shop card links straight to the colorway the shopper swiped to). */
export function colorwayFromHash(hash: string, colorways: { slug: string }[]): number {
  const m = /^#?cw-(.+)$/.exec(hash);
  if (!m) return -1;
  return colorways.findIndex((c) => c.slug === decodeURIComponent(m[1]));
}
