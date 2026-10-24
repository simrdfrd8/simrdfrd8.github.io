import type { Metadata } from "next";
import Link from "next/link";
import { BEAT_LEASE, beatLeaseHtml } from "@/lib/licenses";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Beat Lease License",
  description: "The Flavorful Music Beat Lease License (MP3 Lease $10, WAV Lease $25), version 1.0. Read it online or download the PDF.",
  alternates: { canonical: BEAT_LEASE.path },
};

export default function BeatLeasePage() {
  return (
    <>
      <PageHeader kicker={`MP3 Lease $10 · WAV Lease $25 · Version ${BEAT_LEASE.version}`} title="Beat Lease License" accent="#8C7CFF">
        {BEAT_LEASE.title}. Baylingue LLC (dba Flavorful Music) grants these rights directly; they apply to every MP3 and WAV lease bought on this site.
      </PageHeader>
      <Section>
        <div className="mb-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/licensing#compare" className="underline underline-offset-4 hover:text-cream">← Compare all licenses</Link>
          <a href={BEAT_LEASE.pdfPath} download="flavorful-music-beat-lease-license.pdf" className="font-semibold underline underline-offset-4 hover:text-cream" data-agreement-download>
            Download the license (PDF)
          </a>
        </div>
        <article className="legal max-w-3xl" data-agreement="beat-lease" dangerouslySetInnerHTML={{ __html: beatLeaseHtml() }} />
      </Section>
    </>
  );
}
