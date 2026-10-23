import Link from "next/link";
import type { Metadata } from "next";
import { LockKeyhole } from "lucide-react";

import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { authMessages } from "@/lib/auth/messages";

export const metadata: Metadata = {
  title: `${authMessages.ui.loginCta} · ${authMessages.ui.appName}`,
};

export default function LoginPage() {
  return (
    <AuthCard
      icon={<LockKeyhole className="size-5" aria-hidden />}
      iconAccent="teal"
      eyebrow={authMessages.ui.welcomeBack}
      title={authMessages.ui.loginTitle}
      subtitle={authMessages.ui.loginSubtitle}
      footer={
        <>
          {authMessages.ui.loginNoAccount}{" "}
          <Link
            href="/register"
            className="font-semibold text-[var(--accent-gold)] underline-offset-4 hover:underline"
          >
            {authMessages.ui.loginUseInvite}
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
