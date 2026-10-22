/**
 * Pure helpers for the swipe galleries (SwipeCarousel, MerchProductGallery). No DOM, so they're unit tested in
 * tests/unit/carousel.test.ts.
 */

export const clampIndex = (i: number, n: number) => (n <= 0 ? 0 : Math.max(0, Math.min(n - 1, Math.round(i))));

/** Which slide is showing for a scroll-snap strip of equal-width slides. */
export function indexFromScroll(scrollLeft: number, slideWidth: number, n: number): number {
  if (!(slideWidth > 0) || n <= 0) return 0;
  return clampIndex(scrollLeft / slideWidth, n);
}

/** Keyboard: arrows step one slide (no wrap), Home / End jump. Returns the new index, or null for other keys. */
export function indexForKey(key: string, i: number, n: number): number | null {
  if (n <= 1) return null;
  switch (key) {
    case "ArrowRight":
      return clampIndex(i + 1, n);
    case "ArrowLeft":
      return clampIndex(i - 1, n);
    case "Home":
      return 0;
    case "End":
      return n - 1;
    default:
      return null;
  }
}

/**
 * Mouse drag on desktop: where to land when the drag ends. A short flick (past `flick` px) moves one slide in the
 * drag direction; a long drag lands on the nearest slide.
 */
export function indexAfterDrag(startIndex: number, dx: number, slideWidth: number, n: number, flick = 40): number {
  if (!(slideWidth > 0)) return clampIndex(startIndex, n);
  const moved = -dx / slideWidth;
  if (Math.abs(moved) >= 0.5) return clampIndex(startIndex + moved, n);
  if (Math.abs(dx) >= flick) return clampIndex(startIndex + (dx < 0 ? 1 : -1), n);
  return clampIndex(startIndex, n);
}

/** A drag longer than this many px is a swipe, not a tap: the click that follows must not open the product. */
export const isDrag = (dx: number, dy = 0, threshold = 6) => Math.hypot(dx, dy) > threshold;

/**
 * Only the slides the shopper can reach soon get a real image: everything up to the furthest slide seen plus `ahead`.
 * Keeps a grid of 14 carousels from loading ~100 images up front.
 */
export const renderedCount = (maxSeen: number, n: number, ahead = 1) => Math.min(n, Math.max(0, maxSeen) + 1 + ahead);

/** Dot strip: at most `max` dots; long strips show a window around the current slide. Returns [first, last] indices shown. */
export function dotWindow(i: number, n: number, max = 7): [number, number] {
  if (n <= max) return [0, n - 1];
  const half = Math.floor(max / 2);
  const first = Math.max(0, Math.min(n - max, i - half));
  return [first, first + max - 1];
}
