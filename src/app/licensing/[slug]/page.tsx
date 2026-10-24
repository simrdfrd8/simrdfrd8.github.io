import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AGREEMENTS, BEAT_LEASE, agreementDownloadPath, agreementFileName, agreementHtml, agreementTitle, isTermsFinal } from "@/lib/licenses";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/ui";
import { DraftTermsNotice } from "@/components/DraftTermsNotice";

export const dynamicParams = false;
export const generateStaticParams = () => AGREEMENTS.map((a) => ({ slug: a.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = AGREEMENTS.find((x) => x.slug === slug);
  return a ? { title: `${a.name} agreement`, description: `Full ${a.name} agreement for Flavorful Croissants beats ($${a.price}).`, alternates: { canonical: isTermsFinal(slug) ? BEAT_LEASE.path : `/licensing/${slug}` } } : {};
}

export default async function AgreementPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = AGREEMENTS.find((x) => x.slug === slug);
  if (!a) notFound();
  return (
    <>
      <PageHeader kicker={`Beat license · $${a.price}`} title={a.name} accent="#8C7CFF">
        {agreementTitle(slug)}
      </PageHeader>
      <Section>
        <DraftTermsNotice slug={slug} />
        <div className="mb-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/licensing#compare" className="underline underline-offset-4 hover:text-cream">← Compare all licenses</Link>
          <a href={agreementDownloadPath(slug)} download={agreementFileName(slug)} className="underline underline-offset-4 hover:text-cream" data-agreement-download>
            {isTermsFinal(slug) ? "Download the license (PDF)" : "Download this agreement (.md)"}
          </a>
        </div>
        <article className="legal max-w-3xl" data-agreement={slug} dangerouslySetInnerHTML={{ __html: agreementHtml(slug) }} />
      </Section>
    </>
  );
}
