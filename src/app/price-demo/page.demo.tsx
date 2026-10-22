import type { Metadata } from "next";
import Link from "next/link";
import { getAsset, merchProducts } from "@/lib/catalog";
import { MediaImage } from "@/components/MediaImage";
import { PriceTag } from "@/components/price/PriceTag";
import { BundleCard, type BundleCardData } from "@/components/price/BundleCard";
import { merchSlug } from "@/components/Merch";

/**
 * EXAMPLE DATA ONLY, for screenshots of the sale + bundle price display. This file uses the ".demo.tsx" page extension, which
 * next.config.ts only enables when PRICE_DEMO=1, so it is never part of a normal (or public) build; the postbuild check fails
 * any non-demo export that contains it. None of these prices are real.
 */
export const metadata: Metadata = { title: "Price display demo (example data)", robots: { index: false, follow: false } };

const EXAMPLE = { tee: 3000, teeSale: 2400, tank: 2800, boxy: 3000 };

export default function PriceDemo() {
  const find = (slug: string) => merchProducts().find((p) => merchSlug(p) === slug);
  const tee = find("hotdog-tee-white"), tank = find("santa-cruz-dipper-tank"), boxy = find("feelings-notice-womens-boxy-tee"), pocket = find("heartbeat-croissant-pocket-tee");
  const card = (p: typeof tee, price: number, sale: number | null) =>
    p && (
      <article className="flex flex-col" data-demo-card={merchSlug(p)}>
        {getAsset(p.assetId) && <MediaImage asset={getAsset(p.assetId)!} sizes="(min-width:1024px) 25vw, 50vw" className="aspect-square overflow-hidden rounded-2xl ring-1 ring-line" />}
        <div className="flex flex-1 flex-col gap-1 pt-3">
          <h3 className="text-base leading-snug font-semibold">{p.title}</h3>
          <p className="line-clamp-2 text-sm text-cream-dim">{p.summary}</p>
          <PriceTag price={price} sale={sale == null ? null : { price_cents: sale, starts_at: null, ends_at: null }} builtAt={0} className="mt-1" />
        </div>
      </article>
    );
  const bundle: BundleCardData | null =
    tee && tank && pocket
      ? {
          slug: "example-summer-pack",
          title: "Summer pack (example)",
          description: "Example bundle for the screenshot. Not a real offer.",
          price_cents: 7000,
          original_cents: EXAMPLE.tee + EXAMPLE.tank + EXAMPLE.boxy,
          items: [
            { title: tee.title, colorwayName: tee.colorways[1]?.name ?? null, qty: 1, href: `/shop/merch/${merchSlug(tee)}/`, asset: getAsset(tee.colorways[1]?.assetId ?? tee.assetId), unitPrice: EXAMPLE.tee },
            { title: tank.title, colorwayName: null, qty: 1, href: `/shop/merch/${merchSlug(tank)}/`, asset: getAsset(tank.assetId), unitPrice: EXAMPLE.tank },
            { title: pocket.title, colorwayName: null, qty: 1, href: `/shop/merch/${merchSlug(pocket)}/`, asset: getAsset(pocket.assetId), unitPrice: EXAMPLE.boxy },
          ],
        }
      : null;
  return (
    <section className="px-5 pt-6 pb-20 sm:px-8 lg:px-12" data-example-data>
      <div className="mx-auto max-w-[1280px] space-y-14">
        <p className="kicker rounded-xl bg-[var(--fm-logo)] px-4 py-3 text-ink" role="note" data-example-banner>
          Example data · screenshots only · not real prices
        </p>
        <div>
          <p className="kicker mb-4 text-muted">Shop cards</p>
          <div className="grid items-start gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {card(tee, EXAMPLE.tee, EXAMPLE.teeSale)}
            {card(tank, EXAMPLE.tank, null)}
            {card(boxy, EXAMPLE.boxy, 2250)}
          </div>
        </div>
        {tee && (
          <div className="grid gap-6 md:grid-cols-[1.25fr_1fr] md:gap-10" data-demo-product>
            {getAsset(tee.assetId) && <MediaImage asset={getAsset(tee.assetId)!} sizes="(min-width:768px) 55vw, 100vw" className="aspect-square overflow-hidden rounded-2xl ring-1 ring-line" />}
            <div>
              <p className="kicker mb-3 text-muted">Product page</p>
              <h1 className="brand-h text-[clamp(2rem,5vw,3.5rem)]">{tee.title}</h1>
              <PriceTag price={EXAMPLE.tee} sale={{ price_cents: EXAMPLE.teeSale, starts_at: null, ends_at: null }} builtAt={0} size="lg" className="mt-4" />
              <p className="mt-4 text-lg text-cream-dim">{tee.summary}</p>
              <p className="mt-6 text-sm text-muted">
                Not on sale yet. <Link href="/contact/?type=business" className="underline decoration-line-strong underline-offset-4">Ask about it</Link>
              </p>
            </div>
          </div>
        )}
        {bundle && (
          <div>
            <p className="kicker mb-4 text-muted">Bundle</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <BundleCard bundle={bundle} builtAt={0} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
