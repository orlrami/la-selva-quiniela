import Link from "next/link";
import { CalendarClock, MapPin } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Countdown } from "@/components/ui/countdown";
import { LocalDateTime } from "@/components/ui/local-datetime";
import { TeamFlag } from "@/components/teams/team-flag";
import type { DashboardNextMatch } from "@/lib/dashboard/data";

interface NextDeadlineProps {
  match: DashboardNextMatch | null;
}

function TeamLabel({ team }: { team: DashboardNextMatch["homeTeam"] }) {
  return (
    <div className="flex items-center gap-2 text-base font-semibold">
      <TeamFlag teamCode={team.code} teamName={team.name} size="md" />
      <span>{team.shortName}</span>
    </div>
  );
}

export function NextDeadline({ match }: NextDeadlineProps) {
  if (!match) {
    return (
      <Card>
        <CardHeader>
          <div className="mb-2 grid size-12 place-items-center rounded-lg border border-[var(--accent-teal)]/30 bg-[var(--accent-teal)]/12 text-[var(--accent-teal)]">
            <CalendarClock className="size-5" aria-hidden />
          </div>
          <CardTitle className="text-xl">Sin partidos próximos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">
            Cuando empiece el Mundial 2026 verás aquí el próximo cierre.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="grid size-12 place-items-center rounded-lg border border-[var(--accent-teal)]/30 bg-[var(--accent-teal)]/12 text-[var(--accent-teal)]">
            <CalendarClock className="size-5" aria-hidden />
          </div>
          {match.groupCode ? (
            <span className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              Grupo {match.groupCode}
            </span>
          ) : null}
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-teal)]">
          Próximo cierre
        </p>
        <CardTitle className="text-xl">
          {match.homeTeam.name} vs {match.awayTeam.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <TeamLabel team={match.homeTeam} />
          <span className="text-center text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)] sm:px-3">
            vs
          </span>
          <div className="flex sm:justify-end">
            <TeamLabel team={match.awayTeam} />
          </div>
        </div>

        <div className="grid gap-1 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm">
          <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
            <CalendarClock className="size-4" aria-hidden />
            <LocalDateTime iso={match.kickoffAt} style="long" />
          </div>
          <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
            <MapPin className="size-4" aria-hidden />
            <span>
              {match.venue} · {match.city}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-[var(--muted-foreground)]">
            Cierra en{" "}
            <span className="text-[var(--foreground)]">
              <Countdown toIso={match.lockAt} />
            </span>
          </div>
          <Link
            href="/predictions"
            className={buttonVariants({ variant: "primary", size: "md" })}
          >
            Completar pronóstico
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
