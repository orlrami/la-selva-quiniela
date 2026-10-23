"use client";

import { predictionMessages } from "@/lib/predictions/messages";
import { cn } from "@/lib/utils";

interface GroupTabItem {
  code: string;
  completed: number;
  total: number;
}

interface GroupTabsProps {
  groups: GroupTabItem[];
  active: string;
  onChange: (code: string) => void;
}

export function GroupTabs({ groups, active, onChange }: GroupTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Grupos del Mundial 2026"
      className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      <div className="flex min-w-max gap-2 pb-1">
        {groups.map((group) => {
          const isActive = group.code === active;
          const isComplete = group.completed === group.total && group.total > 0;
          return (
            <button
              key={group.code}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(group.code)}
              className={cn(
                "grid min-w-[5.5rem] gap-0.5 rounded-xl border px-3 py-2 text-left transition",
                isActive
                  ? "border-[var(--accent-gold)]/60 bg-[var(--accent-gold)]/12 text-[var(--accent-gold)]"
                  : "border-white/10 bg-white/[0.04] text-[var(--muted-foreground)] hover:border-white/22 hover:text-[var(--foreground)]",
              )}
            >
              <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                {predictionMessages.group.label(group.code)}
              </span>
              <span
                className={cn(
                  "text-[11px] tabular-nums",
                  isActive
                    ? "text-[var(--accent-gold)]"
                    : isComplete
                      ? "text-[var(--accent-green)]"
                      : "text-[var(--muted-foreground)]",
                )}
              >
                {predictionMessages.group.progress(group.completed, group.total)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
