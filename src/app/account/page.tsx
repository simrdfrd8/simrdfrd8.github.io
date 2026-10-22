import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { AccountDashboard } from "@/components/account/AccountDashboard";

export const metadata: Metadata = { title: "Account", robots: { index: false, follow: false } };

export default function AccountPage() {
  return (
    <AccountShell kicker="Your account" title="Account">
      <AccountDashboard />
    </AccountShell>
  );
}
