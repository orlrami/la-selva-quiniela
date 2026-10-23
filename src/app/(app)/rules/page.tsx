import type { Metadata } from "next";
import {
  Award,
  CalendarClock,
  Gift,
  Trophy,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeadlineTable } from "@/components/rules/deadline-table";
import { ScoringTable, type ScoringTableRow } from "@/components/rules/scoring-table";
import { appMessages } from "@/lib/app/messages";
import { prisma } from "@/lib/prisma";
import { getStageDeadlines } from "@/lib/rules/data";
import { rulesMessages } from "@/lib/rules/messages";

export const metadata: Metadata = {
  title: `${rulesMessages.page.title} · ${appMessages.brand.name}`,
};

const DEFAULT_EXACT_POINTS = 5;
const DEFAULT_OUTCOME_POINTS = 2;

async function loadScoringRows(): Promise<ScoringTableRow[]> {
  const rules = await prisma.scoreRule.findMany({
    where: { stage: "GROUP", active: true },
    select: { key: true, points: true },
  });
  const map = new Map(rules.map((r) => [r.key, r.points]));
  const exact = map.get("group-exact-score") ?? DEFAULT_EXACT_POINTS;
  const outcome = map.get("group-outcome") ?? DEFAULT_OUTCOME_POINTS;
  const rows = rulesMessages.scoring.rows;

  return [
    {
      key: "exact",
      label: rows.exactLabel,
      description: rows.exactDescription,
      points: exact,
      accent: "gold",
    },
    {
      key: "outcome",
      label: rows.outcomeLabel,
      description: rows.outcomeDescription,
      points: outcome,
      accent: "teal",
    },
    {
      key: "miss",
      label: rows.missLabel,
      description: rows.missDescription,
      points: 0,
      accent: "muted",
    },
    {
      key: "noPick",
      label: rows.noPickLabel,
      description: rows.noPickDescription,
      points: 0,
      accent: "muted",
    },
  ];
}

const KO_STAGE_ORDER = [
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "THIRD_PLACE",
  "FINAL",
] as const;
const KO_STAGE_LABELS: Record<string, string> = {
  ROUND_OF_32: "Ronda de 32",
  ROUND_OF_16: "Octavos de Final",
  QUARTER_FINAL: "Cuartos de Final",
  SEMI_FINAL: "Semifinales",
  THIRD_PLACE: "Tercer Lugar",
  FINAL: "Final",
};
type KoLayer = { advance: number; exact: number };
const KO_DEFAULT_LAYERS: Record<string, KoLayer> = {
  ROUND_OF_32: { advance: 3, exact: 5 },
  ROUND_OF_16: { advance: 4, exact: 7 },
  QUARTER_FINAL: { advance: 6, exact: 10 },
  SEMI_FINAL: { advance: 9, exact: 14 },
  THIRD_PLACE: { advance: 4, exact: 6 },
  FINAL: { advance: 12, exact: 19 },
};

// Knockout points come from the DB (ScoreRule keys knockout-advance/knockout-exact)
// so the rules table always matches what's actually scored. The two layers stack.
async function loadKnockoutRows(): Promise<Array<{ label: string } & KoLayer>> {
  const rules = await prisma.scoreRule.findMany({
    where: { key: { in: ["knockout-advance", "knockout-exact"] }, active: true },
    select: { stage: true, key: true, points: true },
  });
  const byStage = new Map<string, Partial<KoLayer>>();
  for (const r of rules) {
    const l = byStage.get(r.stage) ?? {};
    if (r.key === "knockout-advance") l.advance = r.points;
    else if (r.key === "knockout-exact") l.exact = r.points;
    byStage.set(r.stage, l);
  }
  return KO_STAGE_ORDER.map((stage) => {
    const g = byStage.get(stage) ?? {};
    const d = KO_DEFAULT_LAYERS[stage];
    return {
      label: KO_STAGE_LABELS[stage],
      advance: g.advance ?? d.advance,
      exact: g.exact ?? d.exact,
    };
  });
}

