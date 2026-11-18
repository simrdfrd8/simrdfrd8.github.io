import { isPreview } from "@/lib/env";
import { BrandFilm, type FilmSource } from "./BrandFilm";
import film from "../../content/film.json";

/** Home brand-film section. Imported only when publicFilmVisible is true (see HomeFilmGate). */
export function HomeFilmSection() {
  const filmSources = film.approved || isPreview() ? (film as { sources?: FilmSource[] }).sources : undefined;
  return (
    <section id="films" aria-label="Film" className="px-5 pb-20 sm:px-8">
      <div className="mx-auto grid max-w-[1120px] items-center gap-10 md:grid-cols-[1fr_360px]">
        <div className="text-center md:text-left">
          <p className="text-xs font-bold tracking-[2px] text-muted uppercase">Film</p>
          <h2 className="brand-h mt-3 text-[clamp(2rem,6vw,44px)] tracking-[2px]">Make art with friends.</h2>
        </div>
        <BrandFilm sources={filmSources} poster={film.poster} title={film.title} />
      </div>
    </section>
  );
}
