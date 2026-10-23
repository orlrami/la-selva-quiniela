"use client";

import { useCallback, useMemo, useState } from "react";

import type {
  KnockoutBoardData,
  PredictionBoardData,
  PredictionBoardMatch,
  TeamStandingRow,
} from "@/lib/predictions/data";
import { predictionMessages } from "@/lib/predictions/messages";

import { GroupStandings } from "./group-standings";
import { GroupTabs } from "./group-tabs";
import { KnockoutBoard } from "./knockout-board";
import { MatchCard } from "./match-card";
import { PhaseTabs, type PredictionPhase } from "./phase-tabs";

interface PredictionsBoardProps {
  board: PredictionBoardData;
  knockout: KnockoutBoardData | null;
}

function buildStandings(matches: PredictionBoardMatch[]): TeamStandingRow[] {
  const stats = new Map<string, TeamStandingRow>();
  for (const m of matches) {
    if (!stats.has(m.homeTeam.id)) {
      stats.set(m.homeTeam.id, { team: m.homeTeam, position: 0, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 });
    }
    if (!stats.has(m.awayTeam.id)) {
      stats.set(m.awayTeam.id, { team: m.awayTeam, position: 0, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 });
    }
    // Standings reflect the USER'S predictions (not the official result), so the
    // table stays "según tus pronósticos" even after matches are played.
    const score =
      m.prediction && m.prediction.homeScore !== null && m.prediction.awayScore !== null
        ? { homeScore: m.prediction.homeScore, awayScore: m.prediction.awayScore }
        : null;
    if (!score) continue;
    const home = stats.get(m.homeTeam.id)!;
    const away = stats.get(m.awayTeam.id)!;
    home.mp++; away.mp++;
    home.gf += score.homeScore; home.ga += score.awayScore;
    away.gf += score.awayScore; away.ga += score.homeScore;
    if (score.homeScore > score.awayScore) {
      home.w++; away.l++; home.pts += 3;
    } else if (score.homeScore < score.awayScore) {
      away.w++; home.l++; away.pts += 3;
    } else {
      home.d++; away.d++; home.pts += 1; away.pts += 1;
    }
    home.gd = home.gf - home.ga;
    away.gd = away.gf - away.ga;
  }
  const rows = Array.from(stats.values()).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.team.name.localeCompare(b.team.name, "es");
  });
  rows.forEach((r, i) => { r.position = i + 1; });
  return rows;
}

export function PredictionsBoard({ board, knockout }: PredictionsBoardProps) {
  const [knockoutLocked] = useState(
    () => Date.now() < new Date(board.lastGroupKickoff).getTime(),
  );
  const [phase, setPhase] = useState<PredictionPhase>("groups");
  const [activeGroup, setActiveGroup] = useState(
    () => board.groups[0]?.code ?? "A",
  );

  const [localPredictions, setLocalPredictions] = useState<
    Map<string, { homeScore: number; awayScore: number }>
  >(() => {
    const map = new Map<string, { homeScore: number; awayScore: number }>();
    for (const g of board.groups) {
      for (const m of g.matches) {
        if (m.prediction && m.prediction.homeScore !== null && m.prediction.awayScore !== null) {
          map.set(m.id, { homeScore: m.prediction.homeScore, awayScore: m.prediction.awayScore });
        }
      }
    }
    return map;
  });

  const handlePredictionSaved = useCallback(
    (matchId: string, homeScore: number, awayScore: number) => {
      setLocalPredictions((prev) => {
        const next = new Map(prev);
        next.set(matchId, { homeScore, awayScore });
        return next;
      });
    },
    [],
  );

  const groupsWithLive = useMemo(() => {
    return board.groups.map((g) => {
      const matches = g.matches.map((m): PredictionBoardMatch => {
        const local = localPredictions.get(m.id);
        if (local && !m.isLocked) {
          return {
            ...m,
            prediction: {
              homeScore: local.homeScore,
              awayScore: local.awayScore,
              correctOutcome: m.prediction?.correctOutcome ?? false,
              exactScore: m.prediction?.exactScore ?? false,
              points: m.prediction?.points ?? 0,
            },
          };
        }
        return m;
      });
      return {
        ...g,
        matches,
        completed: matches.filter((m) => m.prediction !== null && m.prediction.homeScore !== null && m.prediction.awayScore !== null).length,
      };
    });
  }, [board.groups, localPredictions]);

  const tabs = useMemo(
    () =>
      groupsWithLive.map((g) => ({
        code: g.code,
        completed: g.completed,
        total: g.total,
      })),
    [groupsWithLive],
  );

  const current = groupsWithLive.find((g) => g.code === activeGroup);
  const knockoutTotals = knockout?.totals ?? { completed: 0, total: 0 };

  const liveStandings = useMemo(() => {
    if (!current) return [];
    return buildStandings(current.matches);
  }, [current]);

  const handlePhaseChange = (p: PredictionPhase) => {
    if (p === "knockout" && knockoutLocked) return;
    setPhase(p);
  };

  return (
    <div className="grid gap-5">
      <PhaseTabs
        active={phase}
        onChange={handlePhaseChange}
        groupTotals={board.totals}
        knockoutTotals={knockoutTotals}
        knockoutOpensAt={board.lastGroupKickoff}
      />

      {phase === "groups" ? (
        <>
          <GroupTabs
            groups={tabs}
            active={activeGroup}
            onChange={setActiveGroup}
          />
          {current ? (
            <div className="grid gap-4">
              <GroupStandings
                groupCode={current.code}
                rows={liveStandings}
                actualOrder={current.actualOrder}
                predictedComplete={current.matches.every(
                  (m) =>
                    m.prediction &&
                    m.prediction.homeScore !== null &&
                    m.prediction.awayScore !== null,
                )}
              />
              <section
                aria-label={predictionMessages.group.label(current.code)}
                className="grid gap-3"
              >
                {current.matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onPredictionSaved={handlePredictionSaved}
                  />
                ))}
              </section>
            </div>
          ) : null}
        </>
      ) : knockout ? (
        <KnockoutBoard data={knockout} />
      ) : (
        <p className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-[var(--muted-foreground)]">
          Las eliminatorias aún no están disponibles.
        </p>
      )}
    </div>
  );
}
