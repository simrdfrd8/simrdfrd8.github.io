import { ArtistsFile, AssetsFile, CollaboratorsFile, SamplePacksFile, LicensesFile, ProductsFile, ReleasesFile, ServicesFile, SiteSchema, SoundCloudFile } from "./schema";

type Raw = Record<"artists" | "releases" | "soundcloud" | "assets" | "products" | "services" | "licenses" | "site", unknown> & { collaborators?: unknown; samplePacks?: unknown };

/** Schema + referential integrity checks. Returns human-readable problems (empty = OK). */
export function validateCatalog(raw: Raw): string[] {
  const out: string[] = [];
  const schemas = { artists: ArtistsFile, releases: ReleasesFile, soundcloud: SoundCloudFile, assets: AssetsFile, products: ProductsFile, services: ServicesFile, licenses: LicensesFile, site: SiteSchema } as const;
  const parsed: Record<string, unknown> = {};
  for (const [k, s] of Object.entries(schemas)) {
    const r = s.safeParse(raw[k as keyof Raw]);
    if (!r.success) r.error.issues.slice(0, 20).forEach((i) => out.push(`${k}.${i.path.join(".")}: ${i.message}`));
    else parsed[k] = r.data;
  }
  if (out.length) return out;
  const artists = ArtistsFile.parse(raw.artists);
  const assets = AssetsFile.parse(raw.assets);
  const products = ProductsFile.parse(raw.products);
  const releases = ReleasesFile.parse(raw.releases);
  const sc = SoundCloudFile.parse(raw.soundcloud);
  const services = ServicesFile.parse(raw.services);
  const slugs = new Set(artists.map((a) => a.slug));
  const assetIds = new Set(assets.map((a) => a.id));
  const productIds = new Set(products.map((p) => p.id));
  const dup = (name: string, ids: string[]) => ids.filter((x, i) => ids.indexOf(x) !== i).forEach((x) => out.push(`${name}: duplicate id ${x}`));
  dup("artists", artists.map((a) => a.slug));
  dup("assets", assets.map((a) => a.id));
  dup("products", products.map((p) => p.id));
  dup("soundcloud", sc.map((t) => t.id));
  for (const a of artists) {
    for (const ref of [a.heroAssetId, a.portraitAssetId, a.markAssetId]) if (ref && !assetIds.has(ref)) out.push(`artists.${a.slug}: unknown asset ${ref}`);
    for (const s of a.serviceSlugs) if (!services.some((x) => x.slug === s)) out.push(`artists.${a.slug}: unknown service ${s}`);
  }
  for (const p of products) {
    if (p.assetId && !assetIds.has(p.assetId)) out.push(`products.${p.id}: unknown asset ${p.assetId}`);
    for (const c of p.colorways) if (!assetIds.has(c.assetId)) out.push(`products.${p.id}: colorway ${c.slug} has unknown asset ${c.assetId}`);
    for (const id of p.lifestyleAssetIds) if (!assetIds.has(id)) out.push(`products.${p.id}: unknown lifestyle asset ${id}`);
    if (p.colorways.length && p.type !== "merch") out.push(`products.${p.id}: colorways are for merch only`);
    if (p.type === "merch" && (p.price !== null || p.checkoutUrl || !p.inquireOnly)) out.push(`products.${p.id}: merch must stay display-only (no price, no checkout)`);
    if (p.artist && !slugs.has(p.artist)) out.push(`products.${p.id}: unknown artist ${p.artist}`);
    if (p.checkoutProvider !== "none" && p.checkoutUrl && !/^https:\/\//.test(p.checkoutUrl)) out.push(`products.${p.id}: checkoutUrl must be https`);
    if (p.priceApproved === false && p.price !== null && p.status === "available" && p.checkoutUrl) out.push(`products.${p.id}: has a live checkoutUrl but price is not approved`);
  }
  for (const x of [...releases, ...sc]) {
    for (const id of x.productIds) if (!productIds.has(id)) out.push(`${x.id}: unknown product ${id}`);
    if (!slugs.has(x.artist)) out.push(`${x.id}: unknown artist ${x.artist}`);
  }
  const packs = SamplePacksFile.safeParse(raw.samplePacks ?? []);
  if (!packs.success) packs.error.issues.forEach((i) => out.push(`sample-packs.${i.path.join(".")}: ${i.message}`));
  else for (const p of packs.data) if (p.coverAssetId && !assetIds.has(p.coverAssetId)) out.push(`sample-packs.${p.id}: unknown asset ${p.coverAssetId}`);
  const collabs = CollaboratorsFile.safeParse(raw.collaborators ?? []);
  if (!collabs.success) collabs.error.issues.forEach((i) => out.push(`collaborators.${i.path.join(".")}: ${i.message}`));
  const collabIds = new Set(collabs.success ? collabs.data.map((c) => c.id) : []);
  for (const a of assets) {
    for (const c of a.collaborators) if (c.id && !collabIds.has(c.id)) out.push(`assets.${a.id}: unknown collaborator ${c.id}`);
    if (a.artist && !slugs.has(a.artist)) out.push(`assets.${a.id}: unknown artist ${a.artist}`);
    if (a.publishApproved && a.source === "placeholder") out.push(`assets.${a.id}: placeholder art cannot be publishApproved`);
    if (a.type === "audio" && a.previews.length) out.push(`assets.${a.id}: audio must not be self-hosted`);
  }
  return out;
}
