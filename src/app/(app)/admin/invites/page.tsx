import type { Metadata } from "next";
import { Plus, Ticket } from "lucide-react";

import { AdminCard } from "@/components/admin/admin-card";
import { InviteCreateForm } from "@/components/admin/invite-create-form";
import { InviteRow } from "@/components/admin/invite-row";
import { appMessages } from "@/lib/app/messages";
import { adminMessages } from "@/lib/admin/messages";
import { getAdminOverview } from "@/lib/admin/data";

export const metadata: Metadata = {
  title: `${adminMessages.invites.title} · ${appMessages.brand.name}`,
};

export default async function AdminInvitesPage() {
  const overview = await getAdminOverview();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-teal)]">
          {overview?.quiniela.name ?? "La Selva Quiniela"}
        </p>
        <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
          {adminMessages.invites.title}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
          {adminMessages.invites.subtitle}
        </p>
      </header>

      <AdminCard
        title={adminMessages.invites.createTitle}
        icon={<Plus className="size-5" aria-hidden />}
        accent="gold"
      >
        <InviteCreateForm />
      </AdminCard>

      <AdminCard
        title={adminMessages.invites.title}
        icon={<Ticket className="size-5" aria-hidden />}
        accent="teal"
      >
        {!overview || overview.invites.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            {adminMessages.invites.empty}
          </p>
        ) : (
          <ul className="grid gap-3">
            {overview.invites.map((invite) => (
              <li key={invite.id}>
                <InviteRow invite={invite} baseUrl={baseUrl} />
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
