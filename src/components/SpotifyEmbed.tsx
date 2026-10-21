import { ListenLink } from "./ListenLink";

/** Retired iframe player: now a single plain link to the Spotify page. */
export function SpotifyEmbed({ kind, id, title }: { kind: "track" | "album" | "artist" | "playlist"; id: string; title: string; compact?: boolean; facade?: { label: string; note?: string } }) {
  return <ListenLink href={`https://open.spotify.com/${kind}/${id}`} platform="Spotify" title={title} />;
}
