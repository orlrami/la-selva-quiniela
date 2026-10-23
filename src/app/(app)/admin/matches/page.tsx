import type { Metadata } from "next";
import { CalendarCheck2 } from "lucide-react";

import { MatchResultsBoard } from "@/components/admin/match-results-board";
import { appMessages } from "@/lib/app/messages";
import { adminMessages } from "@/lib/admin/messages";
import { getAdminMatches } from "@/lib/admin/data";

export const metadata: Metadata = {
  title: `${adminMessages.matches.title} · ${appMessages.brand.name}`,
};

export default async function AdminMatchesPage() {
  const data = await getAdminMatches();

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-teal)]">
          {data.quiniela.name}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
            {adminMessages.matches.title}
          </h1>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 text-sm font-semibold tabular-nums">
            <CalendarCheck2
              className="size-4 text-[var(--accent-gold)]"
              aria-hidden
            />
            {adminMessages.matches.progress(
              data.totals.scored,
              data.totals.total,
            )}
          </span>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
          {adminMessages.matches.subtitle}
        </p>
      </header>

      <MatchResultsBoard data={data} />
    </div>
  );
}
