import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Hash,
  Trophy,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Toast } from "@/components/ui/toast";
import { FormCard } from "@/components/dashboard/form-card";
import { LeaderboardPreview } from "@/components/dashboard/leaderboard-preview";
import { NextDeadline } from "@/components/dashboard/next-deadline";
import { RecentResults } from "@/components/dashboard/recent-results";
import { StatCard } from "@/components/dashboard/stat-card";
import { TournamentCountdown } from "@/components/dashboard/tournament-countdown";
import { appMessages } from "@/lib/app/messages";
import { authMessages } from "@/lib/auth/messages";
import { requireUser } from "@/lib/dal";
import { getDashboardData } from "@/lib/dashboard/data";

export const metadata: Metadata = {
  title: `${appMessages.pages.dashboardTitle} · ${appMessages.brand.name}`,
};

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);
  const roleLabel =
    user.role === "ADMIN" ? appMessages.roles.admin : appMessages.roles.member;

  if (!data) {
    return (
      <Toast
        variant="warning"
        title="Aún no perteneces a una quiniela"
        description="Pide al administrador una nueva invitación para empezar a jugar."
      />
    );
  }

  const completionLabel =
    data.user.totalPredictions === 0
      ? "Sin partidos cargados"
      : `de ${data.user.totalPredictions} partidos`;
  const missingHelper =
    data.user.missingPredictions > 0
      ? "Aún puedes ponerte al día antes de cada cierre."
      : "¡Tienes todos los pronósticos al día!";

  return (
    <>
      {data.tournamentStartAt ? (
        <TournamentCountdown startsAt={data.tournamentStartAt} />
      ) : null}

      <section className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.05] p-5 sm:flex-row sm:items-center sm:gap-5">
        <Avatar name={user.name} color={user.avatarColor} size="lg" />
        <div className="grid gap-1">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
            {authMessages.ui.welcomeBack}
          </p>
          <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
            {user.name}
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {data.quiniela.name} · {roleLabel}
          </p>
        </div>
      </section>

      {data.user.missingPredictions > 0 ? (
        <Link
          href="/predictions"
          className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--accent-danger)]/35 bg-[var(--accent-danger)]/8 px-4 py-3 text-sm transition hover:border-[var(--accent-danger)]/55 hover:bg-[var(--accent-danger)]/12"
        >
          <div className="flex items-center gap-2">
            <ClipboardList
              className="size-4 text-[var(--accent-danger)]"
              aria-hidden
            />
            <span className="font-semibold">
              Te faltan {data.user.missingPredictions}{" "}
              {data.user.missingPredictions === 1
                ? "pronóstico"
                : "pronósticos"}
            </span>
            <span className="text-[var(--muted-foreground)]">
              · ponte al día antes del próximo cierre
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-danger)]">
            Ir a Pronósticos
            <ArrowRight
              className="size-3.5 transition group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </Link>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tu puntaje"
          value={data.user.points}
          icon={<Trophy className="size-4" aria-hidden />}
          accent="gold"
          helper={
            data.user.exactScores > 0 || data.user.correctOutcomes > 0
              ? `${data.user.exactScores} marcadores exactos · ${data.user.correctOutcomes} resultados`
              : "Suma puntos con cada acierto."
          }
        />
        <StatCard
          label="Tu posición"
          value={data.user.rank}
          icon={<Hash className="size-4" aria-hidden />}
          accent="teal"
          helper={
            data.totalMembers === 1
              ? "Eres la única persona registrada hasta ahora."
              : `entre ${data.totalMembers} jugadores.`
          }
        />
        <StatCard
          label="Pronósticos completados"
          value={data.user.completedPredictions}
          icon={<CheckCircle2 className="size-4" aria-hidden />}
          accent="green"
          helper={completionLabel}
        />
        <StatCard
          label="Pronósticos faltantes"
          value={data.user.missingPredictions}
          icon={<ClipboardList className="size-4" aria-hidden />}
          accent={data.user.missingPredictions > 0 ? "danger" : "neutral"}
          helper={missingHelper}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <NextDeadline match={data.nextMatch} />
        <LeaderboardPreview
          rows={data.leaderboard}
          totalMembers={data.totalMembers}
        />
      </section>

      {data.recentResults.length > 0 ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <RecentResults results={data.recentResults} />
          <FormCard form={data.form} />
        </section>
      ) : null}
    </>
  );
}
