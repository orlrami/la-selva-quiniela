"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

import { Countdown } from "@/components/ui/countdown";

interface TournamentCountdownProps {
  startsAt: string;
}

/**
 * Hero countdown to the first match of the World Cup (Mexico vs South Africa).
 * Once kickoff passes it hides itself so the next-match card takes over.
 */
export function TournamentCountdown({ startsAt }: TournamentCountdownProps) {
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const target = new Date(startsAt).getTime();
    const check = () => setExpired(Date.now() >= target);
    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, [startsAt]);

  if (expired) return null;

  return (
    <section className="relative overflow-hidden rounded-xl border border-[var(--accent-gold)]/30 bg-gradient-to-br from-[var(--accent-gold)]/12 via-white/[0.04] to-[var(--accent-teal)]/10 p-5">
      <div className="flex items-center gap-2 text-[var(--accent-gold)]">
        <Sparkles className="size-4" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-[0.2em]">
          Cuenta regresiva al Mundial 2026
        </p>
      </div>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        Arranca con México vs Sudáfrica
      </p>
      <div className="mt-3 text-3xl font-bold text-[var(--foreground)] sm:text-4xl">
        <Countdown toIso={startsAt} closedLabel="¡Ya comenzó!" />
      </div>
    </section>
  );
}
