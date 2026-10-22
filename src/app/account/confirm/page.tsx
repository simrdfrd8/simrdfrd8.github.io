import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { ConfirmLink } from "@/components/account/ConfirmLink";

export const metadata: Metadata = { title: "Confirm your email", robots: { index: false, follow: false } };

export default function ConfirmPage() {
  return (
    <AccountShell kicker="Your account" title="Confirm your email">
      <ConfirmLink />
    </AccountShell>
  );
}
