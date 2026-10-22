import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { SignInForm } from "@/components/account/SignInForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default function SignInPage() {
  return (
    <AccountShell kicker="Optional · guest checkout always works" title="Sign in">
      <SignInForm />
    </AccountShell>
  );
}
