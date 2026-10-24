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

/**
 * Global switch for ALL tiers: stays false while the Stems Lease and Exclusive Rights agreements are drafts.
 * The MP3/WAV leases are final through FINAL_TERMS_SLUGS (Beat Lease License v1.0, approved 23 Oct 2026).
 */
export const LICENSE_TERMS_FINAL = false;

/**
 * MP3 and WAV leases are covered by one owner-approved document, the Flavorful Music Beat Lease License (v1.0),
 * at /licensing/beat-lease with a PDF download. Stems Lease and Exclusive Rights are not on sale yet ("Coming soon")
 * and keep their draft agreements behind the draft-terms notice.
 */
export const BEAT_LEASE = {
  slug: "beat-lease",
  path: "/licensing/beat-lease",
  pdfPath: "/licensing/flavorful-music-beat-lease-license.pdf",
  title: "Flavorful Music Beat Lease License",
  version: "1.0",
} as const;
/** Tiers whose terms are final (the Beat Lease License). Everything else is still draft / coming soon. */
export const FINAL_TERMS_SLUGS: readonly string[] = ["mp3-lease", "wav-lease"];
export const isTermsFinal = (slug: string) => LICENSE_TERMS_FINAL || FINAL_TERMS_SLUGS.includes(slug);
export const isComingSoon = (slug: string) => !isTermsFinal(slug);

export const agreementPath = (slug: string) => (FINAL_TERMS_SLUGS.includes(slug) ? BEAT_LEASE.path : `/licensing/${slug}`);
export const agreementDownloadPath = (slug: string) => (FINAL_TERMS_SLUGS.includes(slug) ? BEAT_LEASE.pdfPath : `/licensing/${slug}/agreement.md`);
export const agreementFileName = (slug: string) => (FINAL_TERMS_SLUGS.includes(slug) ? "flavorful-music-beat-lease-license.pdf" : `flavorful-music-${slug}-agreement.md`);
export const agreementForTier = (tierId?: string) => AGREEMENTS.find((a) => a.tierId === tierId);

const DIR = path.join(process.cwd(), "content", "licenses");

/** Raw Markdown with the internal leading DRAFT blockquote removed. */
export function publicMarkdown(file: string): string {
  if (FINAL_TERMS_SLUGS.includes(file)) return readFileSync(path.join(DIR, "beat-lease.md"), "utf8");
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


/** The approved Beat Lease License (content/licenses/beat-lease.md, no draft banner), without its H1. */
export function beatLeaseMarkdown(): string {
  return readFileSync(path.join(DIR, "beat-lease.md"), "utf8");
}
export function beatLeaseHtml(): string {
  return marked.parse(beatLeaseMarkdown().replace(/^#\s+.+\n+/m, ""), { async: false }) as string;
}
