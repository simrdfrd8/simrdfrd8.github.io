import songs from "../../content/songs.json";
import { mediaUrl } from "@/lib/env";
import { artistName, creditLine } from "@/lib/catalog";
import { TrackList, type TrackRow } from "./player/TrackList";

/** artists = co-credited ("720M × Flavorful Croissants"); featuring = "ft." credit; genre = small plain label on the row. */
type Song = { id: string; title: string; artist: string; artists?: string[]; featuring?: string[]; genre?: string; src: string; durationSec?: number };

const credit = (s: Song) => {
  const base = s.artists?.length ? creditLine({ artist: s.artist, artists: s.artists, collaborators: [] }) : artistName(s.artist);
  return s.featuring?.length ? `${base} ft. ${s.featuring.map(artistName).join(", ")}` : base;
};

/** Released, self-hosted full-length songs on the shared list + global player. No autoplay. */
export function songsFor(artist?: string): TrackRow[] {
  return (songs.songs as Song[])
    .filter((s) => !artist || s.artist === artist)
    .map((s) => ({ id: s.id, title: s.title, src: mediaUrl(s.src), durationSec: s.durationSec, audience: "listener", subtitle: credit(s), badge: s.genre }));
}

export function SongList({ id, artist }: { id: string; artist?: string }) {
  const rows = songsFor(artist);
  if (!rows.length) return null;
  return <TrackList id={id} tracks={rows} label="Songs" noun="songs" pageSize={50} />;
}
