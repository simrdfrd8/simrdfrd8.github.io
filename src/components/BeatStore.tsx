import { getBeats } from "@/lib/catalog";
import { BeatCard, beatTileData, offerTemplate } from "./BeatCard";
import { BeatBrowser } from "./BeatBrowser";

/** Featured beat on top (Deserts), then the searchable catalog of every other beat. */
export function BeatStore() {
  const beats = getBeats("rapper");
  if (!beats.length) return null;
  const [featured, ...rest] = beats;
  return (
    <div className="flex flex-col gap-16" data-beat-store>
      <div className="max-w-4xl">
        <BeatCard beat={featured} wide />
      </div>
      {rest.length > 0 && <BeatBrowser beats={rest.map(beatTileData)} offerTemplate={offerTemplate()} />}
    </div>
  );
}
