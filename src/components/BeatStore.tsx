import { getBeats } from "@/lib/catalog";
import { beatTileData, offerTemplate } from "./BeatCard";
import { TrackList } from "./player/TrackList";

/**
 * The beat store: one minimal list (search + light sort) wired to the global mini-player.
 * Reads whatever content/beats.json holds at build time; catalog order keeps Deserts first.
 */
export function BeatStore({ id = "beats" }: { id?: string }) {
  const beats = getBeats("rapper");
  if (!beats.length) return null;
  const rows = beats.map((b, i) => ({ ...beatTileData(b), badge: i === 0 ? "Featured" : undefined }));
  const tpl = offerTemplate();
  return (
    <div data-beat-store style={{ ["--tl-accent" as string]: "#FF7A59" }}>
      <TrackList id={id} tracks={rows} offerTemplate={tpl} search sort label="Beats" noun="beats" />
      <p className="mt-6 text-xs text-muted">
        Every beat: {tpl.map((o) => { const t = o.title.replace("__title__: ", ""); return `${t} ${o.priceLabel}${/^(Stems lease|Exclusive rights)$/.test(t) ? " (coming soon)" : ""}`; }).join(" · ")}. BPM and key are shown only where they could be measured reliably.
      </p>
    </div>
  );
}
