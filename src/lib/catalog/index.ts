import artistsJson from "@content/artists.json";
import labelArtistsJson from "@content/artists-label.json";
import releasesJson from "@content/releases.json";
import soundcloudJson from "@content/soundcloud.json";
import assetsJson from "@content/assets.json";
import productsJson from "@content/products.json";
import servicesJson from "@content/services.json";
import licensesJson from "@content/licenses.json";
import siteJson from "@content/site.json";
import collaboratorsJson from "@content/collaborators.json";
import templatesJson from "@content/product-templates.json";
import collectionsJson from "@content/collections.json";
import beatsJson from "@content/beats.json";
import packsJson from "@content/sample-packs.json";
import {
  ArtistsFile,
  CATEGORIES,
  AssetsFile,
  CollaboratorsFile,
  ProductTemplatesSchema,
  SamplePacksFile,
  CollectionsFile,
  BeatsFile,
  type Beat,
  type SamplePack,
  type Product,
  type SoundCloudTrack,
  type Lane,
  LicensesFile,
  ProductsFile,
  ReleasesFile,
  ServicesFile,
  SiteSchema,
  SoundCloudFile,
  type Asset,
} from "./schema";
import { isPreview } from "@/lib/env";
import { getSiteMode } from "../env";
import { isAssetVisible, sortByOrder, visibleProducts, visibleReleases, visibleTracks } from "./filters";

export * from "./schema";
export * from "./filters";

function parse<T>(name: string, schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } } }, data: unknown): T {
  const r = schema.safeParse(data);
  if (!r.success) {
    const msg = r.error.issues.map((i) => `  ${name}${i.path.length ? "[" + i.path.map(String).join(".") + "]" : ""}: ${i.message}`).join("\n");
    throw new Error(`Invalid content in content/${name}.json\n${msg}`);
  }
  return r.data;
}

export const catalog = {
  site: parse("site", SiteSchema, siteJson),
  artists: sortByOrder(parse("artists", ArtistsFile, [...artistsJson, ...labelArtistsJson])),
  releases: parse("releases", ReleasesFile, releasesJson),
  soundcloud: parse("soundcloud", SoundCloudFile, soundcloudJson),
  assets: parse("assets", AssetsFile, assetsJson),
  products: parse("products", ProductsFile, productsJson),
  services: parse("services", ServicesFile, servicesJson),
  licenses: parse("licenses", LicensesFile, licensesJson),
  collaborators: parse("collaborators", CollaboratorsFile, collaboratorsJson),
  templates: parse("product-templates", ProductTemplatesSchema, templatesJson),
  samplePacks: parse("sample-packs", SamplePacksFile, packsJson),
  collections: parse("collections", CollectionsFile, collectionsJson),
  beats: parse("beats", BeatsFile, beatsJson),
};

/** Real beats for sale. Production builds show only publishApproved ones. */
export const getBeats = (audience?: Beat["audience"]) =>
  catalog.beats.filter((b) => b.status !== "draft" && (isPreview() || b.publishApproved) && (!audience || b.audience === audience)).sort((a, b) => Number(b.featured) - Number(a.featured) || a.order - b.order);

export const getCollection = (id: string) => catalog.collections.collections.find((c) => c.id === id);
/** Tracks tagged with a collection, in the song order from collections.json. */
export const collectionTracks = (id: string) => {
  const urls = (getCollection(id)?.songs ?? []).flatMap((s) => s.urls);
  const pos = (u: string) => (urls.indexOf(u) < 0 ? 999 : urls.indexOf(u));
  return catalog.soundcloud.filter((t) => t.collections.includes(id)).sort((a, b) => pos(a.url) - pos(b.url));
};

export const getSamplePacks = () => catalog.samplePacks.filter((p) => p.status !== "draft").sort((a, b) => a.order - b.order);

/** A sample pack as a Product, so it shares CheckoutButton / ProductCard behaviour. */
export const packProduct = (p: SamplePack): Product => ({
  id: p.id, title: p.title, assetId: p.coverAssetId, artist: "flavorful-croissants", type: "sample-pack", price: p.price, currency: p.currency,
  payWhatYouWant: false, priceApproved: p.priceApproved, status: p.status, checkoutProvider: p.checkoutProvider, checkoutUrl: p.checkoutUrl,
  licenseTerms: p.license, summary: p.contents[0] ?? "", includes: p.contents, inquireOnly: false, listed: true, shopListed: true, brand: null, galleryAssetIds: [], colorways: [], lifestyleAssetIds: [], featured: false, order: p.order,
});

/** Lane offers for a solo production, built from content/product-templates.json (checkout gated by CHECKOUT_LIVE). */
export function laneOffers(track: Pick<SoundCloudTrack, "id" | "title" | "displayTitle" | "audience" | "artist" | "artworkUrl">): (Product & { terms: string; licenseTierId?: string; agreementUrl?: string })[] {
  if (!track.audience || track.audience === "producer") return [];
  const lane = catalog.templates.lanes[track.audience];
  return lane.offers
    .filter((o) => o.status !== "draft")
    .map((o, i) => ({
      id: `${track.id}--${o.id}`, title: `${track.displayTitle ?? track.title}: ${o.title}`, assetId: null, artist: track.artist, type: o.type,
      price: o.price, currency: "USD" as const, payWhatYouWant: false, priceApproved: o.priceApproved, status: o.status,
      checkoutProvider: o.price === null ? ("none" as const) : ("payhip" as const), checkoutUrl: null, licenseTerms: o.terms,
      summary: o.summary, artworkUrl: track.artworkUrl, includes: [], inquireOnly: false, listed: true, shopListed: true, brand: null, galleryAssetIds: [], colorways: [], lifestyleAssetIds: [], featured: false, order: i, terms: o.terms, licenseTierId: o.licenseTierId,
      agreementUrl: o.agreement ? `/licensing/${o.agreement}` : undefined,
    }));
}
export const laneInfo = (lane: Lane) => catalog.templates.lanes[lane];
export const getCollaborator = (id?: string) => catalog.collaborators.find((c) => c.id === id);

