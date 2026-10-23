/** Contact is a plain mailto: link (the public site is a static export, so there is no form backend). */
/** Customer-service address (spelled h-a-l-l-o on purpose): orders, support, licensing, bookings, business. */
export const CONTACT_EMAIL = "hallo@flavorfulmusic.com";
/** Production, mixing and artist mail (studio services, collabs) goes to Ricky directly. */
export const STUDIO_EMAIL = "ricky@flavorfulmusic.com";

export const INQUIRY_TYPES = ["booking", "business", "collab", "licensing", "commission", "service"] as const;
export type InquiryType = (typeof INQUIRY_TYPES)[number];

export const INQUIRY_LABELS: Record<InquiryType, string> = {
  booking: "Booking / DJ",
  business: "Business",
  collab: "Collab",
  licensing: "Licensing",
  commission: "Commission",
  service: "Studio service",
};

const SUBJECTS: Record<InquiryType, string> = {
  booking: "Booking inquiry",
  business: "Business inquiry",
  collab: "Collab idea",
  licensing: "License request",
  commission: "Commission inquiry",
  service: "Studio service inquiry",
};

/** Which inbox each topic opens a new email to. */
export const INQUIRY_EMAILS: Record<InquiryType, string> = {
  booking: CONTACT_EMAIL,
  business: CONTACT_EMAIL,
  collab: STUDIO_EMAIL,
  licensing: CONTACT_EMAIL,
  commission: CONTACT_EMAIL,
  service: STUDIO_EMAIL,
};

export const isInquiryType = (t: unknown): t is InquiryType => typeof t === "string" && (INQUIRY_TYPES as readonly string[]).includes(t);

/** mailto: link with a prefilled subject, e.g. "Booking inquiry: Dan Perales (ref: getdownix-download)". */
export function inquiryMailto(type: InquiryType, opts: { who?: string; ref?: string } = {}): string {
  let subject = SUBJECTS[type];
  if (opts.who) subject += `: ${opts.who}`;
  if (opts.ref) subject += ` (ref: ${opts.ref.slice(0, 80)})`;
  return `mailto:${INQUIRY_EMAILS[type]}?subject=${encodeURIComponent(subject)}`;
}
