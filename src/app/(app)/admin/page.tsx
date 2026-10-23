import Link from "next/link";
import type { Metadata } from "next";
import {
  CalendarCheck2,
  CalendarClock,
  ClipboardCheck,
  Ticket,
  Users,
} from "lucide-react";

import { AdminCard } from "@/components/admin/admin-card";
import { Avatar } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { appMessages } from "@/lib/app/messages";
import { adminMessages } from "@/lib/admin/messages";
import { getAdminOverview } from "@/lib/admin/data";

export const metadata: Metadata = {
  title: `${appMessages.pages.adminTitle} · ${appMessages.brand.name}`,
};

export default async function AdminPage() {
  const overview = await getAdminOverview();

  if (!overview) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">
        Aún no hay quinielas configuradas.
      </p>
    );
  }

  const dateFormatter = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-teal)]">
          {overview.quiniela.name}
        </p>
        <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
          {adminMessages.page.title}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
          {adminMessages.page.subtitle}
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={adminMessages.overview.membersLabel}
          value={overview.counts.members}
          icon={<Users className="size-4" aria-hidden />}
          accent="teal"
          helper={adminMessages.overview.membersHelper}
        />
        <StatCard
          label={adminMessages.overview.invitesLabel}
          value={overview.counts.activeInvites}
          icon={<Ticket className="size-4" aria-hidden />}
          accent="gold"
          helper={adminMessages.overview.invitesHelper}
        />
        <StatCard
          label={adminMessages.overview.matchesScoredLabel}
          value={overview.counts.matchesScored}
          icon={<ClipboardCheck className="size-4" aria-hidden />}
          accent="green"
          helper={adminMessages.overview.matchesScoredHelper}
        />
        <StatCard
          label={adminMessages.overview.matchesPendingLabel}
          value={overview.counts.matchesPending}
          icon={<CalendarClock className="size-4" aria-hidden />}
          accent={overview.counts.matchesPending > 0 ? "danger" : "neutral"}
          helper={adminMessages.overview.matchesPendingHelper}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/matches"
          className={`${buttonVariants({ variant: "secondary", size: "lg" })} justify-start gap-3`}
        >
          <CalendarCheck2
            className="size-5 text-[var(--accent-gold)]"
            aria-hidden
          />
          <span>{adminMessages.overview.goToMatches}</span>
        </Link>
        <Link
          href="/admin/invites"
          className={`${buttonVariants({ variant: "secondary", size: "lg" })} justify-start gap-3`}
        >
          <Ticket className="size-5 text-[var(--accent-teal)]" aria-hidden />
          <span>{adminMessages.overview.goToInvites}</span>
        </Link>
      </section>

      <AdminCard
        title={adminMessages.overview.membersTitle}
        icon={<Users className="size-5" aria-hidden />}
        accent="teal"
      >
        {overview.members.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            {adminMessages.overview.membersEmpty}
          </p>
        ) : (
          <ul className="grid gap-3">
            {overview.members.map((member) => (
              <li
                key={member.userId}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3"
              >
                <Avatar
                  name={member.name}
                  color={member.avatarColor}
                  size="md"
                />
                <div className="min-w-0 grid gap-0.5">
                  <p className="truncate text-sm font-semibold">
                    {member.name}
                    {member.role === "ADMIN" ? (
                      <span className="ml-2 rounded-full bg-[var(--accent-gold)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--accent-gold)]">
                        {appMessages.roles.admin}
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate font-mono text-xs text-[var(--muted-foreground)]">
                    @{member.username}
                  </p>
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Desde {dateFormatter.format(new Date(member.joinedAt))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
