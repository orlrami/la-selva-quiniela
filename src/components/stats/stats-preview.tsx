"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { DesignPodio } from "./design-podio";
import { DesignMatriz } from "./design-matriz";
import { DesignConsenso } from "./design-consenso";
import type { StatsDesignProps } from "./types";

const DESIGNS = [
  { id: "podio", label: "1 · Podio", C: DesignPodio },
  { id: "matriz", label: "2 · Matriz", C: DesignMatriz },
  { id: "consenso", label: "3 · Consenso", C: DesignConsenso },
] as const;

export function StatsPreview(props: StatsDesignProps) {
  const [active, setActive] = useState<(typeof DESIGNS)[number]["id"]>("podio");
  const Active = DESIGNS.find((d) => d.id === active)!.C;

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-[var(--accent-gold)]/30 bg-[var(--accent-gold)]/[0.06] p-2">
        <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-gold)]">
          Vista previa · elige tu diseño
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {DESIGNS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setActive(d.id)}
              className={cn(
                "rounded-lg px-2 py-2 text-xs font-bold transition",
                active === d.id
                  ? "bg-[var(--accent-gold)] text-black shadow-sm"
                  : "bg-white/[0.04] text-[var(--muted-foreground)] hover:bg-white/[0.08]",
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <Active {...props} />
    </div>
  );
}
