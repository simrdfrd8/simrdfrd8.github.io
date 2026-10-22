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

describe("All tab: one card per design with a Men / Women / Unisex cut selector", () => {
  it("groups cuts of the same design, keeps first-appearance order, and lists all three cuts in Men, Women, Unisex order", () => {
    const out = groupByDesign([p("tee", "unisex", "a"), p("solo", "unisex"), p("tee-w", "women", "a"), p("tank-w", "women", "b")]);
    expect(out.map((d) => d.design)).toEqual(["a", "solo", "b"]);
    for (const d of out) expect(d.cuts.map((c) => c.label)).toEqual(["Men", "Women", "Unisex"]);
    expect(cutsOf(out[0])).toEqual({ men: null, women: "tee-w", unisex: "tee" });
    expect(cutsOf(out[1])).toEqual({ men: null, women: null, unisex: "solo" });
  });

  it("opens on Unisex; a design without a unisex cut opens on the first cut it has", () => {
    const [a, b, c] = groupByDesign([p("tee-w", "women", "a"), p("tee", "unisex", "a"), p("tank-w", "women", "b"), p("m", "men", "c"), p("w", "women", "c")]);
    expect(a.defaultCut).toBe("unisex");
    expect(b.defaultCut).toBe("women");
    expect(c.defaultCut).toBe("men");
    expect(defaultCutOf([])).toBe("unisex");
  });

  it("first product wins if two claim the same design and cut", () => {
    const [d] = groupByDesign([p("one", "women", "x"), p("two", "women", "x")]);
    expect(cutsOf(d).women).toBe("one");
  });

  it("the launch line groups into 6 designs; the 4 with a women's cut get Women + Unisex, Men stays disabled everywhere", () => {
    const products = visibleProducts(ProductsFile.parse(load("products")), "production", AssetsFile.parse(load("assets"))).filter((x) => x.type === "merch" && x.listed && x.shopListed);
    const designs = groupByDesign([...products].sort((x, y) => x.order - y.order));
    expect(designs.map((d) => [d.design, cutsOf(d)])).toEqual([
      ["hotdo-g", { men: null, women: "merch-hotdo-g-womens-boxy-tee", unisex: "merch-hotdog-tee-white" }],
      ["heartbeat-triangle", { men: null, women: null, unisex: "merch-heartbeat-triangle-tee" }],
      ["no-thanks", { men: null, women: null, unisex: "merch-no-thanks-tee" }],
      ["feelings-notice", { men: null, women: "merch-feelings-notice-womens-boxy-tee", unisex: "merch-feelings-notice-tee" }],
      ["make-art-with-friends", { men: null, women: "merch-make-art-with-friends-womens-boxy-tee", unisex: "merch-make-art-with-friends-tee" }],
      ["santa-cruz-dipper", { men: null, women: "merch-santa-cruz-dipper-womens-rib-tank", unisex: "merch-santa-cruz-dipper-tank" }],
    ]);
    for (const d of designs) expect(d.defaultCut).toBe("unisex");
  });

  it("validation flags two shop-listed pieces with the same design and cut", () => {
    const raw = {
      artists: [...load("artists"), ...load("artists-label")], releases: load("releases"), soundcloud: load("soundcloud"), assets: load("assets"),
      products: load("products"), services: load("services"), licenses: load("licenses"), site: load("site"), collaborators: load("collaborators"), samplePacks: load("sample-packs"),
    };
    expect(validateCatalog(raw).filter((e) => e.includes("design/cut"))).toEqual([]);
    raw.products = raw.products.map((x: { id: string; design?: string }) => (x.id === "merch-no-thanks-tee" ? { ...x, design: "hotdo-g" } : x));
    expect(validateCatalog(raw)).toContain("products: two shop-listed merch pieces share design/cut hotdo-g/unisex");
  });
});
