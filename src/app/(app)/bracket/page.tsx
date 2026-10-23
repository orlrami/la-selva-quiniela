import type { Metadata } from "next";
import { Lock, PencilLine, Trophy } from "lucide-react";

import { BracketMatchCard } from "@/components/bracket/bracket-match-card";
import { BonusSummary } from "@/components/bracket/bonus-summary";
import { PagePlaceholder } from "@/components/app/page-placeholder";
import { getBonusBoard } from "@/lib/bonus/data";
import { appMessages } from "@/lib/app/messages";
import { requireUser } from "@/lib/dal";
import { getKnockoutBoard, type KnockoutMatch } from "@/lib/predictions/data";
import { getLiveBracket, type LiveR32Match, type LiveSlot } from "@/lib/predictions/live-bracket";

export const metadata: Metadata = {
  title: `Bracket · ${appMessages.brand.name}`,
};

const LATER_STAGES = ["ROUND_OF_16", "QUARTER_FINAL", "SEMI_FINAL", "FINAL"] as const;

// A later-round match becomes a card once propagation fills its teams.
function koToLive(m: KnockoutMatch): LiveR32Match {
  const slot = (team: KnockoutMatch["homeTeam"]): LiveSlot =>
    team
      ? { label: "", team, locked: true, candidates: [] }
      : { label: "Por definir", team: null, locked: false, candidates: [] };
  return {
    matchNumber: m.matchNumber,
    bracketSlot: m.bracketSlot,
    kickoffAt: m.kickoffAt,
    finalScore: m.finalScore ? { home: m.finalScore.homeScore, away: m.finalScore.awayScore } : null,
    decidedByPenalties: m.decidedByPenalties,
    advancerTeamId: m.winnerTeamId,
    home: slot(m.homeTeam),
    away: slot(m.awayTeam),
  };
}

export default async function BracketPage() {
  const user = await requireUser();
  const [live, knockout, bonus] = await Promise.all([
    getLiveBracket(user.id),
    getKnockoutBoard(user.id),
    getBonusBoard(user.id),
  ]);

  if (!live || live.r32.length === 0) {
    return (
      <PagePlaceholder
        title="Cuadro de eliminatorias"
        subtitle="Las eliminatorias aparecerán aquí cuando empiece la fase de grupos."
      />
    );
  }

  const koByNumber = new Map<number, KnockoutMatch>();
  for (const round of knockout?.rounds ?? []) {
    for (const m of round.matches) koByNumber.set(m.matchNumber, m);
  }
  const openCount = live.r32.filter((m) => {
    const ko = koByNumber.get(m.matchNumber);
    return ko && ko.homeTeam && ko.awayTeam && !ko.isLocked;
  }).length;
  const laterRounds = (knockout?.rounds ?? []).filter((r) =>
    (LATER_STAGES as readonly string[]).includes(r.stage),
  );

  return (
    <div className="grid gap-5">
      <header className="grid gap-2">
        {live.quiniela ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-gold)]">
            {live.quiniela.name}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">Eliminatorias en vivo</h1>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 text-sm font-semibold tabular-nums">
            <Trophy className="size-4 text-[var(--accent-gold)]" aria-hidden />
            {live.groupsDecided}/{live.totalGroups} grupos
          </span>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
          <Lock className="inline size-3.5 -translate-y-px text-[var(--accent-gold)]" aria-hidden /> = lugar confirmado.
          Toca un partido para ver los equipos en disputa o, si ya está{" "}
          <span className="inline-flex items-center gap-1 text-[var(--accent-teal)]">
            <PencilLine className="size-3.5" aria-hidden /> abierto
          </span>
          , pronosticarlo — sin esperar al último día de grupos.
        </p>
        {openCount > 0 ? (
          <p className="text-sm font-semibold text-[var(--accent-teal)]">
            {openCount} {openCount === 1 ? "partido abierto" : "partidos abiertos"} para pronosticar ahora.
          </p>
        ) : null}
      </header>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex min-w-max items-start gap-3">
          {/* Round of 32 — live + tappable to predict */}
          <section aria-label="Ronda de 32" className="grid w-56 shrink-0 gap-2">
            <header className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em]">Ronda de 32</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted-foreground)] tabular-nums">
                {live.r32.length} cruces
              </p>
            </header>
            <div className="grid gap-2">
              {live.r32.map((m) => (
                <BracketMatchCard key={m.matchNumber} live={m} ko={koByNumber.get(m.matchNumber) ?? null} />
              ))}
            </div>
          </section>

          {/* Later rounds — fill as the bracket advances (propagation from grades) */}
          {laterRounds.map((round) => (
            <section key={round.stage} aria-label={round.label} className="grid w-52 shrink-0 gap-2">
              <header className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em]">{round.label}</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted-foreground)] tabular-nums">
                  {round.total} cruces
                </p>
              </header>
              <div className="grid gap-2">
                {round.matches.map((m) => (
                  <BracketMatchCard key={m.matchNumber} live={koToLive(m)} ko={m} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {bonus ? <BonusSummary picks={bonus.picks} /> : null}
    </div>
  );
}
