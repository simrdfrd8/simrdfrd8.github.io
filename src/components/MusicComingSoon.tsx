import { PageHeader } from "./PageHeader";
import { MUSIC_COMING_SOON } from "@/lib/public-visibility";

/** Minimal placeholder for music routes while the public catalog is hidden for review. No lists, players, or promo blocks. */
export function MusicComingSoon({ title }: { title: string }) {
  return <PageHeader kicker="Flavorful Music" title={title} accent="#F8E8D2">{MUSIC_COMING_SOON}</PageHeader>;
}
