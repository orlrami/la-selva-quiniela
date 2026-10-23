import type { Metadata } from "next";
import { KeyRound, Settings2, User } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { ProfileForm } from "@/components/profile/profile-form";
import { appMessages } from "@/lib/app/messages";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { profileMessages } from "@/lib/profile/messages";

export const metadata: Metadata = {
  title: `${profileMessages.page.title} · ${appMessages.brand.name}`,
};

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function ProfilePage() {
  const user = await requireUser();
  const membership = await prisma.quinielaMember.findFirst({
    where: { userId: user.id },
    orderBy: { joinedAt: "asc" },
    select: { joinedAt: true },
  });
  const roleLabel =
    user.role === "ADMIN" ? appMessages.roles.admin : appMessages.roles.member;
  const joinedLabel = membership
    ? dateFormatter.format(membership.joinedAt)
    : "—";

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-teal)]">
          {appMessages.brand.name}
        </p>
        <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
          {profileMessages.page.title}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
          {profileMessages.page.subtitle}
        </p>
      </header>

      <Card>
        <CardHeader className="gap-3">
          <div className="grid size-12 place-items-center rounded-lg border border-[var(--accent-teal)]/30 bg-[var(--accent-teal)]/10 text-[var(--accent-teal)]">
            <User className="size-5" aria-hidden />
          </div>
          <CardTitle className="text-xl">
            {profileMessages.account.title}
          </CardTitle>
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">
            {profileMessages.account.description}
          </p>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-[var(--muted-foreground)]">
                {profileMessages.account.fields.username}
              </dt>
              <dd className="font-mono font-medium">{user.username}</dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-[var(--muted-foreground)]">
                {profileMessages.account.fields.role}
              </dt>
              <dd className="font-medium">{roleLabel}</dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-[var(--muted-foreground)]">
                {profileMessages.account.fields.joined}
              </dt>
              <dd className="font-medium">{joinedLabel}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3">
          <div className="grid size-12 place-items-center rounded-lg border border-[var(--accent-gold)]/30 bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]">
            <Settings2 className="size-5" aria-hidden />
          </div>
          <CardTitle className="text-xl">
            {profileMessages.edit.title}
          </CardTitle>
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">
            {profileMessages.edit.description}
          </p>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initialName={user.name}
            initialAvatarColor={user.avatarColor}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3">
          <div className="grid size-12 place-items-center rounded-lg border border-[var(--accent-teal)]/30 bg-[var(--accent-teal)]/10 text-[var(--accent-teal)]">
            <KeyRound className="size-5" aria-hidden />
          </div>
          <CardTitle className="text-xl">
            {profileMessages.password.title}
          </CardTitle>
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">
            {profileMessages.password.description}
          </p>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
