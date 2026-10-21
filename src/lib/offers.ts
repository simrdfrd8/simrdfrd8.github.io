import { PAYHIP_TIERS } from "@/lib/env";
import type { Offer } from "@/lib/beat-data";

/** Offers are identical per beat apart from id/title; the template uses "__beat__" / "__title__". */
export const offersFor = (tpl: Offer[], b: { id: string; title: string; payhipUrl?: string }) =>
  tpl.map((o) => ({
    ...o,
    id: o.id.replace("__beat__", b.id),
    title: o.title.replace("__title__", b.title),
    checkoutUrl: b.payhipUrl && o.licenseTierId && PAYHIP_TIERS.includes(o.licenseTierId) ? b.payhipUrl : o.checkoutUrl,
  }));
