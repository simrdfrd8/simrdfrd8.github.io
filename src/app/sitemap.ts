import type { MetadataRoute } from "next";

export const dynamic = "force-static";
import { catalog } from "@/lib/catalog";
import { siteUrl } from "@/lib/env";
import { AGREEMENTS } from "@/lib/licenses";

const ROUTES = ["/", "/music", "/artists", "/art", "/video", "/shop", "/shop/merch", "/shop/sample-packs", "/services", "/support", "/contact", "/licensing"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [...ROUTES, ...catalog.artists.map((a) => `/artists/${a.slug}`), ...AGREEMENTS.map((a) => `/licensing/${a.slug}`)].map((p) => ({ url: `${base}${p === "/" ? "/" : `${p}/`}`, changeFrequency: "weekly", priority: p === "/" ? 1 : 0.7 }));
}
