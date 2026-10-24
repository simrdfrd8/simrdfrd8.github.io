import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { catalog } from "@/lib/catalog";
import { PageHeader } from "@/components/PageHeader";
import { InquiryForm } from "@/components/InquiryForm";
import { Section } from "@/components/ui";

export const metadata: Metadata = { title: "Contact & booking", description: "Bookings, business, collabs, licensing and commissions.", alternates: { canonical: "/contact" } };

export default function ContactPage() {
  const { site } = catalog;
  return (
    <>
      <PageHeader kicker="Bookings · business · collabs · licensing · commissions" title="Say hi" accent="#B6FF3B">
        Pick a topic and tell us what you have in mind. We read everything.
      </PageHeader>
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr]">
          <Suspense>
            <InquiryForm />
          </Suspense>
          <aside className="space-y-8">
            <div data-label-line>
              <p className="kicker text-muted">The label</p>
              <p className="mt-1 text-cream-dim">
                Flavorful Music, a Baylingue LLC company. San Diego, CA. Contact:{" "}
                <a href="mailto:hallo@flavorfulmusic.com" className="text-cream underline underline-offset-4">hallo@flavorfulmusic.com</a>
              </p>
            </div>
            {site.email && (
              <div>
                <p className="kicker text-muted">Email</p>
                <a href={`mailto:${site.email}`} className="mt-1 block text-2xl font-semibold break-all underline decoration-line-strong underline-offset-4 hover:decoration-hot">
                  {site.email}
                </a>
              </div>
            )}
            <div>
              <p className="kicker text-muted">Instagram</p>
              <a href="https://www.instagram.com/flavorful_croissants/" target="_blank" rel="noopener noreferrer" className="mt-1 block text-2xl font-semibold hover:text-hot">
                @flavorful_croissants ↗
              </a>
            </div>
            <div className="rounded-2xl bg-raised p-6 ring-1 ring-line text-cream-dim">
              Licensing a track for film, games or ads? See the <Link href="/licensing" className="text-cream underline underline-offset-4">license tiers</Link> first.
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