export default async function RulesPage() {
  const [scoringRows, knockoutRows, deadlines] = await Promise.all([
    loadScoringRows(),
    loadKnockoutRows(),
    getStageDeadlines(),
  ]);

  const deadlineRows = deadlines.map((d) => ({
    stage: d.stage,
    label: d.label,
    lockIso: d.lockAt.toISOString(),
    // Every knockout match locks per-match (30 min before each game). Only the
    // group stage has a single shared closing time.
    perMatch: d.stage !== "GROUP",
  }));

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-teal)]">
          {appMessages.brand.name}
        </p>
        <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
          {rulesMessages.page.title}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
          {rulesMessages.page.subtitle}
        </p>
      </header>

      {/* Scoring — Group Stage */}
      <Card>
        <CardHeader className="gap-3">
          <div className="grid size-12 place-items-center rounded-lg border border-[var(--accent-gold)]/30 bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]">
            <Award className="size-5" aria-hidden />
          </div>
          <CardTitle className="text-xl">
            {rulesMessages.scoring.title}
          </CardTitle>
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">
            {rulesMessages.scoring.description}
          </p>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-teal)]">
              Fase de grupos
            </p>
            <ScoringTable rows={scoringRows} />
            <p className="text-xs leading-5 text-[var(--muted-foreground)]">
              {rulesMessages.scoring.footnote}
            </p>
          </div>
          <div className="grid gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-teal)]">
              Eliminatorias
            </p>
            <p className="text-sm leading-6 text-[var(--muted-foreground)]">
              {rulesMessages.knockoutScoring.description}
            </p>
            <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.04]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                    <th className="px-3 py-3 text-left font-semibold">Ronda</th>
                    <th className="px-3 py-3 text-right font-semibold">Avanza</th>
                    <th className="px-3 py-3 text-right font-semibold">Exacto</th>
                    <th className="px-3 py-3 text-right font-semibold text-[var(--foreground)]">Máx</th>
                  </tr>
                </thead>
                <tbody>
                  {knockoutRows.map((s) => (
                    <tr key={s.label} className="border-b border-white/5 last:border-0">
                      <td className="px-3 py-2.5 font-semibold">{s.label}</td>
                      <td className="px-3 py-2.5 text-right font-bold tabular-nums text-[var(--accent-teal)]">{s.advance}</td>
                      <td className="px-3 py-2.5 text-right font-bold tabular-nums text-[var(--accent-gold)]">{s.exact}</td>
                      <td className="px-3 py-2.5 text-right font-bold tabular-nums text-[var(--foreground)]">
                        {s.advance + s.exact}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs leading-5 text-[var(--muted-foreground)]">
              {rulesMessages.knockoutScoring.footnote}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bonus — merged special picks + group order */}
      <Card>
        <CardHeader className="gap-3">
          <div className="grid size-12 place-items-center rounded-lg border border-[var(--accent-gold)]/30 bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]">
            <Gift className="size-5" aria-hidden />
          </div>
          <CardTitle className="text-xl">
            {rulesMessages.bonus.title}
          </CardTitle>
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">
            {rulesMessages.bonus.description}
          </p>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-teal)]">
              {rulesMessages.bonus.specialTitle}
            </p>
            <p className="text-sm leading-6 text-[var(--muted-foreground)]">
              {rulesMessages.bonus.specialDescription}
            </p>
            <div className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-4">
              {rulesMessages.bonus.specialItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-1">
                  <span className="text-sm font-semibold">{item.label}</span>
                  <span className="text-sm font-bold tabular-nums text-[var(--accent-gold)]">
                    {item.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deadlines with actual dates */}
      <Card>
        <CardHeader className="gap-3">
          <div className="grid size-12 place-items-center rounded-lg border border-[var(--accent-teal)]/30 bg-[var(--accent-teal)]/10 text-[var(--accent-teal)]">
            <CalendarClock className="size-5" aria-hidden />
          </div>
          <CardTitle className="text-xl">
            {rulesMessages.deadlines.title}
          </CardTitle>
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">
            {rulesMessages.deadlines.description}
          </p>
        </CardHeader>
        <CardContent className="grid gap-6">
          {deadlineRows.length > 0 ? (
            <DeadlineTable
              rows={deadlineRows}
              stageHeader={rulesMessages.deadlines.tableHeader.stage}
              closesHeader={rulesMessages.deadlines.tableHeader.closes}
            />
          ) : null}
          <div className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <ol className="grid list-decimal gap-2 pl-5 text-sm leading-6 text-[var(--foreground)]">
              {rulesMessages.deadlines.rules.map((line, index) => (
                <li key={index} className="leading-6">
                  {line}
                </li>
              ))}
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Tiebreakers */}
      <Card>
        <CardHeader className="gap-3">
          <div className="grid size-12 place-items-center rounded-lg border border-[var(--accent-gold)]/30 bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]">
            <Trophy className="size-5" aria-hidden />
          </div>
          <CardTitle className="text-xl">
            {rulesMessages.tiebreakers.title}
          </CardTitle>
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">
            {rulesMessages.tiebreakers.description}
          </p>
        </CardHeader>
        <CardContent>
          <ol className="grid list-decimal gap-2 pl-5 text-sm leading-6 text-[var(--foreground)]">
            {rulesMessages.tiebreakers.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
