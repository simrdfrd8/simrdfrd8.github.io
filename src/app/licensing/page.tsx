import type { Metadata } from "next";
import Link from "next/link";
import { catalog } from "@/lib/catalog";
import { AGREEMENTS, agreementDownloadPath, agreementFileName, agreementPath, comparisonRestHtml, comparisonTable } from "@/lib/licenses";
import { PageHeader } from "@/components/PageHeader";
import { InquiryForm } from "@/components/InquiryForm";
import { Section } from "@/components/ui";
import { DraftTermsNotice } from "@/components/DraftTermsNotice";

export const metadata: Metadata = {
  title: "Licensing",
  description: "Beat licenses from Flavorful Croissants: MP3 Lease $10, WAV Lease $25, Stems Lease $50, Exclusive Rights $500. Compare terms and read each full agreement.",
  alternates: { canonical: "/licensing" },
};

/** Split the comparison Markdown (minus the table) into the "Every license includes" block and the explanations. */
function comparisonParts() {
  const html = comparisonRestHtml();
  const i = html.indexOf("<h2");
  return i === -1 ? { includes: html, explain: "" } : { includes: html.slice(0, i), explain: html.slice(i) };
}

export default function LicensingPage() {
  const { includes, explain } = comparisonParts();
  const { tiers, rows } = comparisonTable();
  const other = catalog.licenses.filter((l) => !l.agreement);
  return (
    <>
      <PageHeader kicker="Beat licenses · sync · DJ use" title="Licensing" accent="#8C7CFF">
        Four ways to use a Flavorful Croissants beat, from a $10 MP3 lease to exclusive rights. Compare them below, then read the full agreement for your tier.
      </PageHeader>

      <Section id="compare" kicker="Plain English" title="Beat license options">
        <DraftTermsNotice />
        {/* Desktop / tablet: the full comparison table */}
        <div className="legal legal-scroll hidden md:block">
          <table aria-label="Beat license comparison" data-license-comparison>
            <thead>
              <tr>
                <td />
                {tiers.map((t) => (
                  <th key={t} scope="col">{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <th scope="row">{r.label}</th>
                  {r.values.map((v, i) => (
                    <td key={i}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* One card per tier: on mobile they carry the same rows as the table */}
        <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4" aria-label="Full license agreements">
          {AGREEMENTS.map((a, i) => (
            <li key={a.slug} className="flex flex-col gap-3 rounded-3xl bg-raised p-6 ring-1 ring-line" data-agreement-card={a.slug}>
              <p className="display text-3xl">{tiers[i] ?? a.name}</p>
              <dl className="legal grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm md:hidden" data-tier-terms>
                {rows.map((r) => (
                  <div key={r.label} className="contents">
                    <dt className="text-muted">{r.label}</dt>
                    <dd className="font-medium">{r.values[i]}</dd>
                  </div>
                ))}
              </dl>
              <p className="hidden text-xl font-semibold md:block">${a.price}</p>
              <div className="mt-auto flex flex-col gap-1.5 pt-2 text-sm">
                <Link href={agreementPath(a.slug)} className="font-semibold underline underline-offset-4 hover:text-cream">
                  Read the full agreement
                </Link>
                <a href={agreementDownloadPath(a.slug)} download={agreementFileName(a.slug)} className="text-cream-dim underline underline-offset-4 hover:text-cream">
                  Download (.md)
                </a>
              </div>
            </li>
          ))}
        </ul>
        <div className="legal mt-8 max-w-3xl" dangerouslySetInnerHTML={{ __html: includes }} />
      </Section>

      {explain && (
        <Section kicker="What you get" title="What each license means" tone="raised">
          <div className="legal max-w-3xl" dangerouslySetInnerHTML={{ __html: explain.replace(/^<h2[^>]*>.*?<\/h2>/, "") }} />
        </Section>
      )}

      {other.length > 0 && (
        <Section kicker="Beyond beats" title="DJ use and sync">
          <div className="grid gap-5 md:grid-cols-2">
            {other.map((l) => (
              <div key={l.id} className="flex flex-col gap-4 rounded-3xl bg-raised p-7 ring-1 ring-line">
                <p className="display text-3xl">{l.name}</p>
                <div>
                  <p className="text-lg font-semibold">{l.price}</p>
                  <p className="text-sm text-muted">{l.bestFor}</p>
                </div>
                <ul className="space-y-1.5 text-[0.95rem]">
                  {l.rights.map((r) => (
                    <li key={r}>✓ {r}</li>
                  ))}
                  {l.limits.map((r) => (
                    <li key={r} className="opacity-70">– {r}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section id="inquiry" kicker="Sync, upgrades and questions" title="Request a license" tone="raised">
        <InquiryForm defaultType="licensing" />
      </Section>
    </>
  );
}
