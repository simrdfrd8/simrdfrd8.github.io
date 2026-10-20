import type { Metadata } from "next";
import { visibleAssets } from "@/lib/catalog";
import { PageHeader } from "@/components/PageHeader";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ButtonLink, Section } from "@/components/ui";

export const metadata: Metadata = { title: "Video", description: "Music videos and animation from Flavorful Music and Baylingual Entertainment.", alternates: { canonical: "/video" } };

export default function VideoPage() {
  const videos = visibleAssets().filter((a) => a.type === "video").sort((a, b) => Number(b.featured) - Number(a.featured));
  const landscape = videos.filter((v) => v.orientation !== "portrait");
  const portrait = videos.filter((v) => v.orientation === "portrait");
  return (
    <>
      <PageHeader kicker="Videos · animation" title="Video" accent="#B6FF3B">
        Shot vertical for your phone, wide for your screen. Every video plays at its original shape.
      </PageHeader>
      {landscape.length > 0 && (
        <Section kicker="Widescreen">
          <div className="grid gap-12">
            {landscape.map((v) => (
              <VideoPlayer key={v.id} asset={v} />
            ))}
          </div>
        </Section>
      )}
      <Section kicker="Vertical" title="For your phone" tone="raised" action={<ButtonLink href="/services#video" variant="secondary">Make a video with us</ButtonLink>}>
        {portrait.length > 0 ? (
          <div className="grid items-start gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {portrait.map((v) => (
              <VideoPlayer key={v.id} asset={v} sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" />
            ))}
          </div>
        ) : (
          !landscape.length && <p className="text-cream-dim" data-videos-soon>Videos coming soon.</p>
        )}
      </Section>
    </>
  );
}
