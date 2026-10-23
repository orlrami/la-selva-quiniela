import { Flame, Star, Target } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardForm } from "@/lib/dashboard/data";

interface FormCardProps {
  form: DashboardForm;
}

export function FormCard({ form }: FormCardProps) {
  const streakLabel =
    form.streak === 0
      ? "Aún sin racha"
      : `${form.streak} ${form.streak === 1 ? "acierto" : "aciertos"} seguidos`;

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="grid size-10 place-items-center rounded-lg border border-[var(--accent-teal)]/30 bg-[var(--accent-teal)]/12 text-[var(--accent-teal)]">
          <Flame className="size-5" aria-hidden />
        </div>
        <CardTitle className="text-lg">Tu racha</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
          <Flame
            className="size-5 shrink-0 text-[var(--accent-gold)]"
            aria-hidden
          />
          <div className="grid">
            <span className="text-base font-semibold">{streakLabel}</span>
            <span className="text-xs text-[var(--muted-foreground)]">
              Resultados acertados al hilo
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1 rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <span className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
              <Target className="size-3.5" aria-hidden />
              Mejor pick
            </span>
            <span className="text-lg font-bold text-[var(--accent-green)]">
              {form.bestPoints > 0 ? `+${form.bestPoints} pts` : "—"}
            </span>
            {form.bestMatchLabel ? (
              <span className="truncate text-xs text-[var(--muted-foreground)]">
                {form.bestMatchLabel}
              </span>
            ) : null}
          </div>
          <div className="grid gap-1 rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <span className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
              <Star className="size-3.5" aria-hidden />
              Marcadores exactos
            </span>
            <span className="text-lg font-bold text-[var(--accent-gold)]">
              {form.exactScores}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
