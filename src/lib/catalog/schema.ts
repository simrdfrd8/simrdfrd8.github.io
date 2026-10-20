import { z } from "zod";

/**
 * Typed, validated content model for Flavorful Music.
 * Every JSON file in /content is parsed through these schemas at build time
 * (src/lib/catalog/index.ts) and in unit tests, so a malformed edit fails fast.
 */

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be kebab-case");
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "must be #RRGGBB");
const url = z.string().url();

export const LinkSchema = z.object({
  platform: z.enum(["instagram", "soundcloud", "spotify", "apple-music", "youtube", "tiktok", "bandcamp", "kofi", "website", "email"]),
  url,
  label: z.string().optional(),
  verified: z.boolean().default(false),
});

export const EventSchema = z.object({
  date: z.string(), // ISO date or "TBA"
  title: z.string(),
  venue: z.string().optional(),
  city: z.string().optional(),
  url: url.optional(),
  placeholder: z.boolean().default(true),
});

export const ArtistSchema = z.object({
  slug,
  name: z.string(),
  /** Short display form, e.g. "720M" for 720Mission. */
  shortName: z.string().optional(),
  role: z.string(),
  tagline: z.string(),
  bio: z.array(z.string()).min(1),
  bioStatus: z.enum(["draft", "approved"]).default("draft"),
  accent: hex,
  /** Text colour that meets WCAG AA on the accent. */
  accentInk: hex,
  genres: z.array(z.string()).default([]),
  disciplines: z.array(z.string()).default([]),
  links: z.array(LinkSchema).default([]),
  heroAssetId: z.string().optional(),
  portraitAssetId: z.string().optional(),
  /** Square logo / avatar mark shown next to the name. */
  markAssetId: z.string().optional(),
  featured: z.boolean().default(false),
  order: z.number().int().default(100),
  bookable: z.boolean().default(false),
  bookingNote: z.string().optional(),
  events: z.array(EventSchema).default([]),
  highlights: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
  serviceSlugs: z.array(slug).default([]),
  /** Optional decorative motif for the artist page hero. */
  motif: z.enum(["none", "triangles"]).default("none"),
  packages: z.array(z.object({ title: z.string(), detail: z.string() })).default([]),
  /** Umbrella identity this one sits under (e.g. a label imprint under its artist). Pages stay separate. */
  parentArtist: slug.optional(),
  /** "rich" pages render every optional section (discography, mixes, events, booking). */
  layout: z.enum(["standard", "rich"]).default("standard"),
  /** Brand shade (Bruise palette): Hip-Hop · EDM · Production, in that order. Unset = not a showcased artist. */
  category: z.enum(["hip-hop", "edm", "production"]).optional(),
  /** false = keeps its page but is left out of the roster (e.g. the people who run the label). */
  listed: z.boolean().default(true),
  /** Homepage card copy (Brandy's copy doc wins on wording). */
  cardRole: z.string().optional(),
  cardBlurb: z.string().optional(),
  /** "Made with friends" line under the bio. */
  madeWith: z.string().optional(),
  /** Hero subline, e.g. "aka 720Mission · San Diego". */
  aka: z.string().optional(),
});

