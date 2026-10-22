import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { merchProducts } from "@/lib/catalog";
import { CLOSER_LOOK_WIDTHS, closerLookFor, closerLookShop, closerLookSrc } from "@/lib/closerLook";

const PUBLIC = path.join(__dirname, "../../public");

describe("closer look", () => {
  const listed = merchProducts().filter((p) => p.shopListed);
  const all = [...closerLookShop(), ...listed.flatMap((p) => closerLookFor(p.id, p.title))];

  it("every shop-listed merch product gets cotton + print tiles", () => {
    for (const p of listed) {
      const ids = closerLookFor(p.id, p.title).map((t) => t.id);
      expect(ids, p.id).toContain("cotton");
      expect(ids, p.id).toContain("print");
    }
  });

  it("every tile image exists in every width and format", () => {
    for (const t of all) for (const w of CLOSER_LOOK_WIDTHS) for (const ext of ["webp", "avif"] as const) {
      expect(existsSync(path.join(PUBLIC, closerLookSrc(t.file, w, ext))), `${t.file}-${w}.${ext}`).toBe(true);
    }
  });

  it("copy says transfer, never DTG, and never mentions prices", () => {
    for (const t of all) {
      const text = `${t.title} ${t.body} ${t.spec ?? ""} ${t.alt}`;
      expect(text).not.toMatch(/\bDTG\b|direct[- ]to[- ]garment|\$\d/i);
    }
  });

  it("the label mark is a croissant, never called a dome", () => {
    for (const t of all) expect(`${t.title} ${t.body} ${t.spec ?? ""} ${t.alt}`).not.toMatch(/\bdome\b/i);
  });

  it("the woven label tile only appears where the spec sheet has a label row", () => {
    const withLabel = listed.filter((p) => closerLookFor(p.id, p.title).some((t) => t.id === "label")).map((p) => p.id);
    expect(withLabel.every((id) => !/womens/.test(id))).toBe(true);
  });
});
