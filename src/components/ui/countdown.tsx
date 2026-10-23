"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  toIso: string;
  closedLabel?: string;
}

interface Parts {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function diffParts(ms: number): Parts {
  if (ms <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms / (60 * 60 * 1000)) % 24);
  const minutes = Math.floor((ms / (60 * 1000)) % 60);
  const seconds = Math.floor((ms / 1000) % 60);
  return { total: ms, days, hours, minutes, seconds };
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

export function Countdown({ toIso, closedLabel = "Cerrado" }: CountdownProps) {
  const target = new Date(toIso).getTime();
  const [parts, setParts] = useState<Parts>(() => diffParts(target - Date.now()));

  useEffect(() => {
    const tick = () => setParts(diffParts(target - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (parts.total <= 0) {
    return <span className="font-semibold text-[var(--accent-danger)]">{closedLabel}</span>;
  }

  if (parts.days > 0) {
    return (
      <span aria-live="polite">
        <strong>{parts.days}</strong> {parts.days === 1 ? "día" : "días"}{" "}
        <strong>{pad(parts.hours)}</strong>:<strong>{pad(parts.minutes)}</strong>
      </span>
    );
  }

  return (
    <span aria-live="polite" className="font-mono tabular-nums">
      <strong>{pad(parts.hours)}</strong>:<strong>{pad(parts.minutes)}</strong>:
      <strong>{pad(parts.seconds)}</strong>
    </span>
  );
}
