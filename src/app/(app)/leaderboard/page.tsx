import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, CalendarCheck2, Users } from "lucide-react";

import { PagePlaceholder } from "@/components/app/page-placeholder";
import { LeaderboardRow } from "@/components/leaderboard/leaderboard-row";
import { LeaderboardSummary } from "@/components/leaderboard/leaderboard-summary";
import { appMessages } from "@/lib/app/messages";
import { requireUser } from "@/lib/dal";
import { getLeaderboard } from "@/lib/leaderboard/data";
import { leaderboardMessages } from "@/lib/leaderboard/messages";

export const metadata: Metadata = {
  title: `${leaderboardMessages.page.title} · ${appMessages.brand.name}`,
};

export default async function LeaderboardPage() {
  const user = await requireUser();
  const data = await getLeaderboard(user.id);

  if (!data || data.rows.length === 0) {
    return (
      <PagePlaceholder
        title={leaderboardMessages.empty.title}
        subtitle={leaderboardMessages.empty.description}
      />
    );
  }

  return (
    <div className="grid gap-6">
      <header className="grid gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="grid gap-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-teal)]">
              {data.quiniela.name}
            </p>
            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
              {leaderboardMessages.page.title}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <Link
              href="/estadisticas"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 font-semibold text-[var(--foreground)] transition hover:border-white/25"
            >
              <BarChart3 className="size-4 text-[var(--accent-gold)]" aria-hidden />
              Estadísticas
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 font-semibold">
              <Users
                className="size-4 text-[var(--accent-teal)]"
                aria-hidden
              />
              {data.totalMembers}{" "}
              {data.totalMembers === 1 ? "jugador" : "jugadores"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 font-semibold">
              <CalendarCheck2
                className="size-4 text-[var(--accent-gold)]"
                aria-hidden
              />
              {leaderboardMessages.summary.progress(
                data.finalMatches,
                data.totalMatches,
              )}
            </span>
          </div>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
          {leaderboardMessages.page.subtitle}
        </p>
      </header>

      {data.me ? (
        <LeaderboardSummary row={data.me} totalMembers={data.totalMembers} />
      ) : null}

      <section aria-label={leaderboardMessages.page.title} className="grid gap-2">
        {data.rows.map((row) => (
          <LeaderboardRow key={row.userId} row={row} />
        ))}
      </section>
    </div>
  );
}