const assetMap = new Map(catalog.assets.map((a) => [a.id, a]));
const mode = getSiteMode();

export const getAsset = (id?: string | null): Asset | undefined => {
  if (!id) return undefined;
  const a = assetMap.get(id);
  return a && isAssetVisible(a, mode) ? a : undefined;
};
export const getArtist = (slug: string) => catalog.artists.find((a) => a.slug === slug);
/** "720M × Flavorful Croissants" for co-credited assets, else the single artist name. */
export const assetCredit = (a: { artist: string | null; artists?: string[] }) =>
  a.artists && a.artists.length > 1 ? a.artists.map((x) => artistName(x)).join(" × ") : artistName(a.artist);
export const assetHasArtist = (a: { artist: string | null; artists?: string[] }, slug: string) => a.artist === slug || (a.artists ?? []).includes(slug);

const catRank = (a: { category?: string }) => { const i = CATEGORIES.findIndex((c) => c.id === a.category); return i === -1 ? CATEGORIES.length : i; };
/** The roster: listed identities, grouped by shade (Hip-Hop · EDM · Production), then by order. */
export const listedArtists = () => catalog.artists.filter((a) => a.listed).sort((a, b) => catRank(a) - catRank(b) || a.order - b.order);
export const categoryOf = (id?: string) => CATEGORIES.find((c) => c.id === id);
export const childArtists = (slug: string) => catalog.artists.filter((a) => a.parentArtist === slug).sort((a, b) => a.order - b.order);
/** Every listed merch product (each has a product page). */
export const merchProducts = () => getProducts().filter((p) => p.type === "merch");
/** Merch shown in the shop grids (the curated line): shopListed !== false, in `order`. */
export const shopMerchProducts = () => merchProducts().filter((p) => p.shopListed);
/** Merch grouped by brand line; brands with an artist page first, general Flavorful Music last. */
export const merchByBrand = () => {
  const groups = new Map<string | null, ReturnType<typeof merchProducts>>();
  for (const p of shopMerchProducts()) groups.set(p.brand, [...(groups.get(p.brand) ?? []), p]);
  return [...groups.entries()].sort(([a], [b]) => (a === null ? 1 : b === null ? -1 : 0)).map(([brand, items]) => ({ brand, name: brand ? artistName(brand) : "Flavorful Music", items }));
};

export const artistName = (slug?: string | null) => (slug ? getArtist(slug)?.name ?? slug : "Flavorful Music");

export const visibleAssets = () => catalog.assets.filter((a) => isAssetVisible(a, mode));
/** Store products: unlisted items are hidden everywhere a product is sold or linked. */
/** Preview build swaps in previewTitle/previewSummary; production always shows the approved title/summary. */
export const withPreviewCopy = <T extends { title: string; summary: string; previewTitle?: string; previewSummary?: string }>(p: T, m: typeof mode = mode): T =>
  m === "preview" && (p.previewTitle || p.previewSummary) ? { ...p, title: p.previewTitle ?? p.title, summary: p.previewSummary ?? p.summary } : p;
export const getProducts = () => visibleProducts(catalog.products, mode, catalog.assets).filter((p) => p.listed).map((p) => withPreviewCopy(p));
/** Unlisted apparel for a brand page, shown as artwork only (never as a store item). */
export const brandApparelAssets = (brand: string) =>
  visibleProducts(catalog.products, mode, catalog.assets)
    .filter((p) => p.type === "merch" && !p.listed && p.brand === brand)
    .flatMap((p) => [p.assetId, ...p.galleryAssetIds])
    .filter((id, i, all): id is string => !!id && all.indexOf(id) === i)
    .map((id) => getAsset(id))
    .filter((a) => a !== undefined);
export const getTracks = () => visibleTracks(catalog.soundcloud, mode);
export const getReleases = () => visibleReleases(catalog.releases, mode);
export const getProduct = (id: string) => getProducts().find((p) => p.id === id);
export const supportProduct = () => getProducts().find((p) => p.type === "support");

const short = (slug: string) => { const a = getArtist(slug); return a?.shortName ?? a?.name ?? slug; };
/** "720M × Flavorful Croissants", "Flavorful Croissants with tondo, azazaka", or "Flavorful Croissants". */
export function creditLine(t: { artist: string; artists: string[]; collaborators: string[] }) {
  const others = t.artists.filter((a) => a !== t.artist);
  const base = [...others.map(short), artistName(t.artist)].join(" × ");
  return t.collaborators.length ? `${base} with ${t.collaborators.join(", ")}` : base;
}
export const trackTitle = (t: { title: string; displayTitle?: string }) => t.displayTitle ?? t.title;
