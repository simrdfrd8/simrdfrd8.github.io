#!/usr/bin/env node
/**
 * Post-build step for the public merch set. The source of truth is the PUBLISHED catalog snapshot
 * (content/catalog-published.json, exported from the admin catalog manager; anything not listed in it is private).
 * content/merch-public-set.json is the older slot list the snapshot was seeded from; plan() still accepts it.
 * Only acts when MERCH_PUBLIC_SET=1 (off by default, so today's builds are untouched).
 *
 * 1. Finds the images that belong ONLY to merch products (or colourways) that are not public (admin-only).
 * 2. Removes those files from out/ (the export copy; public/ and git are never touched).
 * 3. Fails the build if any file in out/ still names an admin-only product id, slug or image path.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.join(ROOT, "out");
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));

export function productAssetIds(p) {
  const ids = [p.assetId, ...(p.galleryAssetIds ?? []), ...(p.lifestyleAssetIds ?? [])];
  for (const c of p.colorways ?? []) {
    for (const [k, v] of Object.entries(c)) if ((k === "assetId" || k.endsWith("AssetId")) && typeof v === "string") ids.push(v); // every colourway: front, back, models
    for (const m of c.models ?? []) ids.push(m.frontAssetId, m.backAssetId, m.blankBackAssetId);
    for (const e of c.modelExtras ?? []) ids.push(e.assetId);
  }
  return [...new Set(ids.filter(Boolean))];
}

export const isSnapshot = (src) => !!src && typeof src === "object" && !!src.merch && !src.slots;

/** Public merch slugs from the published snapshot (its keys) or from the older slot set. */
export function publicSlugs(src) {
  if (isSnapshot(src)) return new Set(Object.keys(src.merch));
  return new Set(src.slots.flatMap((s) => (s.products.length ? s.products : s.untilFilled ?? [])));
}

/** Public colour slugs of a product in the snapshot (null = every colourway, e.g. with the slot set). */
export function visibleColorways(p, src) {
  if (!isSnapshot(src)) return null;
  const e = src.merch[p.id.replace(/^merch-/, "")];
  return e ? new Set(Object.keys(e.colorways ?? {})) : null;
}

/** Asset ids a PUBLIC product may show: every colourway the snapshot lists, never a hidden colourway's images. */
export function publicProductAssetIds(p, src) {
  const vis = visibleColorways(p, src);
  const all = productAssetIds(p);
  if (!vis || (p.colorways ?? []).every((c) => vis.has(c.slug))) return all;
  const only = (cws) => productAssetIds({ ...p, assetId: null, galleryAssetIds: [], lifestyleAssetIds: [], colorways: cws });
  const shown = new Set(only(p.colorways.filter((c) => vis.has(c.slug))));
  const hidden = new Set(only(p.colorways.filter((c) => !vis.has(c.slug))));
  return all.filter((id) => shown.has(id) || !hidden.has(id));
}

/** Basic shape + safety check of a published snapshot (it is committed to the public repo). Returns problems. */
export function checkSnapshot(snap, products) {
  const out = [];
  if (snap.schema !== "fm-catalog-published/1") out.push(`unknown snapshot schema ${snap.schema}`);
  const text = JSON.stringify(snap);
  for (const k of ["unit_cost_cents", "ship_cost_cents", "margin_override", "visibility", "updated_by"]) if (text.includes(`"${k}"`)) out.push(`snapshot must not contain ${k}`);
  const merch = new Map(products.filter((p) => p.type === "merch").map((p) => [p.id.replace(/^merch-/, ""), p]));
  const cents = (v) => v === null || (Number.isInteger(v) && v >= 0 && v <= 10_000_000);
  for (const [slug, e] of Object.entries(snap.merch ?? {})) {
    const p = merch.get(slug);
    if (!p) { out.push(`snapshot names unknown product ${slug}`); continue; }
    if (!cents(e.price_cents)) out.push(`${slug}: bad price`);
    if (e.sale && (!cents(e.sale.price_cents) || e.price_cents == null || e.sale.price_cents >= e.price_cents)) out.push(`${slug}: sale must be below the price`);
    for (const c of Object.keys(e.colorways ?? {})) if (!(p.colorways ?? []).some((x) => x.slug === c)) out.push(`${slug}: unknown colourway ${c}`);
    if ((p.colorways ?? []).length && !Object.keys(e.colorways ?? {}).length) out.push(`${slug}: public product without a public colourway`);
  }
  for (const b of snap.bundles ?? []) {
    if (!/^[a-z0-9][a-z0-9-]{1,60}$/.test(b.slug)) out.push(`bundle slug ${b.slug}`);
    if (!cents(b.price_cents) || b.price_cents == null) out.push(`bundle ${b.slug}: price`);
    for (const i of b.items ?? []) {
      if (!(i.product in (snap.merch ?? {}))) out.push(`bundle ${b.slug} holds a non-public product ${i.product}`);
      else if (i.colorway && !(i.colorway in snap.merch[i.product].colorways)) out.push(`bundle ${b.slug} holds a non-public colourway ${i.product}/${i.colorway}`);
    }
  }
  return out;
}

