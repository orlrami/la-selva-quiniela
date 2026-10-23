"use client";

import { useSyncExternalStore } from "react";

interface DeadlineRow {
  stage: string;
  label: string;
  lockIso: string;
  /** Knockout matches lock per-match (30 min before each game), not round-wide. */
  perMatch?: boolean;
}

interface DeadlineTableProps {
  rows: DeadlineRow[];
  stageHeader: string;
  closesHeader: string;
}

function subscribe(cb: () => void) {
  return () => cb();
}

function getSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

function LocalDeadline({ iso }: { iso: string }) {
  const isClient = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!isClient) {
    return <span className="text-[var(--muted-foreground)]">…</span>;
  }

  const date = new Date(iso);
  const formatted = date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const tzShort = date.toLocaleTimeString(undefined, { timeZoneName: "short" }).split(" ").pop();

  return (
    <span>
      {formatted}
      <span className="ml-1.5 text-[10px] text-[var(--muted-foreground)]">
        ({tzShort ?? tz})
      </span>
    </span>
  );
}

export function DeadlineTable({ rows, stageHeader, closesHeader }: DeadlineTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.04]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
            <th className="px-4 py-3 text-left font-semibold">{stageHeader}</th>
            <th className="px-4 py-3 text-right font-semibold">{closesHeader}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.stage} className="border-b border-white/5 last:border-0">
              <td className="px-4 py-2.5 font-semibold">{row.label}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-[var(--accent-teal)]">
                {row.perMatch ? (
                  <span className="text-[var(--accent-teal)]">30 min antes de cada partido</span>
                ) : (
                  <LocalDeadline iso={row.lockIso} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
