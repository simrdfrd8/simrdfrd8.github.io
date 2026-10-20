import type { Metadata } from "next";
import Link from "next/link";
import { catalog, getArtist } from "@/lib/catalog";
import { PageHeader } from "@/components/PageHeader";
import { ButtonLink, Section, Arrow } from "@/components/ui";

export const metadata: Metadata = { title: "Services", description: "Mixing, mastering, engineering, production, sound design, DJ sets, music videos, animation, design and commissions.", alternates: { canonical: "/services" } };

const GROUPS = [
  { title: "Sound", slugs: ["mixing", "mastering", "engineering", "production", "sound-design"] },
  { title: "Picture", slugs: ["video", "animation", "design", "photography", "commissions"] },
  { title: "Live", slugs: ["dj-booking"] },
];

export default function ServicesPage() {
  return (
    <>
      <PageHeader kicker="Hire the workshop" title="Services" accent="#8C7CFF">
        From the mix to the music video. Tell us what you&apos;re making and we&apos;ll send a quote.
      </PageHeader>
      {GROUPS.map((g, gi) => (
        <Section key={g.title} id={g.title.toLowerCase()} kicker={`0${gi + 1}`} title={g.title} tone={gi % 2 ? "raised" : "ink"}>
          <ul className="grid gap-px overflow-hidden rounded-2xl bg-line md:grid-cols-2">
            {g.slugs.map((s) => catalog.services.find((x) => x.slug === s)).filter((s) => !!s).map((s) => {
              const by = getArtist(s.provider);
              return (
                <li key={s.slug} id={s.slug} className={gi % 2 ? "bg-raised" : "bg-ink"}>
                  <Link href={`/contact/?type=${s.inquiryType}&service=${s.slug}`} className="group flex h-full flex-col gap-3 p-6 transition hover:bg-cream/[0.04] md:p-8">
                    <span className="flex items-baseline justify-between gap-4">
                      <span className="display text-4xl">{s.title}</span>
                      <Arrow className="h-5 w-5 shrink-0 transition group-hover:translate-x-1" />
                    </span>
                    <span className="text-cream-dim">{s.summary}</span>
                    <span className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 text-sm">
                      {by && <span style={{ color: by.accent }}>by {by.name}</span>}
                      <span className="text-muted">{s.deliverables.join(" · ")}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Section>
      ))}
      <Section tone="cream">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="display text-6xl md:text-7xl">Got a project?</h2>
          <ButtonLink href="/contact/?type=service" size="lg" className="!bg-ink !text-cream">
            Start an inquiry <Arrow />
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