/** { publicIds, adminIds, adminOnlyAssetIds, adminOnlyFiles, hiddenColorways } for products + assets + snapshot (or slot set). */
export function plan(products, assets, set) {
  const pub = publicSlugs(set);
  const merch = products.filter((p) => p.type === "merch");
  const isPub = (p) => pub.has(p.id.replace(/^merch-/, ""));
  const keep = new Set(products.filter((p) => p.type !== "merch" || isPub(p)).flatMap((p) => (p.type === "merch" ? publicProductAssetIds(p, set) : productAssetIds(p))));
  const adminOnlyAssetIds = [...new Set(merch.flatMap(productAssetIds))].filter((id) => !keep.has(id));
  const byId = new Map(assets.map((a) => [a.id, a]));
  const adminOnlyFiles = adminOnlyAssetIds.flatMap((id) => [byId.get(id)?.src, ...(byId.get(id)?.previews ?? []).map((v) => v.src)]).filter(Boolean);
  return {
    publicAssetIds: [...keep],
    publicIds: merch.filter(isPub).map((p) => p.id),
    adminIds: merch.filter((p) => !isPub(p)).map((p) => p.id),
    adminOnlyAssetIds,
    adminOnlyFiles: [...new Set(adminOnlyFiles)],
    hiddenColorways: merch.filter(isPub).flatMap((p) => {
      const vis = visibleColorways(p, set);
      return vis ? (p.colorways ?? []).filter((c) => !vis.has(c.slug)).map((c) => `${p.id}/${c.slug}`) : [];
    }),
  };
}

