import type { NextConfig } from "next";

/**
 * Static export for GitHub Pages (custom domain flavorfulmusic.com, so no basePath by default).
 * Set NEXT_PUBLIC_BASE_PATH (e.g. "/flavorful-music-site") only if the site is ever served from a project sub-path.
 * Beat audio + peaks come from NEXT_PUBLIC_MEDIA_BASE (Cloudflare R2), never from this repo.
 */
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

/** The price display demo (src/app/price-demo/page.demo.tsx, example data) only exists in a PRICE_DEMO=1 screenshot build. */
const pageExtensions = ["tsx", "ts", "jsx", "js", ...(process.env.PRICE_DEMO === "1" ? ["demo.tsx"] : [])];

const nextConfig: NextConfig = {
  output: "export",
  pageExtensions,
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
};

export default nextConfig;
