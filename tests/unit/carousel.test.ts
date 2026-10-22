import { describe, expect, it } from "vitest";
import { clampIndex, dotWindow, indexAfterDrag, indexForKey, indexFromScroll, isDrag, renderedCount } from "@/lib/carousel";
import { cardSlides, colorwayAt, colorwayFromHash, firstSlideOf, pageSlides, type SlideColorwayLike } from "@/lib/merch-slides";

describe("carousel logic", () => {
  it("maps scroll position to the snapped slide, clamped", () => {
    expect(indexFromScroll(0, 390, 5)).toBe(0);
    expect(indexFromScroll(390, 390, 5)).toBe(1);
    expect(indexFromScroll(390 * 1.49, 390, 5)).toBe(1);
    expect(indexFromScroll(390 * 1.51, 390, 5)).toBe(2);
    expect(indexFromScroll(99999, 390, 5)).toBe(4);
    expect(indexFromScroll(-20, 390, 5)).toBe(0);
    expect(indexFromScroll(100, 0, 5)).toBe(0); // not laid out yet
    expect(clampIndex(3, 0)).toBe(0);
  });

  it("keyboard: arrows step without wrapping, Home/End jump, other keys ignored", () => {
    expect(indexForKey("ArrowRight", 0, 4)).toBe(1);
    expect(indexForKey("ArrowRight", 3, 4)).toBe(3);
    expect(indexForKey("ArrowLeft", 0, 4)).toBe(0);
    expect(indexForKey("ArrowLeft", 2, 4)).toBe(1);
    expect(indexForKey("Home", 3, 4)).toBe(0);
    expect(indexForKey("End", 0, 4)).toBe(3);
    expect(indexForKey("ArrowDown", 1, 4)).toBeNull(); // vertical keys keep scrolling the page
    expect(indexForKey("ArrowRight", 0, 1)).toBeNull();
  });

  it("mouse drag: flick moves one slide, long drag lands on the nearest, tiny moves stay", () => {
    expect(indexAfterDrag(1, -50, 300, 5)).toBe(2);
    expect(indexAfterDrag(1, 50, 300, 5)).toBe(0);
    expect(indexAfterDrag(1, -20, 300, 5)).toBe(1);
    expect(indexAfterDrag(0, -700, 300, 5)).toBe(2);
    expect(indexAfterDrag(4, -500, 300, 5)).toBe(4);
    expect(indexAfterDrag(0, 80, 300, 5)).toBe(0);
    expect(isDrag(3, 2)).toBe(false);
    expect(isDrag(12, 0)).toBe(true);
  });

  it("only renders images up to one past the furthest slide seen", () => {
    expect(renderedCount(0, 8)).toBe(2);
    expect(renderedCount(3, 8)).toBe(5);
    expect(renderedCount(7, 8)).toBe(8);
    expect(renderedCount(0, 1)).toBe(1);
  });

  it("dot window shows every dot for short strips and a sliding window for long ones", () => {
    expect(dotWindow(2, 5)).toEqual([0, 4]);
    expect(dotWindow(0, 12)).toEqual([0, 6]);
    expect(dotWindow(6, 12)).toEqual([3, 9]);
    expect(dotWindow(11, 12)).toEqual([5, 11]);
  });
});

type A = { id: string };
const v = (c: string, kind: string, fromHero = false, id = `${c}-${kind}`) => ({ kind, label: kind, asset: { id }, fromHero });
const cw = (slug: string, views: ReturnType<typeof v>[], blank?: ReturnType<typeof v>[]): SlideColorwayLike<A> => ({
  name: slug.toUpperCase(),
  slug,
  asset: { id: `${slug}-front` },
  views,
  blankViews: blank,
});
const hero = cw(
  "navy",
  [v("navy", "front"), v("navy", "back"), v("navy", "model-front"), v("navy", "model-back")],
  [v("navy", "front"), v("navy", "back", false, "navy-back-blank"), v("navy", "model-front"), v("navy", "model-back", false, "navy-model-back-blank")],
);
const second = cw("ivory", [v("ivory", "front"), v("ivory", "back"), v("navy", "model-front", true), v("navy", "model-back", true)]);
const third = cw("plum", [v("plum", "front"), v("plum", "back"), v("plum", "model-front"), v("plum", "model-back")]);

