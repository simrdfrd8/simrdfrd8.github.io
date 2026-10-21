import type { SamplePack } from "@/lib/catalog/schema";
import { getAsset, getSamplePacks } from "@/lib/catalog";
import { mediaUrl } from "@/lib/env";

/**
 * Sample pack library data (content/sample-packs.json). Only real packs are listed (drafts and layout examples are dropped).
 * A demo plays only when it's an MP3 preview under /media/ (served from R2); anything else is ignored, so a
 * master or a private file can never end up behind a play button.
 */
export const PUBLIC_DEMO = /^\/media\/[a-z0-9][a-z0-9/_-]*\.mp3$/;

export type PackTile = {
  id: string;
  title: string;
  coverAssetId: string | null;
  tags: string[];
  demo?: string;
  comingSoon: boolean;
};

export const packDemo = (p: SamplePack) => (p.demo.clipSrc && PUBLIC_DEMO.test(p.demo.clipSrc) ? mediaUrl(p.demo.clipSrc) : undefined);

export function libraryPacks(packs: SamplePack[] = getSamplePacks()): PackTile[] {
  return packs
    .filter((p) => !p.example && p.status !== "draft")
    .map((p) => ({
      id: p.id,
      title: p.title,
      coverAssetId: p.coverAssetId && getAsset(p.coverAssetId) ? p.coverAssetId : null,
      tags: [...p.genres, p.bpmRange && `${p.bpmRange} BPM`].filter((t): t is string => !!t),
      demo: packDemo(p),
      // Sales aren't switched on for packs yet, so every pack reads "Coming soon" for now.
      comingSoon: true,
    }));
}
