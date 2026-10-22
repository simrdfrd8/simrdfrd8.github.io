import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { AdminDashboard } from "@/components/account/AdminDashboard";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

/** Static shell only: every product and image shown here comes from the accounts Worker after an admin check. */
export default function AdminPage() {
  return (
    <AccountShell kicker="Admin" title="Dashboard">
      <AdminDashboard />
    </AccountShell>
  );
}
