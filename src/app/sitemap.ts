import type { MetadataRoute } from "next";

export const dynamic = "force-static";
import { catalog } from "@/lib/catalog";
import { siteUrl } from "@/lib/env";
import { AGREEMENTS } from "@/lib/licenses";
import { publicArtistVisible, publicFilmVisible, publicMusicVisible } from "@/lib/public-visibility";

const ALL_ROUTES = ["/", "/music", "/music/songs", "/artists", "/art", "/video", "/shop", "/shop/merch", "/shop/sample-packs", "/services", "/support", "/contact", "/licensing", "/licensing/beat-lease"];
const ROUTES = ALL_ROUTES.filter((p) => {
  if (!publicMusicVisible() && (p === "/music" || p === "/music/songs")) return false;
  if (!publicFilmVisible() && p === "/video") return false;
  return true;
});

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [...ROUTES, ...catalog.artists.filter((a) => publicArtistVisible(a.slug)).map((a) => `/artists/${a.slug}`), ...AGREEMENTS.map((a) => `/licensing/${a.slug}`)].map((p) => ({ url: `${base}${p === "/" ? "/" : `${p}/`}`, changeFrequency: "weekly", priority: p === "/" ? 1 : 0.7 }));
}
