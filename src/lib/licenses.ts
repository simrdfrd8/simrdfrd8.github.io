/**
 * Beat license agreements, rendered from the owner-approved Markdown in content/licenses/.
 * Any leading blockquote banner is stripped before rendering.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { marked } from "marked";

export const AGREEMENTS = [
  { slug: "mp3-lease", tierId: "mp3-lease", name: "MP3 Lease", price: 10 },
  { slug: "wav-lease", tierId: "wav-lease", name: "WAV Lease", price: 25 },
  { slug: "stems-lease", tierId: "trackout-lease", name: "Stems Lease", price: 50 },
  { slug: "exclusive-rights", tierId: "exclusive", name: "Exclusive Rights", price: 500 },
] as const;
export type AgreementSlug = (typeof AGREEMENTS)[number]["slug"];

export const agreementPath = (slug: string) => `/licensing/${slug}`;
export const agreementDownloadPath = (slug: string) => `/licensing/${slug}/agreement.md`;
export const agreementFileName = (slug: string) => `flavorful-music-${slug}-agreement.md`;
export const agreementForTier = (tierId?: string) => AGREEMENTS.find((a) => a.tierId === tierId);

const DIR = path.join(process.cwd(), "content", "licenses");

/** Raw Markdown with the internal leading DRAFT blockquote removed. */
export function publicMarkdown(file: string): string {
  const md = readFileSync(path.join(DIR, `${file}.md`), "utf8");
  return md.replace(/^(?:>[^\n]*\n)+\s*/, "");
}

export function agreementTitle(slug: string): string {
  return publicMarkdown(slug).match(/^#\s+(.+)$/m)?.[1] ?? slug;
}

/** Agreement body as HTML (without the H1, which the page renders itself). */
export function agreementHtml(slug: string): string {
  return marked.parse(publicMarkdown(slug).replace(/^#\s+.+\n+/m, ""), { async: false }) as string;
}

/** The plain-English comparison (table + "what each license means"), without its H1. */
export function comparisonHtml(): string {
  return marked.parse(publicMarkdown("license-comparison").replace(/^#\s+.+\n+/m, ""), { async: false }) as string;
}

/** The comparison table parsed from license-comparison.md: tier names and rows of [label, ...one value per tier]. */
export function comparisonTable(): { tiers: string[]; rows: { label: string; values: string[] }[] } {
  const clean = (c: string) => c.trim().replace(/\*\*/g, "");
  const lines = publicMarkdown("license-comparison").split("\n").filter((l) => l.trim().startsWith("|"));
  const cells = (l: string) => l.trim().replace(/^\||\|$/g, "").split("|").map(clean);
  const [head, , ...body] = lines;
  return { tiers: cells(head).slice(1), rows: body.map((l) => { const [label, ...values] = cells(l); return { label, values }; }) };
}

/** Comparison Markdown after the table (the "Every license includes" line and the explanations). */
export function comparisonRestHtml(): string {
  const md = publicMarkdown("license-comparison").replace(/^#\s+.+\n+/m, "").split("\n").filter((l) => !l.trim().startsWith("|")).join("\n");
  return marked.parse(md, { async: false }) as string;
}

/** Flip to true once the owner approves the final legal wording; hides the draft-terms notice. */
export const LICENSE_TERMS_FINAL = false;