function walk(d, acc = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

/** The price demo (example data, screenshots only) must never be in a public export. */
function checkNoDemo() {
  if (process.env.PRICE_DEMO === "1" || !fs.existsSync(OUT)) return;
  const hits = [];
  if (fs.existsSync(path.join(OUT, "price-demo"))) hits.push("out/price-demo/");
  for (const f of walk(OUT)) if (/\.(html|txt)$/.test(f) && /data-example-data/.test(fs.readFileSync(f, "utf8"))) hits.push(path.relative(OUT, f));
  if (hits.length) {
    console.error("[price-demo] example-data page in a non-demo build:\n" + hits.join("\n"));
    process.exit(1);
  }
}

function main() {
  checkNoDemo();
  if (process.env.MERCH_PUBLIC_SET !== "1") {
    console.log("[merch-public-set] filter off (MERCH_PUBLIC_SET!=1): out/ left as built.");
    return;
  }
  if (!fs.existsSync(OUT)) throw new Error("out/ not found; run next build first");
  const products = read("content/products.json");
  const snapshot = read("content/catalog-published.json");
  const problems = checkSnapshot(snapshot, products);
  if (problems.length) {
    console.error("[merch-public-set] content/catalog-published.json is not valid:\n" + problems.join("\n"));
    process.exit(1);
  }
  const pl = plan(products, read("content/assets.json"), snapshot);
  // Public merch images = every file used by an asset of a product that stays public (merch in the set + all non-merch).
  const byId = new Map(read("content/assets.json").map((a) => [a.id, a]));
  const keep = new Set(pl.publicAssetIds.flatMap((id) => [byId.get(id)?.src, ...(byId.get(id)?.previews ?? []).map((v) => v.src)]).filter(Boolean));
  // ...plus any merch file the built pages name literally (srcsets, closer look, slides), unless it belongs to an admin-only product
  const adminSet = new Set(pl.adminOnlyFiles);
  for (const f of walk(OUT)) {
    if (!/\.(html|txt|js|css|json)$/.test(f)) continue;
    for (const m of fs.readFileSync(f, "utf8").matchAll(/\/media\/merch-[A-Za-z0-9._\/-]+?\.(?:webp|avif|jpe?g|png|gif|mp4)/g)) if (!adminSet.has(m[0])) keep.add(m[0]);
  }
  let removed = 0;
  // 1) the admin-only products' own files; 2) any other file in a merch-* media folder that no public product uses
  //    (older colourways and orphans live there too, and would otherwise stay reachable at a guessable URL)
  const merchFiles = fs.existsSync(path.join(OUT, "media")) ? walk(path.join(OUT, "media")).map((f) => "/" + path.relative(OUT, f).split(path.sep).join("/")).filter((f) => /^\/media\/merch-/.test(f)) : [];
  // 3) Closer look renders made for an admin-only product (cotton-/print-<slug>-*), unless a public page still shows one
  const adminSlugs = pl.adminIds.map((id) => id.replace(/^merch-/, ""));
  const closerDir = path.join(OUT, "media", "closer-look");
  const closerFiles = fs.existsSync(closerDir) ? fs.readdirSync(closerDir).map((n) => `/media/closer-look/${n}`) : [];
  const literal = new Set();
  for (const f of walk(OUT)) if (/\.(html|txt|js|css|json)$/.test(f)) for (const m of fs.readFileSync(f, "utf8").matchAll(/\/media\/closer-look\/[A-Za-z0-9._-]+/g)) literal.add(m[0]);
  const adminCloser = closerFiles.filter((f) => adminSlugs.some((sl) => new RegExp(`/(cotton|print)-${sl}-\\d+\\.`).test(f)) && !literal.has(f));
  for (const f of new Set([...pl.adminOnlyFiles, ...merchFiles.filter((f) => !keep.has(f)), ...adminCloser])) {
    const p = path.join(OUT, f);
    if (fs.existsSync(p)) {
      fs.rmSync(p);
      removed++;
    }
  }
  // drop now-empty media folders
  for (const d of fs.readdirSync(path.join(OUT, "media"), { withFileTypes: true })) {
    const p = path.join(OUT, "media", d.name);
    if (d.isDirectory() && walk(p).length === 0) fs.rmSync(p, { recursive: true });
  }
  // verify: no admin-only file left, and nothing in the export names an admin-only product, slug or asset
  const left = pl.adminOnlyFiles.filter((f) => fs.existsSync(path.join(OUT, f)));
  const adminFolders = [...new Set(pl.adminOnlyFiles.map((f) => f.split("/").slice(0, 3).join("/") + "/"))].filter((d) => ![...keep].some((k) => k.startsWith(d)));
  const needles = [...adminFolders, ...pl.adminIds, ...pl.adminIds.map((id) => `/shop/merch/${id.replace(/^merch-/, "")}`), ...pl.adminOnlyAssetIds];
  const hits = [];
  for (const f of walk(OUT)) {
    if (!/\.(html|js|json|txt|css|xml|webmanifest)$/.test(f)) continue;
    const t = fs.readFileSync(f, "utf8");
    for (const n of needles) if (t.includes(n)) hits.push(`${path.relative(OUT, f)}: ${n}`);
  }
  console.log(`[merch-public-set] source: content/catalog-published.json (release ${snapshot.release}); hidden colourways of public products: ${pl.hiddenColorways.length}`);
  console.log(`[merch-public-set] public: ${pl.publicIds.length} products; admin-only: ${pl.adminIds.length} products, ${pl.adminOnlyAssetIds.length} images, removed ${removed} files from out/ (admin-only images + unused merch files); ${adminFolders.length} merch folders gone entirely; ${adminCloser.length} Closer look renders of admin-only products removed.`);
  if (left.length || hits.length) {
    console.error("[merch-public-set] admin-only content still in out/:\n" + [...left, ...hits.slice(0, 40)].join("\n"));
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
