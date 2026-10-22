import { describe, expect, it } from "vitest";
import { allocate, bundleLines, formatCents, priceView, saleActive, taxOnCharged } from "@/lib/pricing";

describe("price display", () => {
  it("formats cents", () => {
    expect(formatCents(3000)).toBe("$30");
    expect(formatCents(2499)).toBe("$24.99");
    expect(formatCents(5)).toBe("$0.05");
  });
  it("a sale reads 'Was $X, now $Y' and shows the % off", () => {
    const v = priceView(2400, 3000);
    expect(v).toMatchObject({ onSale: true, wasLabel: "$30", nowLabel: "$24", savePct: 20, srLabel: "Was $30, now $24" });
    expect(priceView(3000, null)).toMatchObject({ onSale: false, wasLabel: null, srLabel: "Price $30" });
    expect(priceView(3000, 3000).onSale).toBe(false); // no fake strike-through
  });
  it("sale windows", () => {
    const s = { price_cents: 2000, starts_at: 1000, ends_at: 2000 };
    expect(saleActive(3000, s, 999)).toBe(false);
    expect(saleActive(3000, s, 1000)).toBe(true);
    expect(saleActive(3000, s, 2000)).toBe(false);
    expect(saleActive(3000, { price_cents: 3000, starts_at: null, ends_at: null }, 0)).toBe(false);
    expect(saleActive(null, s, 1500)).toBe(false);
  });
});

describe("bundle allocation", () => {
  it("pro rata by original price, rounding remainder on the last line", () => {
    expect(allocate(7000, [3000, 2800, 3000])).toEqual([2386, 2227, 2387]);
    expect(allocate(100, [1, 1, 1])).toEqual([33, 33, 34]);
    expect(allocate(0, [10, 20])).toEqual([0, 0]);
    expect(allocate(10, [0, 0])).toEqual([5, 5]);
    for (const [t, w] of [[9999, [1234, 5678, 91]], [1, [3, 3, 3]], [50000, [100, 100, 100, 100, 100, 100, 100]]] as const) expect(allocate(t, [...w]).reduce((a, b) => a + b, 0)).toBe(t);
  });
  it("rejects non-integer money", () => {
    expect(() => allocate(10.5, [1])).toThrow();
    expect(() => allocate(10, [1.5])).toThrow();
  });
  it("bundle lines carry original, discount, charged and the allocated share", () => {
    const lines = bundleLines("b1", 7000, [
      { product_id: "merch-a", qty: 1, unit_original_cents: 3000 },
      { product_id: "merch-b", colorway: "white-navy", qty: 1, unit_original_cents: 2800 },
      { product_id: "merch-c", qty: 1, unit_original_cents: 3000 },
    ]);
    expect(lines.map((l) => l.charged_cents)).toEqual([2386, 2227, 2387]);
    expect(lines.every((l) => l.original_cents - l.discount_cents === l.charged_cents && l.allocated_cents === l.charged_cents && l.bundle_id === "b1")).toBe(true);
    expect(lines.reduce((a, l) => a + l.discount_cents, 0)).toBe(8800 - 7000);
  });
});

describe("sales tax on the charged amount", () => {
  it("taxes sale and bundle prices, not list prices", () => {
    // $30 tee on sale for $24 + a $70 bundle (list $88) at 9.25 %
    const lines = [{ charged_cents: 2400 }, ...bundleLines("b1", 7000, [{ product_id: "a", qty: 1, unit_original_cents: 3000 }, { product_id: "b", qty: 1, unit_original_cents: 2800 }, { product_id: "c", qty: 1, unit_original_cents: 3000 }])];
    const t = taxOnCharged(lines, 92500);
    expect(t.base_cents).toBe(9400);
    expect(t.tax_cents).toBe(870); // 9400 * 0.0925 = 869.5 -> 870 (half up)
    expect(t.line_tax_cents.reduce((a, b) => a + b, 0)).toBe(870);
    expect(taxOnCharged([{ charged_cents: 11800 }], 92500).tax_cents).not.toBe(t.tax_cents); // list price would be wrong
  });
  it("rounds half up, skips non-taxable lines, shipping only when taxable", () => {
    expect(taxOnCharged([{ charged_cents: 1000 }], 72500).tax_cents).toBe(73); // 72.5 -> 73
    expect(taxOnCharged([{ charged_cents: 1000 }, { charged_cents: 500, taxable: false }], 100000).line_tax_cents).toEqual([100, 0]);
    expect(taxOnCharged([{ charged_cents: 1000 }], 100000, { shippingCents: 500 }).tax_cents).toBe(100);
    const s = taxOnCharged([{ charged_cents: 1000 }], 100000, { shippingCents: 500, shippingTaxable: true });
    expect([s.tax_cents, s.shipping_tax_cents]).toEqual([150, 50]);
    expect(taxOnCharged([], 92500).tax_cents).toBe(0);
    expect(() => taxOnCharged([{ charged_cents: 1 }], 9.25)).toThrow();
  });
});