export const CATEGORIES = [
  { id: "hip-hop", label: "Hip-Hop", color: "#FF7A59", shade: "shade-hiphop" },
  { id: "edm", label: "EDM", color: "#B6FF3B", shade: "shade-edm" },
  { id: "production", label: "Production", color: "#8C7CFF", shade: "shade-prod" },
] as const;
export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const ReleaseSchema = z.object({
  id: slug,
  title: z.string(),
  artist: slug,
  type: z.enum(["single", "ep", "album", "mix", "playlist"]),
  year: z.number().int().optional(),
  spotify: z
    .object({
      kind: z.enum(["track", "album", "artist", "playlist"]),
      id: z.string().regex(/^[A-Za-z0-9]{22}$/, "Spotify ids are 22 base62 chars"),
    })
    .optional(),
  artworkAssetId: z.string().optional(),
  featured: z.boolean().default(false),
  order: z.number().int().default(100),
  verified: z.boolean().default(false),
  productIds: z.array(z.string()).default([]),
  description: z.string().optional(),
  artworkUrl: z.string().optional(),
  explicit: z.boolean().default(false),
  trackCount: z.number().int().optional(),
  externalUrls: z.array(z.object({ platform: z.string(), url: z.string().url() })).default([]),
  /** Project / series label printed on the cover, e.g. "The Psychadelic Shorty". */
  series: z.string().optional(),
  /** Credits beyond the primary artist; id refers to collaborators.json. */
  credits: z.array(z.object({ id: slug, role: z.enum(["producer", "featuring", "collaborator"]) })).default([]),
});

