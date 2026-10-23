import Link from "next/link";
import type { Metadata } from "next";
import { TicketCheck } from "lucide-react";

import { AuthCard } from "@/components/auth/auth-card";
import { InviteTokenForm } from "@/components/auth/invite-token-form";
import { authMessages } from "@/lib/auth/messages";

export const metadata: Metadata = {
  title: `${authMessages.ui.registerCta} · ${authMessages.ui.appName}`,
};

export default function RegisterPage() {
  return (
    <AuthCard
      icon={<TicketCheck className="size-5" aria-hidden />}
      iconAccent="gold"
      title={authMessages.ui.invitePromptTokenTitle}
      subtitle={authMessages.ui.invitePromptTokenSubtitle}
      footer={
        <>
          {authMessages.ui.registerAlreadyHaveAccount}{" "}
          <Link
            href="/login"
            className="font-semibold text-[var(--accent-gold)] underline-offset-4 hover:underline"
          >
            {authMessages.ui.registerGoToLogin}
          </Link>
        </>
      }
    >
      <InviteTokenForm />
    </AuthCard>
  );
}
