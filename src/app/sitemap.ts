import type { MetadataRoute } from "next";

export const dynamic = "force-static";
import { catalog } from "@/lib/catalog";
import { siteUrl } from "@/lib/env";
import { AGREEMENTS } from "@/lib/licenses";
import { publicMusicVisible } from "@/lib/public-visibility";

const ALL_ROUTES = ["/", "/music", "/music/songs", "/artists", "/art", "/video", "/shop", "/shop/merch", "/shop/sample-packs", "/services", "/support", "/contact", "/licensing", "/licensing/beat-lease"];
const ROUTES = publicMusicVisible() ? ALL_ROUTES : ALL_ROUTES.filter((p) => p !== "/music" && p !== "/music/songs");

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [...ROUTES, ...catalog.artists.map((a) => `/artists/${a.slug}`), ...AGREEMENTS.map((a) => `/licensing/${a.slug}`)].map((p) => ({ url: `${base}${p === "/" ? "/" : `${p}/`}`, changeFrequency: "weekly", priority: p === "/" ? 1 : 0.7 }));
}
