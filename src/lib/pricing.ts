/**
 * Customer-side money helpers (integer cents). Same rules as the accounts Worker's src/pricing.js:
 * - a sale shows only when it is below the regular price and inside its optional window;
 * - bundle prices are allocated across items pro rata by original price, rounding remainder on the last line;
 * - sales tax is computed on what is actually CHARGED (after sale prices and bundle allocation), never on list prices.
 * Merch checkout is OFF (seller's permit pending): nothing here charges anyone.
 */
export type Sale = { price_cents: number; starts_at: number | null; ends_at: number | null };

export const formatCents = (c: number) => `$${(c / 100).toFixed(2).replace(/\.00$/, "")}`;

export function saleActive(price: number | null, sale: Sale | null | undefined, at: number): sale is Sale {
  if (price == null || !sale || sale.price_cents >= price) return false;
  if (sale.starts_at != null && at < sale.starts_at) return false;
  if (sale.ends_at != null && at >= sale.ends_at) return false;
  return true;
}

export type PriceView = { now: number; was: number | null; onSale: boolean; nowLabel: string; wasLabel: string | null; savePct: number | null; srLabel: string };
/** What a price tag says. `was` is the struck-through original (sale) or the items' total (bundle). */
export function priceView(price: number, was: number | null): PriceView {
  const onSale = was != null && was > price;
  const nowLabel = formatCents(price), wasLabel = onSale ? formatCents(was!) : null;
  return { now: price, was: onSale ? was : null, onSale, nowLabel, wasLabel, savePct: onSale ? Math.round(((was! - price) / was!) * 100) : null, srLabel: onSale ? `Was ${wasLabel}, now ${nowLabel}` : `Price ${nowLabel}` };
}

/** Split `total` cents pro rata by `weights`; floors each share and puts the rounding remainder on the LAST line. */
export function allocate(total: number, weights: number[]): number[] {
  if (!Number.isInteger(total) || total < 0) throw new Error("allocate: total must be a non-negative integer (cents)");
  if (!weights.length) return [];
  if (weights.some((w) => !Number.isInteger(w) || w < 0)) throw new Error("allocate: weights must be non-negative integers");
  const sum = weights.reduce((a, b) => a + b, 0);
  const ws = sum === 0 ? weights.map(() => 1) : weights, den = sum === 0 ? weights.length : sum;
  const out = ws.map((w) => Math.floor((total * w) / den));
  out[out.length - 1] += total - out.reduce((a, b) => a + b, 0);
  return out;
}

const mulPpm = (cents: number, ppm: number) => Math.floor((cents * ppm + 500_000) / 1_000_000);

/**
 * Tax on charged amounts. ratePpm = rate in millionths (9.25 % = 92500). Order tax = round_half_up(sum(charged) * rate),
 * spread back over the lines with allocate() so line taxes add up exactly. Shipping is taxed only if shippingTaxable.
 */
export function taxOnCharged(lines: { charged_cents: number; taxable?: boolean }[], ratePpm: number, opts: { shippingCents?: number; shippingTaxable?: boolean } = {}) {
  const { shippingCents = 0, shippingTaxable = false } = opts;
  if (!Number.isInteger(ratePpm) || ratePpm < 0 || ratePpm > 300_000) throw new Error("taxOnCharged: ratePpm out of range");
  const taxable = lines.map((l) => (l.taxable === false ? 0 : l.charged_cents));
  if (taxable.some((c) => !Number.isInteger(c) || c < 0)) throw new Error("taxOnCharged: charged_cents must be non-negative integers");
  const base = taxable.reduce((a, b) => a + b, 0) + (shippingTaxable ? shippingCents : 0);
  const total = mulPpm(base, ratePpm);
  const weights = shippingTaxable ? [...taxable, shippingCents] : taxable;
  const parts = base === 0 ? weights.map(() => 0) : allocate(total, weights);
  return { base_cents: base, tax_cents: total, line_tax_cents: parts.slice(0, lines.length), shipping_tax_cents: shippingTaxable ? parts[lines.length] ?? 0 : 0 };
}

export type OrderLine = { product_id: string; colorway: string; qty: number; unit_original_cents: number; original_cents: number; discount_cents: number; charged_cents: number; bundle_id: string | null; allocated_cents: number | null; tax_cents: number };
/** Lines for one bundle: each item's share of the bundle price (books + returns), original/discount/charged per line. */
export function bundleLines(bundleId: string, priceCents: number, items: { product_id: string; colorway?: string; qty: number; unit_original_cents: number }[]): OrderLine[] {
  const originals = items.map((i) => i.unit_original_cents * i.qty);
  const shares = allocate(priceCents, originals);
  return items.map((i, k) => ({ product_id: i.product_id, colorway: i.colorway ?? "", qty: i.qty, unit_original_cents: i.unit_original_cents, original_cents: originals[k], discount_cents: originals[k] - shares[k], charged_cents: shares[k], bundle_id: bundleId, allocated_cents: shares[k], tax_cents: 0 }));
}
