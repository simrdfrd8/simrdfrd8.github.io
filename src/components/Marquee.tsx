import { listedArtists } from "@/lib/catalog";

export function Marquee() {
  const names = listedArtists();
  const row = (hidden?: boolean) => (
    <ul className="flex shrink-0 items-center gap-10 pr-10" aria-hidden={hidden || undefined}>
      {names.map((a) => (
        <li key={a.slug} className="display flex items-center gap-10 text-5xl whitespace-nowrap md:text-7xl">
          <span style={{ color: a.accent }}>{a.name}</span>
          <svg viewBox="0 0 10 10" className="h-4 w-4 fill-cream/40" aria-hidden="true">
            <polygon points="5,0 10,10 0,10" />
          </svg>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="overflow-hidden border-y border-line py-6" role="region" aria-label="Flavorful Music artists">
      <div className="flex w-max animate-marquee motion-reduce:animate-none">
        {row()}
        {row(true)}
      </div>
    </div>
  );
}
