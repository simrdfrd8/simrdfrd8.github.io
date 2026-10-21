import songs from "../../content/songs.json";
import { mediaUrl } from "@/lib/env";
import { artistName } from "@/lib/catalog";
import { TrackList, type TrackRow } from "./player/TrackList";

type Song = { id: string; title: string; artist: string; src: string; durationSec?: number };

/** Released, self-hosted full-length songs on the shared list + global player. No autoplay. */
export function songsFor(artist?: string): TrackRow[] {
  return (songs.songs as Song[])
    .filter((s) => !artist || s.artist === artist)
    .map((s) => ({ id: s.id, title: s.title, src: mediaUrl(s.src), durationSec: s.durationSec, audience: "listener", subtitle: artistName(s.artist) }));
}

export function SongList({ id, artist }: { id: string; artist?: string }) {
  const rows = songsFor(artist);
  if (!rows.length) return null;
  return <TrackList id={id} tracks={rows} label="Songs" noun="songs" pageSize={50} />;
}
