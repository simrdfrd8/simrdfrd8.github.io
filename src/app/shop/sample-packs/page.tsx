import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { PackLibrary } from "@/components/PackLibrary";
import { Section } from "@/components/ui";
import { libraryPacks } from "@/lib/packs";

export const metadata: Metadata = { title: "Sample packs", description: "Sample packs & Foley sounds. For beatmakers, post-production, and video game sound designers. Coming soon.", alternates: { canonical: "/shop/sample-packs" } };

export default function SamplePacksPage() {
  const packs = libraryPacks();
  return (
    <>
      <PageHeader kicker="Producers · coming soon" title="Sample packs" accent="#8C7CFF">
        Sample packs &amp; Foley sounds. For beatmakers, post-production, and video game sound designers.
      </PageHeader>
      <Section id="packs" className="!pt-10 md:!pt-14">
        <PackLibrary packs={packs} />
        <p className="mt-10 text-sm text-muted">
          Want to hear first?{" "}
          <Link href="/contact" className="underline underline-offset-4 hover:text-cream">
            Get in touch
          </Link>
          .
        </p>
      </Section>
    </>
  );
}
