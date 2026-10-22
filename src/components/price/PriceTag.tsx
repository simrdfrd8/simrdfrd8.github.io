"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { formatCents, priceView, saleActive, type Sale } from "@/lib/pricing";

/**
 * The one customer price tag (shop cards, product pages, bundles). On sale: the original price struck through, the new price
 * beside it in Coral Heat, and a small "−20%" (or "Save $12") pill. Screen readers hear only "Was $30, now $24".
 * Sale windows: the first render uses the build time (no hydration mismatch); the browser then re-checks with the real time,
 * so a sale that ended after the build stops showing.
 */
export function PriceTag({
  price,
  sale,
  was,
  builtAt,
  size = "sm",
  badge = "pct",
  prefix,
  className,
}: {
  /** regular price (or the bundle price) in cents */
  price: number;
  /** a sale on a single item */
  sale?: Sale | null;
  /** bundles: the included items' total, struck through */
  was?: number | null;
  builtAt: number;
  size?: "sm" | "lg";
  badge?: "pct" | "save" | "none";
  prefix?: string;
  className?: string;
}) {
  const [at, setAt] = useState(builtAt);
  useEffect(() => setAt(Date.now()), []);
  const v = sale && saleActive(price, sale, at) ? priceView(sale.price_cents, price) : priceView(price, was ?? null);
  const pill = v.onSale && badge !== "none" ? (badge === "save" ? `Save ${formatCents(v.was! - v.now)}` : `−${v.savePct}%`) : null;
  return (
    <p className={clsx("price-tag", className)} data-price-tag data-on-sale={v.onSale ? "true" : "false"}>
      <span className="sr-only">{prefix ? `${prefix} ` : ""}{v.srLabel}</span>
      <span aria-hidden="true" className={clsx("flex flex-wrap items-baseline tabular-nums", size === "lg" ? "gap-x-3 gap-y-1" : "gap-x-2 gap-y-0.5")}>
        {prefix && <span className="text-sm text-muted">{prefix}</span>}
        {v.wasLabel && (
          <s data-was className={clsx("text-muted decoration-[var(--fm-hiphop)] decoration-2", size === "lg" ? "text-xl" : "text-sm")}>
            {v.wasLabel}
          </s>
        )}
        <span data-now className={clsx("font-extrabold tracking-tight", v.onSale ? "text-[var(--fm-hiphop-text)]" : "text-cream", size === "lg" ? "text-[2rem] leading-none" : "text-lg leading-tight")}>
          {v.nowLabel}
        </span>
        {pill && (
          <span data-pill className={clsx("kicker self-center rounded-full bg-[var(--fm-hiphop)] px-2 py-0.5 font-bold text-[var(--fm-hiphop-on)]", size === "lg" ? "!text-[0.75rem]" : "!text-[0.62rem]")}>
            {pill}
          </span>
        )}
      </span>
    </p>
  );
}
