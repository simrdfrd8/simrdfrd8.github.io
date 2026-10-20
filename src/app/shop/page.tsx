import type { Metadata } from "next";
import Link from "next/link";
import { getAsset, getProducts, getSamplePacks, getTracks } from "@/lib/catalog";
import { Productions } from "@/components/Productions";
import { PageHeader } from "@/components/PageHeader";
import { ShopGrid } from "@/components/ShopGrid";
import { ProductCard } from "@/components/ProductCard";
import { SupportBand } from "@/components/SupportBand";
import { Section } from "@/components/ui";
import { JsonLd, productLd } from "@/lib/jsonld";
import { CHECKOUT_LIVE } from "@/lib/env";

export const metadata: Metadata = { title: "Shop", description: "Downloads, stems, sample packs, prints, licenses and merch from Flavorful Music.", alternates: { canonical: "/shop" } };

const SHOP_GROUPS = [
  { id: "music", label: "Music", types: ["download", "stems", "sample-pack"] },
  { id: "art", label: "Art & prints", types: ["print", "digital-art"] },
  { id: "merch", label: "Merch · soon", types: ["merch"] },
  { id: "work", label: "Licenses & services", types: ["license", "service"] },
] as const;

export default function ShopPage() {
  const products = getProducts().filter((p) => p.type !== "support");
  const cards = Object.fromEntries(products.map((p) => [p.id, <ProductCard key={p.id} product={p} />]));
  return (
    <>
      <PageHeader kicker="One cart-free store · instant digital delivery" title="Shop" accent="#FF7A59">
        Every purchase goes straight to the artists. Pick something, pay, and it&apos;s yours. No account needed.
      </PageHeader>
      <Section id="lanes" kicker="Beats, tracks & sample packs by Flavorful Croissants" title="Shop by lane" tone="raised">
        <Productions tracks={getTracks().filter((t) => t.kind === "track" && t.credit === "solo" && t.audience)} packs={getSamplePacks()} />
      </Section>
      <Section id="all" kicker="Everything else" title="Downloads, art & more">
        <ShopGrid groups={SHOP_GROUPS.map((g) => ({ id: g.id, label: g.label, ids: products.filter((p) => (g.types as readonly string[]).includes(p.type)).map((p) => p.id) })).filter((g) => g.ids.length)} order={products.map((p) => p.id)} cards={cards} />
        <p className="mt-12 text-sm text-muted">
          Merch is coming soon and not on sale yet. <Link href="/shop/merch" className="underline underline-offset-4 hover:text-cream">See the merch page</Link>.
        </p>
        {!CHECKOUT_LIVE && <p className="mt-3 text-sm text-muted">Checkout is coming soon.</p>}
      </Section>
      <SupportBand title="Or just say thanks." />
      <JsonLd data={products.map((p) => productLd(p, getAsset(p.assetId)?.previews.find((x) => x.format === "webp")?.src ?? p.artworkUrl))} />
    </>
  );
}