export const SoundCloudTrackSchema = z.object({
  id: slug,
  url: z.string().url().refine((u) => /^https:\/\/(on\.)?soundcloud\.com\//.test(u), "must be a soundcloud.com URL"),
  title: z.string(),
  kind: z.enum(["track", "playlist"]).default("track"),
  /** Numeric SoundCloud API id; the widget is pointed at api.soundcloud.com/{kind}s/{scId} when present. */
  scId: z.number().int().optional(),
  /** Primary uploader identity. */
  artist: slug.default("flavorful-croissants"),
  /** Everyone credited (primary included). See the attribution rules in docs/CONTENT.md. */
  artists: z.array(slug).default([]),
  featuring: z.array(slug).default([]),
  /** solo = Flavorful Croissants production; 720m-collab = legacy "Ricky" credit; collab = other named features. */
  credit: z.enum(["solo", "720m-collab", "collab"]).default("solo"),
  /** Solo productions are made for DJs or for rappers. */
  audience: z.enum(["dj", "rapper", "producer"]).optional(),
  /** true when audience was guessed from genre/tags; correct it here by hand. */
  audienceInferred: z.boolean().default(false),
  /** External (non-label) collaborators named in the credits. */
  collaborators: z.array(z.string()).default([]),
  /** Clean title for display (legacy credit suffixes removed). Falls back to title. */
  displayTitle: z.string().optional(),
  /** Original SoundCloud title, unchanged. */
  sourceTitle: z.string().optional(),
  /** Local optimized copy of the official SoundCloud artwork (same image the player shows). */
  artworkUrl: z.string().optional(),
  date: z.string().optional(),
  tags: z.array(z.string()).default([]),
  /** Where the description text came from. */
  descriptionSource: z.enum(["public-metadata", "editorial", "placeholder"]).default("placeholder"),
  artworkAssetId: z.string().optional(),
  description: z.string().optional(),
  genre: z.string().optional(),
  durationSec: z.number().optional(),
  featured: z.boolean().default(false),
  order: z.number().int().default(100),
  verified: z.boolean().default(false),
  productIds: z.array(z.string()).default([]),
  /** false = the uploader disabled embedding; render a link card to SoundCloud instead of a player. */
  embeddable: z.boolean().default(true),
  /** Curated collections this track belongs to (see content/collections.json), e.g. "fc-x-720m". */
  collections: z.array(slug).default([]),
  /** Position inside its collection (song order from collections.json). */
  collectionOrder: z.number().int().optional(),
});

/** Self-hosted beats for sale (full-length streaming MP3 + peaks; masters are never served). */
export const BeatSchema = z.object({
  id: slug,
  title: z.string(),
  artist: slug,
  audience: z.enum(["dj", "rapper"]),
  /** Streaming MP3 + waveform peaks, both served from NEXT_PUBLIC_MEDIA_BASE (Cloudflare R2), never committed. */
  audio: z.object({ src: z.string(), peaksSrc: z.string(), durationSec: z.number(), format: z.string() }).optional(),
  /** Public Payhip product page (payhip.com/b/…) for the MP3 + WAV leases. Only used when checkout is switched on. */
  payhipUrl: z.string().url().optional(),
  /** SoundCloud track id of a released song that uses this beat (only when matched). */
  heardOn: z.string().optional(),
  /** Public SoundCloud song using this beat when it isn't in content/soundcloud.json (verified public permalink). */
  heardOnUrl: z.string().url().optional(),
  heardOnTitle: z.string().optional(),
  /** Only fill when measured reliably; otherwise leave empty. */
  bpm: z.number().optional(),
  key: z.string().optional(),
  genre: z.string().optional(),
  coverAssetId: z.string().optional(),
  publishApproved: z.boolean().default(false),
  status: z.enum(["available", "upcoming", "draft"]),
  featured: z.boolean().default(false),
  order: z.number().int().default(100),
});
export const BeatsFile = z.array(BeatSchema);
export type Beat = z.infer<typeof BeatSchema>;

export const CollectionsFile = z.object({
  _note: z.string().optional(),
  collections: z.array(
    z.object({
      id: slug,
      title: z.string(),
      kicker: z.string(),
      blurb: z.string(),
      /** Credit applied to every track in the collection (owner instruction; overrides title rules). */
      artists: z.array(slug).min(1),
      source: z.string().optional(),
      videoAssetIds: z.array(z.string()).default([]),
      songs: z.array(z.object({ song: z.string(), files: z.array(z.string()).default([]), urls: z.array(z.string().url()).min(1), note: z.string().optional() })),
      unmatched: z.array(z.string()).default([]),
    }),
  ),
  extraTracks: z
    .array(z.object({ url: z.string().url(), title: z.string(), trackId: z.number().int(), date: z.string(), duration: z.number().optional(), genre: z.string().optional(), embeddable: z.boolean(), artworkLocal: z.string().optional() }))
    .default([]),
});
export type Collections = z.infer<typeof CollectionsFile>;

export const PreviewSchema = z.object({
  format: z.enum(["avif", "webp", "jpg", "mp4"]),
  width: z.number().int(),
  height: z.number().int().optional(),
  src: z.string(),
});

export const AssetSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  type: z.enum(["artwork", "photo", "cover", "illustration", "video", "audio", "merch-design", "graphic"]),
  artist: slug.nullable().default(null),
  project: z.string().nullable().default(null),
  source: z.enum(["soundcloud", "instagram", "placeholder", "owner-upload"]),
  sourcePath: z.string().optional(),
  provenance: z.string().optional(),
  license: z.enum(["owned", "unverified", "third-party"]),
  publishApproved: z.boolean().default(false),
  orientation: z.enum(["portrait", "landscape", "square"]),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  year: z.number().int().optional(),
  dominantColor: hex.optional(),
  lqip: z.string().optional(),
  previews: z.array(PreviewSchema).default([]),
  poster: z.array(PreviewSchema).default([]),
  durationSec: z.number().optional(),
  featured: z.boolean().default(false),
  /** Co-credited label identities (incl. `artist`), e.g. ["720m","flavorful-croissants"] → "720M × Flavorful Croissants". */
  artists: z.array(slug).default([]),
  /** true when artist/project attribution was guessed from filenames. */
  artistInferred: z.boolean().default(false),
  /** External collaborators (not label identities): credited by name only. */
  collaborators: z
    .array(z.object({ id: slug.optional(), name: z.string(), role: z.string().optional(), rights: z.enum(["confirmed", "collaborator-rights-unconfirmed"]).default("collaborator-rights-unconfirmed") }))
    .default([]),
  /** Official Instagram post for this piece; when set, an embed/link can be shown later. */
  instagramPostUrl: z.string().url().refine((u) => /^https:\/\/www\.instagram\.com\/(p|reel)\//.test(u), "must be an instagram.com/p/ or /reel/ URL").optional(),
});

export const ProductTypeSchema = z.enum([
  "download",
  "stems",
  "license",
  "print",
  "digital-art",
  "sample-pack",
  "service",
  "merch",
  "support",
]);

