import type { Metadata } from "next";
import supportJson from "@content/support.json";
import { catalog, getProducts } from "@/lib/catalog";
import { formatPrice } from "@/lib/catalog/filters";
import { PageHeader } from "@/components/PageHeader";
import { CheckoutButton } from "@/components/CheckoutButton";
import { Badge, ButtonLink, Section } from "@/components/ui";
import { platformLabel } from "@/lib/format";
import clsx from "clsx";

export const metadata: Metadata = { title: "Support", description: "Tip Flavorful Music what you want, or join a monthly membership on Ko-fi.", alternates: { canonical: "/support" } };

export default function SupportPage() {
  const supports = getProducts().filter((p) => p.type === "support");
  const main = supports[0];
  return (
    <>
      <PageHeader kicker="Pay what you want · Ko-fi" title={<>Support<span className="text-hot">.</span></>} accent="#FF7A59">
        Streams pay fractions of a cent. A $5 tip pays for an hour of studio time. Thank you. It genuinely keeps this going.
      </PageHeader>
      {main && (
        <Section>
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-3xl bg-hot p-8 text-ink md:p-12">
              <p className="kicker text-ink/70">One-off tip</p>
              <p className="display mt-3 text-6xl md:text-8xl">Any amount</p>
              <div className="mt-8 flex flex-wrap gap-3">
                {supportJson.amounts.map((a) => (
                  <CheckoutButton key={a} product={main} amount={a} priceLabel={`$${a}`} label={`$${a}`} size="lg" className="!bg-ink !text-cream hover:!bg-black" />
                ))}
                <CheckoutButton product={main} priceLabel={formatPrice(main).label} label="Custom" size="lg" variant="secondary" className="!border-ink/40 !text-ink hover:!border-ink" />
              </div>
            </div>
            <div className="grid gap-6">
              {supports.slice(1).map((p) => (
                <div key={p.id} className="flex flex-col justify-between gap-6 rounded-3xl bg-raised p-8 ring-1 ring-line">
                  <div>
                    <p className="text-2xl font-semibold">{p.title}</p>
                    <p className="mt-2 text-cream-dim">{p.summary}</p>
                  </div>
                  <CheckoutButton product={p} priceLabel={formatPrice(p).label} label="Tip" variant="accent" />
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}
      <Section id="memberships" kicker="Monthly · cancel anytime" title="Memberships" tone="raised">
        <div className="grid gap-5 md:grid-cols-3">
          {supportJson.memberships.map((m) => (
            <div key={m.id} className={clsx("flex flex-col gap-5 rounded-3xl p-8 ring-1", m.highlighted ? "bg-cream text-ink ring-cream" : "bg-ink ring-line")}>
              <div className="flex items-start justify-between gap-3">
                <p className="display text-4xl">{m.name}</p>
                {m.highlighted && <Badge tone="accent">Most loved</Badge>}
              </div>
              <p className="text-2xl font-semibold">{m.price}</p>
              <ul className="space-y-2">
                {m.perks.map((x) => (
                  <li key={x} className="flex gap-2">
                    <span aria-hidden="true">✦</span> {x}
                  </li>
                ))}
              </ul>
              {main && <CheckoutButton product={{ ...main, title: m.name, payWhatYouWant: false }} priceLabel={m.price} label="Join on Ko-fi" variant={m.highlighted ? "secondary" : "primary"} className={clsx("mt-auto", m.highlighted && "!border-ink/40 !text-ink")} />}
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted">Membership tiers are illustrative and not yet live.</p>
      </Section>
      <Section kicker="Free ways to help" title="Spread it">
        <div className="flex flex-wrap gap-3">
          {catalog.site.socials.map((s) => (
            <ButtonLink key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" variant="secondary">
              Follow on {platformLabel(s.platform)} ↗
            </ButtonLink>
          ))}
        </div>
      </Section>
    </>
  );
}
