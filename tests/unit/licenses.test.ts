import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AGREEMENTS, LICENSE_TERMS_FINAL, agreementHtml, comparisonRestHtml, comparisonTable, publicMarkdown } from "@/lib/licenses";
import { catalog } from "@/lib/catalog";

const src = (f: string) => readFileSync(path.join(process.cwd(), "content/licenses", `${f}.md`), "utf8");
/** Approved contracts (kept outside this repo). */
const approved = (f: string) => readFileSync(path.join(process.cwd(), "..", "licenses", `${f}.md`), "utf8");
/** Customer-service contact (spelled h-a-l-l-o on purpose). */
const CONTACT = "hallo@flavorfulmusic.com";
const rapper = catalog.templates.lanes.rapper.offers;
const tier = (id: string) => rapper.find((o) => o.id === id)!;

describe("beat license agreements", () => {
  it("site copies match the approved contracts byte for byte", () => {
    for (const f of [...AGREEMENTS.map((a) => a.slug), "license-comparison"]) {
      let a: string;
      try { a = approved(f); } catch { continue; } // approved folder lives outside the repo
      // The customer-service address moved to hallo@ after the approved copies were written (they name the old h-e-l-l-o or ricky address);
      // the contact address is the only allowed difference.
      expect(src(f)).toBe(a.replace(/\b(?:h[e]llo|ricky)@flavorfulmusic\.com/g, CONTACT));
    }
  });

  it("license contact and notices go to the customer-service address hallo@, never the old h-e-l-l-o or ricky address", () => {
    for (const f of [...AGREEMENTS.map((a) => a.slug), "license-comparison"]) {
      expect(src(f), f).toContain(CONTACT);
      expect(src(f), f).not.toMatch(/\b(?:h[e]llo|ricky)@flavorfulmusic\.com/);
    }
  });

  it("repo copy keeps the DRAFT banner; rendered output and downloads strip it (the page shows DraftTermsNotice instead)", () => {
    expect(LICENSE_TERMS_FINAL).toBe(false);
    for (const a of AGREEMENTS) {
      expect(src(a.slug)).toMatch(/^> \*\*DRAFT/);
      expect(publicMarkdown(a.slug)).not.toMatch(/DRAFT|attorney/i);
      expect(agreementHtml(a.slug)).not.toMatch(/DRAFT|attorney/i);
    }
    expect(comparisonRestHtml()).not.toMatch(/DRAFT|attorney/i);
    expect(comparisonRestHtml()).toContain("50% of the writer&#39;s share");
    const t = comparisonTable();
    expect(t.tiers).toEqual(["MP3 Lease", "WAV Lease", "Stems Lease", "Exclusive Rights"]);
    const row = (l: string) => t.rows.find((r) => r.label === l)?.values;
    expect(row("Price")).toEqual(["$10", "$25", "$50", "$500"]);
    expect(row("Term")).toEqual(["2 years", "5 years", "10 years", "Forever"]);
    expect(row("Audio streams")).toEqual(["50,000", "500,000", "2,000,000", "Unlimited"]);
    expect(t.rows.every((r) => r.values.length === 4)).toBe(true);
  });

  it("prices stay $10 / $25 / $50 / $500 in the agreements and the store tiers", () => {
    for (const a of AGREEMENTS) expect(src(a.slug)).toContain(`**License fee:** $${a.price} (one-time)`);
    expect(rapper.map((o) => o.price)).toEqual([10, 25, 50, 500]);
    expect(rapper.map((o) => o.agreement)).toEqual(AGREEMENTS.map((a) => a.slug));
  });

  it("beat-card tier terms match the contract limits", () => {
    const facts: Record<string, string[]> = {
      "mp3-lease": ["2 years", "50,000 streams", "2,000 downloads/sales", "1 music video (50K views, not monetized)", "no radio", "non-profit live shows only", "sync: ask us", "basic edits only"],
      "wav-lease": ["5 years", "500,000 streams", "10,000 downloads/sales", "1 music video (500K views, monetized)", "2 radio stations", "unlimited live shows", "sync: ask us", "remix and rearrange"],
      "trackout-lease": ["10 years", "2,000,000 streams", "50,000 downloads/sales", "2 music videos (2M views each, monetized)", "unlimited radio", "unlimited live shows", "sync: ask us", "stem by stem"],
      exclusive: ["forever", "unlimited streams", "sync included", "stem by stem", "within 3 business days", "earlier leases stay valid", "not a copyright transfer"],
    };
    for (const [id, list] of Object.entries(facts)) {
      const t = tier(id).terms;
      for (const f of list) expect(t, `${id}: ${f}`).toContain(f);
      expect(t).toContain('"Prod. Flavorful Croissants"');
      expect(t).toContain("50% of the writer's share");
    }
    // and those limits really are in the contracts
    expect(src("mp3-lease")).toMatch(/2 years.*\n.*50,000.*\n.*2,000 units.*\n.*50,000 views; no monetization/);
    expect(src("wav-lease")).toMatch(/5 years.*\n.*500,000.*\n.*10,000 units.*\n.*500,000 views; monetization allowed.*\n.*2 radio stations/);
    expect(src("stems-lease")).toMatch(/10 years.*\n.*2,000,000.*\n.*50,000 units.*\n.*2 music videos, up to 2,000,000 views each/);
    expect(src("exclusive-rights")).toMatch(/Within 3 business days/);
    expect(src("exclusive-rights")).toMatch(/not a transfer of copyright/);
  });

  it("the old 10k / 100k / 500k caps are gone from content and components", () => {
    const files = ["content/product-templates.json", "content/licenses.json", "content/beats.json", "src/app/licensing/page.tsx", "src/components/player/TrackList.tsx", "src/components/OfferChooser.tsx"];
    for (const f of files) expect(readFileSync(f, "utf8"), f).not.toMatch(/\b(10|100|500)k streams|up to (10|100|500)k\b|unlimited license|by inquiry\b.*exclusive/i);
  });

  it("MP3s are untagged everywhere: no tag clause, no 'tagged or untagged' wording", () => {
    expect(src("mp3-lease")).toContain("one 320 kbps MP3 of the Beat, untagged.");
    expect(src("mp3-lease")).not.toMatch(/producer tag|remove or cover a tag|tagged or untagged/i);
    expect(comparisonTable().rows.find((r) => r.label === "Files")?.values[0]).toBe("320 kbps MP3 (untagged)");
    for (const f of ["content/product-templates.json", "content/licenses.json"]) expect(readFileSync(f, "utf8")).not.toMatch(/tagged or untagged/i);
    expect(tier("mp3-lease").summary).toContain("320 kbps MP3 (untagged)");
  });
});