export const ProductSchema = z.object({
  id: slug,
  title: z.string(),
  assetId: z.string().nullable().default(null),
  artist: slug.nullable().default(null),
  type: ProductTypeSchema,
  /** Price in major units. null = "by inquiry". 0 + payWhatYouWant = PWYW. */
  price: z.number().nonnegative().nullable(),
  currency: z.enum(["USD", "EUR", "GBP"]).default("USD"),
  payWhatYouWant: z.boolean().default(false),
  /** Illustrative prices stay false until Flavorful signs off. */
  priceApproved: z.boolean().default(false),
  status: z.enum(["available", "upcoming", "draft"]),
  checkoutProvider: z.enum(["payhip", "kofi", "stripe", "none"]),
  checkoutUrl: z.string().url().nullable().default(null),
  licenseTerms: z.string().nullable().default(null),
  summary: z.string(),
  /** Official embed artwork (local copy) used when there is no catalog asset. */
  artworkUrl: z.string().optional(),
  includes: z.array(z.string()).default([]),
  /** Not purchasable on the site (e.g. physical merch while fulfilment isn't set up): no price, no buy button, inquiry link only. */
  inquireOnly: z.boolean().default(false),
  /** false = hidden from the store (kept in the catalog, reversible). Unlisted merch can still show as brand art. */
  listed: z.boolean().default(true),
  unlistedNote: z.string().optional(),
  /** Merch brand line (artist slug, e.g. "baylingual-entertainment"); null = general Flavorful Music. */
  brand: slug.nullable().default(null),
  /** Extra assets shown with the product (lifestyle photos, videos). */
  galleryAssetIds: z.array(z.string()).default([]),
  /** Merch colorways (scripts/import-merch.mjs): one image asset each, picked with a swatch picker on the card.
   *  Visibility follows each asset's publishApproved, so unapproved colorways only show in the preview build. */
  colorways: z
    .array(
      z.object({
        name: z.string(),
        slug,
        /** Front view: also the swatch thumbnail and the default image. */
        assetId: z.string(),
        /** Merch v2 views (scripts/import-merch.mjs, store-v2): optional per colorway. */
        backAssetId: z.string().optional(),
        modelFrontAssetId: z.string().optional(),
        modelBackAssetId: z.string().optional(),
        /** Shirt colour (CSV shirt_hex) for the swatch, and the print/ink colour (ink_hex). */
        swatch: hex.optional(),
        ink: hex.optional(),
      }),
    )
    .default([]),
  /** Colorway whose model shots stand in for colorways that have none (defaults to the first colorway with model shots). */
  heroColorway: slug.optional(),
  /** Preview-only copy (e.g. new CSV copy for an approved product): shown in the preview build; production keeps title/summary until sign-off. */
  previewTitle: z.string().optional(),
  previewSummary: z.string().optional(),
  /** Lifestyle photos shown as extra images inside the colorway gallery (not as separate grid tiles). */
  lifestyleAssetIds: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  order: z.number().int().default(100),
  _note: z.string().optional(),
});

export const ServiceSchema = z.object({
  slug,
  title: z.string(),
  provider: slug,
  summary: z.string(),
  deliverables: z.array(z.string()),
  startingAt: z.string().optional(), // human string, e.g. "From $150 (illustrative)"
  inquiryType: z.enum(["booking", "business", "collab", "licensing", "commission", "service"]).default("service"),
});

export const LicenseTierSchema = z.object({
  id: slug,
  name: z.string(),
  price: z.string(),
  bestFor: z.string(),
  rights: z.array(z.string()),
  limits: z.array(z.string()),
  highlighted: z.boolean().default(false),
  /** Slug of the full agreement in content/licenses/ (rendered at /licensing/<agreement>). */
  agreement: slug.optional(),
});

