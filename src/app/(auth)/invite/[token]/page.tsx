import Link from "next/link";
import type { Metadata } from "next";
import { TicketCheck, TriangleAlert } from "lucide-react";

import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";
import { authMessages } from "@/lib/auth/messages";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: `${authMessages.ui.registerCta} · ${authMessages.ui.appName}`,
};

type Status = "ok" | "missing" | "expired" | "exhausted";

async function evaluateInvite(token: string): Promise<{ status: Status }> {
  const invite = await prisma.invite.findUnique({
    where: { token },
    select: {
      expiresAt: true,
      maxUses: true,
      useCount: true,
    },
  });

  if (!invite) return { status: "missing" };
  if (invite.expiresAt.getTime() < Date.now()) return { status: "expired" };
  if (invite.useCount >= invite.maxUses) return { status: "exhausted" };
  return { status: "ok" };
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const decoded = decodeURIComponent(token);
  const result = await evaluateInvite(decoded);

  if (result.status !== "ok") {
    const message =
      result.status === "missing"
        ? authMessages.errors.inviteNotFound
        : result.status === "expired"
          ? authMessages.errors.inviteExpired
          : authMessages.errors.inviteExhausted;

    return (
      <AuthCard
        icon={<TriangleAlert className="size-5" aria-hidden />}
        iconAccent="gold"
        title={authMessages.ui.inviteTitle}
        subtitle={message}
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
        <p className="text-sm leading-6 text-[var(--muted-foreground)]">
          Si crees que esto es un error, pide al administrador de la quiniela un
          enlace nuevo.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      icon={<TicketCheck className="size-5" aria-hidden />}
      iconAccent="gold"
      eyebrow={authMessages.ui.inviteTitle}
      title={authMessages.ui.registerTitle}
      subtitle={authMessages.ui.registerSubtitle}
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
      <RegisterForm initialToken={decoded} lockToken />
    </AuthCard>
  );
}
