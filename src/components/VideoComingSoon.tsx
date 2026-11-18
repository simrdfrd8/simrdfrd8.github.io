import { PageHeader } from "./PageHeader";
import { VIDEO_COMING_SOON } from "@/lib/public-visibility";

/** Minimal placeholder for /video/ while the brand film is hidden. No players or promo blocks. */
export function VideoComingSoon() {
  return (
    <PageHeader kicker="Flavorful Music" title="Video" accent="#B6FF3B">
      <span data-videos-soon>{VIDEO_COMING_SOON}</span>
    </PageHeader>
  );
}
