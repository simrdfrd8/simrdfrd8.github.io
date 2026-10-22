import clsx from "clsx";
import Link from "next/link";
import type { Asset } from "@/lib/catalog/schema";
import { formatCents } from "@/lib/pricing";
import { MediaImage } from "../MediaImage";
import { PriceTag } from "./PriceTag";

export type BundleCardItem = { title: string; colorwayName: string | null; qty: number; href: string; asset?: Asset; unitPrice: number | null };
export type BundleCardData = { slug: string; title: string; description: string; price_cents: number; original_cents: number | null; items: BundleCardItem[] };

/** A bundle: item photos, the items' total struck through next to the bundle price, and what's included. */
export function BundleCard({ bundle, builtAt, className }: { bundle: BundleCardData; builtAt: number; className?: string }) {
  const pics = bundle.items.filter((i) => i.asset).slice(0, 3);
  const count = bundle.items.reduce((a, i) => a + i.qty, 0);
  return (
    <article className={clsx("flex flex-col overflow-hidden rounded-2xl bg-raised ring-1 ring-line", className)} data-bundle={bundle.slug} aria-labelledby={`bundle-${bundle.slug}`}>
      <div className={clsx("grid gap-px bg-line", pics.length >= 3 ? "grid-cols-3" : pics.length === 2 ? "grid-cols-2" : "grid-cols-1")}>
        {pics.map((i) => (
          <MediaImage key={i.href + i.colorwayName} asset={i.asset!} sizes="(min-width:1024px) 12vw, 33vw" className="aspect-square bg-surface" showMark={false} alt="" />
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <p className="kicker text-[var(--fm-hiphop-text)]">Bundle · {count} pieces</p>
        <h3 id={`bundle-${bundle.slug}`} className="brand-h text-xl">
          {bundle.title}
        </h3>
        {bundle.description && <p className="text-sm text-cream-dim">{bundle.description}</p>}
        <PriceTag price={bundle.price_cents} was={bundle.original_cents} builtAt={builtAt} badge="save" prefix="Bundle" />
        <div>
          <p className="kicker mb-1.5 text-muted">Included</p>
          <ul className="space-y-1 text-sm" data-bundle-items>
            {bundle.items.map((i) => (
              <li key={i.href + (i.colorwayName ?? "")} className="flex justify-between gap-3">
                <Link href={i.href} className="hover:underline">
                  {i.qty > 1 ? `${i.qty} × ` : ""}
                  {i.title}
                  <span className="text-muted"> · {i.colorwayName ?? "your colour"}</span>
                </Link>
                {i.unitPrice != null && <span className="text-muted tabular-nums">{formatCents(i.unitPrice * i.qty)}</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
