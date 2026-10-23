"use client";

import { useMemo, useState } from "react";

import { GroupTabs } from "@/components/predictions/group-tabs";
import type { AdminMatchesData } from "@/lib/admin/data";

import { MatchResultForm } from "./match-result-form";

interface MatchResultsBoardProps {
  data: AdminMatchesData;
}

export function MatchResultsBoard({ data }: MatchResultsBoardProps) {
  const [active, setActive] = useState(
    () => data.groups[0]?.code ?? "A",
  );
  const current = data.groups.find((g) => g.code === active);

  const tabs = useMemo(
    () =>
      data.groups.map((g) => ({
        code: g.code,
        completed: g.scored,
        total: g.total,
      })),
    [data],
  );

  return (
    <div className="grid gap-5">
      <GroupTabs groups={tabs} active={active} onChange={setActive} />
      {current ? (
        <section aria-label={`Grupo ${current.code}`} className="grid gap-3">
          {current.matches.map((match) => (
            <MatchResultForm key={match.id} match={match} />
          ))}
        </section>
      ) : null}
    </div>
  );
}
