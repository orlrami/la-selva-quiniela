"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardLeaderboardRow } from "@/lib/dashboard/data";
import { cn } from "@/lib/utils";

interface LeaderboardPreviewProps {
  rows: DashboardLeaderboardRow[];
  totalMembers: number;
}

export function LeaderboardPreview({ rows, totalMembers }: LeaderboardPreviewProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="grid gap-1">
          <CardTitle className="text-xl">Clasificación parcial</CardTitle>
          <p className="text-sm text-[var(--muted-foreground)]">
            {totalMembers === 1
              ? "Por ahora juegas en solitario."
              : `${totalMembers} jugadores en la quiniela.`}
          </p>
        </div>
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-1 self-center text-sm font-semibold text-[var(--accent-gold)] underline-offset-4 hover:underline"
        >
          Ver todo
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </CardHeader>
      <CardContent className="grid gap-2">
        {rows.length === 0 ? (
          <p className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-[var(--muted-foreground)]">
            Aún no hay jugadores con pronósticos. Sé el primero en marcar.
          </p>
        ) : (
          rows.map((row, index) => (
            <motion.div
              key={row.userId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * index, ease: "easeOut" }}
              className={cn(
                "grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 rounded-xl border p-3",
                row.isCurrentUser
                  ? "border-[var(--accent-gold)]/40 bg-[var(--accent-gold)]/8"
                  : "border-white/10 bg-white/[0.04]",
              )}
            >
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full text-xs font-bold",
                  row.isCurrentUser
                    ? "bg-[var(--accent-gold)] text-[#121006]"
                    : "bg-white/10 text-[var(--muted-foreground)]",
                )}
              >
                {row.rank}
              </span>
              <Avatar name={row.avatarName} color={row.avatarColor} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {row.displayName}
                  {row.isCurrentUser ? (
                    <span className="ml-2 rounded-full bg-[var(--accent-gold)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--accent-gold)]">
                      Tú
                    </span>
                  ) : null}
                </p>
                <p className="truncate text-xs text-[var(--muted-foreground)]">
                  {row.completedPredictions === 0
                    ? "Sin pronósticos aún"
                    : `${row.completedPredictions} pronósticos · ${row.exactScores} exactos`}
                </p>
              </div>
              <div className="rounded-lg bg-white/[0.06] px-3 py-2 text-sm font-bold tabular-nums">
                {row.points}
              </div>
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
