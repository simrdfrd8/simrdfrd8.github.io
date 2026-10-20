/**
 * Build-time site mode.
 *
 *  - "preview"    (default for `next dev`, or any build with SITE_PREVIEW=1):
 *                 unapproved assets render with a "PREVIEW – not approved" watermark,
 *                 placeholder/unverified catalog entries are shown, robots are blocked.
 *  - "production" (default for `next build` without SITE_PREVIEW): only
 *                 publishApproved assets and verified embeds render.
 *
 * Commerce is never live unless COMMERCE_LIVE=1 is set explicitly.
 */
export type SiteMode = "preview" | "production";

export function getSiteMode(): SiteMode {
  if (process.env.SITE_PREVIEW === "1" || process.env.NEXT_PUBLIC_SITE_PREVIEW === "1") return "preview";
  if (process.env.SITE_PREVIEW === "0") return "production";
  return process.env.NODE_ENV === "production" ? "production" : "preview";
}

export const isPreview = () => getSiteMode() === "preview";

export const commerceLive = () => process.env.COMMERCE_LIVE === "1";

/**
 * Public checkout switch. Off (the default) = every buy button reads "Coming soon" and nothing links to a provider.
 * Turn on with NEXT_PUBLIC_CHECKOUT_LIVE=1 at build time, after re-exporting content with Payhip URLs
 * (public-export/export-content.py --payhip).
 */
export const CHECKOUT_LIVE = process.env.NEXT_PUBLIC_CHECKOUT_LIVE === "1";
/** Lease tiers sold through the per-beat Payhip product. */
export const PAYHIP_TIERS = ["mp3-lease", "wav-lease"];

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "https://flavorfulmusic.com").replace(/\/$/, "");

/**
 * Base URL for beat audio + waveform peaks (Cloudflare R2 public bucket, e.g. https://media.flavorfulmusic.com).
 * Keys keep the site paths: <base>/media/beat-<id>/audio.mp3 and peaks.json. Unset (local dev) = served from /public/media.
 * Only beat audio goes through here; images and the one short video are part of the site itself.
 */
export const mediaBase = () => (process.env.NEXT_PUBLIC_MEDIA_BASE ?? "").replace(/\/$/, "");
export const mediaUrl = (src?: string) => (src && src.startsWith("/media/") ? `${mediaBase()}${src}` : src);