export const SiteSchema = z.object({
  name: z.string(),
  domain: z.string(),
  tagline: z.string(),
  description: z.string(),
  partner: z.object({ name: z.string(), slug }),
  supportUrl: z.string().url().nullable(),
  email: z.string().nullable(),
  socials: z.array(LinkSchema),
});

export const LaneOfferSchema = z.object({
  id: slug,
  title: z.string(),
  type: ProductTypeSchema,
  price: z.number().nonnegative().nullable(),
  status: z.enum(["available", "upcoming", "draft"]),
  summary: z.string(),
  terms: z.string(),
  licenseTierId: slug.optional(),
  /** true once the owner has approved this price (2026-10-20: rapper beat tiers). */
  priceApproved: z.boolean().default(false),
  /** Slug of the full agreement in content/licenses/ (rendered at /licensing/<agreement>). */
  agreement: slug.optional(),
});
export const ProductTemplatesSchema = z.object({
  lanes: z.object({
    dj: z.object({ label: z.string(), blurb: z.string(), primary: slug, offers: z.array(LaneOfferSchema).min(1) }),
    rapper: z.object({ label: z.string(), blurb: z.string(), primary: slug, offers: z.array(LaneOfferSchema).min(1) }),
    producer: z.object({ label: z.string(), blurb: z.string() }),
  }),
});
export type LaneOffer = z.infer<typeof LaneOfferSchema>;
export type Lane = "dj" | "rapper" | "producer";

/** Sample packs for producers (the "For Producers" lane). */
export const SamplePackSchema = z.object({
  id: slug,
  title: z.string(),
  /** true = layout/example entry; contents are illustrative, not a real pack yet. */
  example: z.boolean().default(false),
  coverAssetId: z.string().nullable().default(null),
  demo: z.object({ soundcloudUrl: z.string().url().optional(), scId: z.number().int().optional(), clipSrc: z.string().optional() }).default({}),
  contents: z.array(z.string()),
  format: z.string(),
  fileSize: z.string().optional(),
  bpmRange: z.string().optional(),
  keys: z.string().optional(),
  genres: z.array(z.string()).default([]),
  license: z.string(),
  price: z.number().nonnegative(),
  currency: z.enum(["USD", "EUR", "GBP"]).default("USD"),
  priceApproved: z.boolean().default(false),
  status: z.enum(["available", "upcoming", "draft"]),
  checkoutProvider: z.enum(["payhip", "kofi", "stripe", "none"]).default("payhip"),
  checkoutUrl: z.string().url().nullable().default(null),
  order: z.number().int().default(100),
});
export const SamplePacksFile = z.array(SamplePackSchema);
export type SamplePack = z.infer<typeof SamplePackSchema>;

export const CollaboratorSchema = z.object({
  id: slug,
  name: z.string(),
  note: z.string().optional(),
  links: z.array(LinkSchema).default([]),
  rights: z.enum(["confirmed", "collaborator-rights-unconfirmed"]).default("collaborator-rights-unconfirmed"),
});
export const CollaboratorsFile = z.array(CollaboratorSchema);
export type Collaborator = z.infer<typeof CollaboratorSchema>;

export type Artist = z.infer<typeof ArtistSchema>;
export type Release = z.infer<typeof ReleaseSchema>;
export type SoundCloudTrack = z.infer<typeof SoundCloudTrackSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type Preview = z.infer<typeof PreviewSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type ProductType = z.infer<typeof ProductTypeSchema>;
export type Service = z.infer<typeof ServiceSchema>;
export type LicenseTier = z.infer<typeof LicenseTierSchema>;
export type Site = z.infer<typeof SiteSchema>;

export const ArtistsFile = z.array(ArtistSchema);
export const ReleasesFile = z.array(ReleaseSchema);
export const SoundCloudFile = z.array(SoundCloudTrackSchema);
export const AssetsFile = z.array(AssetSchema);
export const ProductsFile = z.array(ProductSchema);
export const ServicesFile = z.array(ServiceSchema);
export const LicensesFile = z.array(LicenseTierSchema);
