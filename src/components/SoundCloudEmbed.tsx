import { ListenLink } from "./ListenLink";

/** Retired iframe player: now a single plain link (full-length listening on-site uses the global list player). */
export function SoundCloudEmbed({ url, title }: { url: string; scId?: number; kind?: "track" | "playlist"; title: string; artworkUrl?: string; subtitle?: string; verified: boolean; size?: "md" | "lg" }) {
  return <ListenLink href={url} platform="SoundCloud" title={title} />;
}
