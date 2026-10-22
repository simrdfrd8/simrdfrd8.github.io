"use client";

import type { Asset } from "@/lib/catalog/schema";
import { cardSlides, type SlideColorwayLike } from "@/lib/merch-slides";
import { ComingSoonTag, SwipeCarousel } from "./SwipeCarousel";

/**
 * Shop-grid card image: swipe through the hero colorway (front flat first, back, model front, model back), then the other
 * colorways' fronts. Tapping opens the product, on the colorway that was showing.
 */
export function MerchCardCarousel({
  productId,
  title,
  href,
  colorways,
  priority,
  dataAttrs,
}: {
  productId: string;
  title: string;
  href: string;
  colorways: SlideColorwayLike<Asset>[];
  priority?: boolean;
  /** Replaces the default data-card-carousel hook (the All tab's design cards use their own, so test hooks stay unique). */
  dataAttrs?: Record<string, string>;
}) {
  const slides = cardSlides(colorways);
  return (
    <SwipeCarousel
      label={`${title}, ${colorways.length > 1 ? `${colorways.length} colorways` : (colorways[0]?.name ?? "")}`}
      slides={slides.map((s) => ({
        key: s.key,
        asset: s.asset,
        alt: `${title} in ${colorways[s.colorway ?? 0].name}${s.view && s.view.kind !== "front" ? `, ${s.view.label.toLowerCase()}` : ""}`,
      }))}
      hrefFor={(i) => (slides[i]?.colorway ? `${href}#cw-${colorways[slides[i].colorway!].slug}` : href)}
      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
      priority={priority}
      className="aspect-square rounded-2xl ring-1 ring-line"
      overlay={<ComingSoonTag />}
      dataAttrs={dataAttrs ?? { "data-card-carousel": productId }}
    />
  );
}
