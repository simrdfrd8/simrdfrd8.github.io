import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { merchProducts } from "@/lib/catalog";
import { ColorwayGallery } from "@/components/ColorwayGallery";
import { MediaImage } from "@/components/MediaImage";
import { merchGallery, merchSlug } from "@/components/Merch";
import { Badge, ButtonLink } from "@/components/ui";

export const dynamicParams = false;
export function generateStaticParams() {
  return merchProducts().map((p) => ({ slug: merchSlug(p) }));
}
const find = (slug: string) => merchProducts().find((p) => merchSlug(p) === slug);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = find((await params).slug);
  if (!p) return {};
  return { title: p.title, description: p.summary, alternates: { canonical: `/shop/merch/${merchSlug(p)}` } };
}

/** Merch product page: big gallery (front / back / model front / model back) + colorway picker. Display-only. */
export default async function MerchProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = find((await params).slug);
  if (!product) notFound();
  const { asset, colorways, extras } = merchGallery(product);
  return (
    <section className="px-5 pt-8 pb-20 sm:px-8 md:pt-14 lg:px-12" data-product={product.id} data-merch="inquire-only">
      <div className="mx-auto max-w-[1280px]">
        <Link href="/shop/merch" className="kicker text-muted hover:text-cream">
          ← All merch
        </Link>
        <div className="mt-6 grid items-start gap-10 md:grid-cols-[1.25fr_1fr] lg:gap-16">
          {colorways.length ? (
            <ColorwayGallery productId={product.id} title={product.title} colorways={colorways} extras={extras} variant="page" />
          ) : asset ? (
            <MediaImage asset={asset} sizes="(min-width:768px) 55vw, 100vw" className="aspect-square overflow-hidden rounded-2xl ring-1 ring-line" />
          ) : null}
          <div className="md:sticky md:top-24">
            <Badge tone="upcoming">Coming soon</Badge>
            <h1 className="brand-h mt-4 text-[clamp(2.2rem,5vw,3.5rem)]">{product.title}</h1>
            <p className="mt-5 text-lg text-cream-dim">{product.summary}</p>
            {colorways.length > 1 && <p className="mt-4 text-sm text-muted">{colorways.length} colorways · pick one under the photos to see it front, back and on a model.</p>}
            <p className="mt-6 text-sm text-muted">Not on sale yet. No price until fulfilment is set up.</p>
            <ButtonLink href={`/contact/?type=business&ref=${product.id}`} className="mt-6">
              Ask about it
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
