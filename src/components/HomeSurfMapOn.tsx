import { SurfMapZoom } from "./SurfMapZoom";

/** Home surf-map section. Imported only when publicSurfMapVisible is true (see HomeSurfMapGate). */
export function HomeSurfMapSection() {
  return (
    <section id="surf-map" aria-labelledby="surf-map-title" className="px-5 pb-20 sm:px-8" data-home-surf-map>
      <div className="mx-auto grid max-w-[1120px] items-center gap-8 md:grid-cols-[1fr_420px] md:gap-10">
        <div className="text-center md:text-left">
          <p className="text-xs font-bold tracking-[2px] text-muted uppercase">Map</p>
          <h2 id="surf-map-title" className="brand-h mt-3 text-[clamp(2rem,6vw,44px)] tracking-[2px]">San Diego surf map</h2>
          <p className="mt-4 text-cream-dim">Tap or click the map, then pinch or scroll to zoom in and look around.</p>
        </div>
        <SurfMapZoom alt="Illustrated map of the San Diego coastline and its surf spots" />
      </div>
    </section>
  );
}
