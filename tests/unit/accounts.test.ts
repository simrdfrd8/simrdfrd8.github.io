import { describe, expect, it } from "vitest";
import { OPT_IN_LABELS, accountsOn, parseLinkFragment } from "@/lib/accounts";

describe("accounts client", () => {
  it("is off when NEXT_PUBLIC_ACCOUNTS_API is unset (production today)", () => {
    expect(accountsOn()).toBe(false);
  });
  it("reads the sign-in token from the URL fragment and keeps next on-site", () => {
    expect(parseLinkFragment("#token=abc&next=%2Faccount%2F")).toEqual({ token: "abc", next: "/account/" });
    expect(parseLinkFragment("#token=abc&next=%2F%2Fevil.test")).toEqual({ token: "abc", next: "/account/" });
    expect(parseLinkFragment("#token=abc&next=https%3A%2F%2Fevil.test")).toEqual({ token: "abc", next: "/account/" });
    expect(parseLinkFragment("")).toEqual({ token: null, next: "/account/" });
  });
  it("has two separate opt-ins with plain wording: Giveaways (free entry, no purchase necessary) and Newsletter", () => {
    expect(Object.keys(OPT_IN_LABELS)).toEqual(["giveaways", "newsletter"]);
    expect(OPT_IN_LABELS.giveaways).toMatch(/free entry, no purchase necessary/i);
    expect(Object.values(OPT_IN_LABELS).join(" ")).not.toMatch(/raffle/i);
  });
});
