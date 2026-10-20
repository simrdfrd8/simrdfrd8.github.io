import { describe, expect, it } from "vitest";
import { CONTACT_EMAIL, INQUIRY_TYPES, inquiryMailto, isInquiryType } from "@/lib/inquiry";

describe("mailto inquiries", () => {
  it("goes to the one public address", () => {
    expect(CONTACT_EMAIL).toBe("ricky@flavorfulmusic.com");
    for (const t of INQUIRY_TYPES) expect(inquiryMailto(t).startsWith("mailto:ricky@flavorfulmusic.com?subject=")).toBe(true);
  });
  it("prefills a subject per type, with optional artist and reference", () => {
    expect(decodeURIComponent(inquiryMailto("booking").split("subject=")[1])).toBe("Booking inquiry");
    expect(decodeURIComponent(inquiryMailto("licensing", { who: "Flavorful Croissants", ref: "deserts" }).split("subject=")[1])).toBe("License request: Flavorful Croissants (ref: deserts)");
  });
  it("only accepts known types", () => {
    expect(isInquiryType("booking")).toBe(true);
    expect(isInquiryType("spam")).toBe(false);
    expect(isInquiryType(null)).toBe(false);
  });
});
