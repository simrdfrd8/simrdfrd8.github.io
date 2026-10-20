import type { Metadata } from "next";
import { catalog, getProducts, visibleAssets, assetCredit } from "@/lib/catalog";
import { formatPrice } from "@/lib/catalog/filters";
import { PageHeader } from "@/components/PageHeader";
import { MediaGallery } from "@/components/MediaGallery";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ButtonLink, Section, Arrow } from "@/components/ui";

export const metadata: Metadata = { title: "Art & Video", description: "Music videos, animation stills and artwork from Flavorful Music and Baylingual Entertainment. Prints and digital art.", alternates: { canonical: "/art" } };

export default function ArtPage() {
  const assets = visibleAssets();
  const videos = assets.filter((a) => a.type === "video" && !a.tags.includes("merch")).sort((a, b) => Number(b.featured) - Number(a.featured));
  const products = getProducts();
  const art = assets.filter((a) => ["artwork", "illustration", "photo", "graphic"].includes(a.type) && !a.tags.includes("hero") && !a.tags.includes("merch") && !a.tags.includes("logo"));
  const items = art.map((a) => {
    const product = products.find((p) => p.assetId === a.id && ["print", "digital-art"].includes(p.type));
    return { asset: a, product, priceLabel: product ? formatPrice(product).label : undefined, artistLabel: assetCredit(a) };
  });
  return (
    <>
      <PageHeader kicker="Art & video · with Baylingual Entertainment" title="Art & Video" accent="#8C7CFF">
        The triangle crew, music videos and stills. Tap any piece to see it big, or take one home as a print.
      </PageHeader>
      {videos.length > 0 && (
      <Section id="videos" kicker="Music videos" title="Watch" action={<ButtonLink href="/video" variant="secondary">All videos <Arrow /></ButtonLink>}>
        <ul className="no-scrollbar relative -mx-5 flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {videos.filter((v) => v.orientation === "portrait").map((v) => (
            <li key={v.id} className="w-[78vw] shrink-0 snap-center sm:w-auto">
              <VideoPlayer asset={v} sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 78vw" />
            </li>
          ))}
        </ul>
        {videos.filter((v) => v.orientation !== "portrait").map((v) => (
          <VideoPlayer key={v.id} asset={v} className="mt-12" />
        ))}
      </Section>
      )}
      <Section id="gallery" kicker="Visual art" title="Gallery" tone="raised">
        <MediaGallery items={items} artists={catalog.artists.map((a) => ({ slug: a.slug, name: a.name }))} />
      </Section>
    </>
  );
}
