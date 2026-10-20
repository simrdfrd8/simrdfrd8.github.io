"use client";

import clsx from "clsx";
import type { Product } from "@/lib/catalog/schema";
import { buttonClass, Heart } from "./ui";
import { track } from "@/lib/analytics";
import { CHECKOUT_LIVE } from "@/lib/env";

type Props = {
  product: Pick<Product, "id" | "title" | "type" | "price" | "currency" | "payWhatYouWant" | "status" | "checkoutProvider" | "checkoutUrl">;
  priceLabel: string;
  label?: string;
  variant?: "primary" | "accent" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  amount?: number;
};

/** Checkout links render only when NEXT_PUBLIC_CHECKOUT_LIVE=1 at build time (see lib/env). */
const LIVE = CHECKOUT_LIVE;

export function defaultLabel(p: Props["product"]) {
  if (p.status === "upcoming") return "Notify me";
  if (p.price === null) return p.type === "license" ? "Request license" : "Get a quote";
  return { download: "Own the WAV", stems: "Get the stems", license: "License", print: "Buy print", "digital-art": "Buy", "sample-pack": "Buy pack", service: "Book", merch: "Buy", support: "Support" }[p.type];
}

/**
 * One abstraction for every purchase button.
 *  - inquiry products (price null / provider none) → contact form, prefilled
 *  - live + checkoutUrl → Payhip / Ko-fi / Stripe link (opens provider checkout)
 *  - otherwise → a disabled "Coming soon" button. Nothing links to a provider until checkout is switched on.
 */
export function CheckoutButton({ product, priceLabel, label, variant = "primary", size = "md", className }: Props) {
  const text = label ?? defaultLabel(product);
  const icon = product.type === "support" ? <Heart /> : null;
  const cls = clsx(buttonClass(variant, size), className);

  if (product.status === "available" && (product.price === null || product.checkoutProvider === "none")) {
    const type = product.type === "license" ? "licensing" : product.type === "service" ? "service" : "business";
    return (
      <a href={`/contact/?type=${type}&ref=${product.id}`} className={cls} onClick={() => track("inquiry_click", { product: product.id })}>
        {text}
      </a>
    );
  }
  if (LIVE && product.status === "available" && product.checkoutUrl) {
    return (
      <a href={product.checkoutUrl} target="_blank" rel="noopener noreferrer" className={cls} onClick={() => track("checkout_click", { product: product.id, provider: product.checkoutProvider })}>
        {icon}
        {text}
      </a>
    );
  }
  return (
    <button type="button" className={clsx(cls, "cursor-not-allowed opacity-60")} data-checkout="coming-soon" disabled aria-label={`${product.title} (${priceLabel}): coming soon`}>
      {icon}
      Coming soon
    </button>
  );
}
