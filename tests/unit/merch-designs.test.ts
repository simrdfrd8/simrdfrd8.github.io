import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ProductsFile, AssetsFile } from "@/lib/catalog/schema";
import { visibleProducts } from "@/lib/catalog/filters";
import { validateCatalog } from "@/lib/catalog/validate";
import { defaultCutOf, groupByDesign, type MerchCategory } from "@/lib/merch";

const load = (n: string) => JSON.parse(readFileSync(path.join(__dirname, "../../content", `${n}.json`), "utf8"));
type P = { id: string; design?: string; category: MerchCategory };
const p = (id: string, category: MerchCategory, design?: string): P => ({ id, category, ...(design ? { design } : {}) });
const cutsOf = (d: ReturnType<typeof groupByDesign<P>>[number]) => Object.fromEntries(d.cuts.map((c) => [c.cut, c.item?.id ?? null]));

describe("All tab: one card per design with a Men / Women cut selector (no Unisex)", () => {
  it("groups cuts of the same design, keeps first-appearance order, and lists only the cuts each design has (Men, then Women)", () => {
    const out = groupByDesign([p("tee", "men", "a"), p("solo", "men"), p("tee-w", "women", "a"), p("tank-w", "women", "b")]);
    expect(out.map((d) => d.design)).toEqual(["a", "solo", "b"]);
    expect(out.map((d) => d.cuts.map((c) => c.label))).toEqual([["Men", "Women"], ["Men"], ["Women"]]);
    expect(cutsOf(out[0])).toEqual({ men: "tee", women: "tee-w" });
    expect(cutsOf(out[1])).toEqual({ men: "solo" });
    expect(cutsOf(out[2])).toEqual({ women: "tank-w" });
    for (const d of out) expect(d.cuts.every((c) => c.item)).toBe(true);
  });

  it("opens on Men; a women-only design opens on Women", () => {
    const [a, b] = groupByDesign([p("tee-w", "women", "a"), p("tee", "men", "a"), p("tank-w", "women", "b")]);
    expect(a.defaultCut).toBe("men");
    expect(a.cuts.map((c) => c.cut)).toEqual(["men", "women"]);
    expect(b.defaultCut).toBe("women");
    expect(defaultCutOf([])).toBe("men");
  });

  it("first product wins if two claim the same design and cut", () => {
    const [d] = groupByDesign([p("one", "women", "x"), p("two", "women", "x")]);
    expect(cutsOf(d).women).toBe("one");
  });

  it("the shop line groups by design; the 8 with a women's cut get Men + Women, the rest Men only", () => {
    const products = visibleProducts(ProductsFile.parse(load("products")), "production", AssetsFile.parse(load("assets"))).filter((x) => x.type === "merch" && x.listed && x.shopListed);
    const designs = groupByDesign([...products].sort((x, y) => x.order - y.order));
    expect(designs.map((d) => [d.design, cutsOf(d)])).toEqual([
      ["hotdo-g-g-dog", { men: "merch-hotdo-g-tee-g-dog", women: "merch-hotdo-g-womens-boxy-tee-g-dog" }],
      ["make-art-with-friends", { men: "merch-make-art-with-friends-tee", women: "merch-make-art-with-friends-womens-boxy-tee" }],
      ["feelings-notice", { men: "merch-feelings-notice-tee", women: "merch-feelings-notice-womens-boxy-tee" }],
      ["triangle-surfer", { men: "merch-triangle-surfer-tee" }],
      ["never-ending-set", { men: "merch-never-ending-set-ribbon-tank", women: "merch-never-ending-set-ribbon-womens-tank" }],
      ["melt-wave-inverse", { men: "merch-melt-wave-tee-inverse" }],
      ["paddle-back-round", { men: "merch-paddle-back-round-tank", women: "merch-paddle-back-round-womens-tank" }],
      ["last-one-i-swear", { men: "merch-last-one-i-swear-tank", women: "merch-last-one-i-swear-womens-tank" }],
      ["triangle-surfer-pocket", { men: "merch-triangle-surfer-pocket-tee" }],
      ["here-comes-another-one", { men: "merch-here-comes-another-one-tank", women: "merch-here-comes-another-one-womens-tank" }],
      ["lighthouse-point", { men: "merch-lighthouse-point-tank", women: "merch-lighthouse-point-womens-tank" }],
      ["island-dusk", { men: "merch-island-dusk-hoodie" }],
      ["melt-wave-mirror", { men: "merch-melt-wave-tee" }],
      ["monarch-swell", { men: "merch-monarch-swell-tank", women: "merch-monarch-swell-tank-womens" }],
      ["heartbeat-triangle", { men: "merch-heartbeat-triangle-tee" }],
      ["no-thanks", { men: "merch-no-thanks-tee" }],
    ]);
    for (const d of designs) expect(d.defaultCut).toBe("men");
    for (const d of designs) expect(d.cuts.map((c) => c.label)).not.toContain("Unisex");
  });

  it("validation flags two shop-listed pieces with the same design and cut", () => {
    const raw = {
      artists: [...load("artists"), ...load("artists-label")], releases: load("releases"), soundcloud: load("soundcloud"), assets: load("assets"),
      products: load("products"), services: load("services"), licenses: load("licenses"), site: load("site"), collaborators: load("collaborators"), samplePacks: load("sample-packs"),
    };
    expect(validateCatalog(raw).filter((e) => e.includes("design/cut"))).toEqual([]);
    raw.products = raw.products.map((x: { id: string; design?: string }) => (x.id === "merch-no-thanks-tee" ? { ...x, design: "feelings-notice" } : x));
    expect(validateCatalog(raw)).toContain("products: two shop-listed merch pieces share design/cut feelings-notice/men");
  });
});
