import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { merchProducts } from "@/lib/catalog";
import { MerchProductGallery } from "@/components/MerchProductGallery";
import { ComingSoonTag } from "@/components/SwipeCarousel";
import { MediaImage } from "@/components/MediaImage";
import { merchGallery, merchSlug } from "@/components/Merch";

export const dynamicParams = false;
export function generateStaticParams() {
  return merchProducts().map((p) => ({ slug: merchSlug(p) }));
}
const find = (slug: string) => merchProducts().find((p) => merchSlug(p) === slug);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = find((await params).slug);
  if (!p) return {};
  // off the curated shop line: the page still resolves for old links but stays out of search
  return { title: p.title, description: p.summary, alternates: { canonical: `/shop/merch/${merchSlug(p)}` }, ...(p.shopListed ? {} : { robots: { index: false, follow: true } }) };
}

/** Merch product page: full-bleed swipe gallery of every colorway (swiping selects the colorway). Display-only: no price, no cart. */
export default async function MerchProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = find((await params).slug);
  if (!product) notFound();
  const { asset, colorways, extras } = merchGallery(product);
  return (
    <section className="px-5 pt-5 pb-20 sm:px-8 md:pt-14 lg:px-12" data-product={product.id} data-merch="inquire-only">
      <div className="mx-auto max-w-[1280px]">
        <Link href="/shop/merch" className="kicker text-muted hover:text-cream">
          ← All merch
        </Link>
        <div className="mt-4 grid items-start gap-6 md:mt-6 md:grid-cols-[1.25fr_1fr] md:gap-10 lg:gap-16">
          {colorways.length ? (
            <MerchProductGallery productId={product.id} title={product.title} colorways={colorways} extras={extras} />
          ) : asset ? (
            <div className="relative -mx-5 sm:-mx-8 md:mx-0">
              <MediaImage asset={asset} sizes="(min-width:768px) 55vw, 100vw" priority className="aspect-square overflow-hidden md:rounded-2xl md:ring-1 md:ring-line" />
              <ComingSoonTag />
            </div>
          ) : null}
          <div className="md:sticky md:top-24">
            <h1 className="brand-h text-[clamp(2rem,5vw,3.5rem)]">{product.title}</h1>
            <p className="mt-4 text-lg text-cream-dim">{product.summary}</p>
            {product.sizes?.length ? (
              <p className="mt-4 text-sm text-muted" data-sizes>
                Sizes {product.sizes.length > 1 ? `${product.sizes[0]}–${product.sizes[product.sizes.length - 1]}` : product.sizes[0]}
              </p>
            ) : null}
            <p className="mt-6 text-sm text-muted">
              Not on sale yet.{" "}
              <Link href={`/contact/?type=business&ref=${product.id}`} className="underline decoration-line-strong underline-offset-4 hover:text-cream" data-ask>
                Ask about it
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