describe("merch slides + colorway sync", () => {
  it("card: hero views first (front flat = thumbnail), then the other colorways' fronts", () => {
    const s = cardSlides([hero, second, third]);
    expect(s.map((x) => x.asset.id)).toEqual(["navy-front", "navy-back", "navy-model-front", "navy-model-back", "ivory-front", "plum-front"]);
    expect(s.map((x) => x.colorway)).toEqual([0, 0, 0, 0, 1, 2]);
    expect(cardSlides([])).toEqual([]);
    // a colorway with no view set still shows its front
    expect(cardSlides([{ name: "X", slug: "x", asset: { id: "x" } }]).map((x) => x.asset.id)).toEqual(["x"]);
  });

  it("page: every colorway's views in order, borrowed hero model shots not repeated, extras last", () => {
    const s = pageSlides([hero, second, third], [{ id: "photo" }]);
    expect(s.map((x) => x.asset.id)).toEqual([
      "navy-front",
      "navy-back",
      "navy-model-front",
      "navy-model-back",
      "ivory-front",
      "ivory-back",
      "plum-front",
      "plum-back",
      "plum-model-front",
      "plum-model-back",
      "photo",
    ]);
    expect(new Set(s.map((x) => x.key)).size).toBe(s.length);
  });

  it("swiping into a colorway selects it; extras keep the previous colorway", () => {
    const s = pageSlides([hero, second, third], [{ id: "photo" }]);
    expect(colorwayAt(s, 0, 0)).toBe(0);
    expect(colorwayAt(s, 3, 0)).toBe(0);
    expect(colorwayAt(s, 4, 0)).toBe(1);
    expect(colorwayAt(s, 7, 1)).toBe(2);
    expect(colorwayAt(s, 10, 2)).toBe(2);
    expect(colorwayAt(s, 99, 1)).toBe(1);
  });

  it("tapping a swatch scrolls to that colorway's front", () => {
    const s = pageSlides([hero, second, third]);
    expect([0, 1, 2].map((c) => firstSlideOf(s, c))).toEqual([0, 4, 6]);
    expect(s[firstSlideOf(s, 2)].view?.kind).toBe("front");
    expect(firstSlideOf(s, 9)).toBe(-1);
  });

  it("blank back swaps the back shots in place (same slide count and positions)", () => {
    const printed = pageSlides([hero, second, third]);
    const blank = pageSlides([hero, second, third], [], true);
    expect(blank.length).toBe(printed.length);
    expect(blank.map((x) => x.key)).toEqual(printed.map((x) => x.key));
    expect(blank[1].asset.id).toBe("navy-back-blank");
    expect(blank[3].asset.id).toBe("navy-model-back-blank");
    expect(blank[5].asset.id).toBe("ivory-back"); // colorways without a blank option keep their printed back
  });

  it("shop card links open the product on the colorway that was showing", () => {
    const list = [hero, second, third];
    expect(colorwayFromHash("#cw-ivory", list)).toBe(1);
    expect(colorwayFromHash("cw-plum", list)).toBe(2);
    expect(colorwayFromHash("#cw-nope", list)).toBe(-1);
    expect(colorwayFromHash("", list)).toBe(-1);
  });
});

describe("extra on-model shots", () => {
  const xv = (kind: string, id: string) => ({ ...v("sun", kind, false, id), key: `${kind}:${id}` });
  const withExtras = cw("sun", [
    v("sun", "front"),
    v("sun", "back"),
    v("sun", "model-front"),
    v("sun", "model-back"),
    xv("model-front-extra", "sun-model-front-2"),
    xv("model-front-extra", "sun-model-front-3"),
    xv("model-back-extra", "sun-model-back-2"),
  ]);
  it("show on the product page after the main shots, with unique keys", () => {
    const s = pageSlides([withExtras, third]);
    expect(s.map((x) => x.asset.id).slice(0, 7)).toEqual(["sun-front", "sun-back", "sun-model-front", "sun-model-back", "sun-model-front-2", "sun-model-front-3", "sun-model-back-2"]);
    expect(new Set(s.map((x) => x.key)).size).toBe(s.length);
    expect(firstSlideOf(s, 1)).toBe(7);
  });
  it("stay off the shop card", () => {
    expect(cardSlides([withExtras, third]).map((x) => x.asset.id)).toEqual(["sun-front", "sun-back", "sun-model-front", "sun-model-back", "plum-front"]);
  });
});
