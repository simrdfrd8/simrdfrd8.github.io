import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { VerifyLink } from "@/components/account/VerifyLink";

export const metadata: Metadata = { title: "Signing in", robots: { index: false, follow: false } };

export default function VerifyPage() {
  return (
    <AccountShell kicker="Your account" title="Signing in">
      <VerifyLink />
    </AccountShell>
  );
}
