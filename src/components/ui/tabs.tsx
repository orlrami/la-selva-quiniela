"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface TabItem {
  value: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  className?: string;
}

export function Tabs({ items, defaultValue, className }: TabsProps) {
  const [activeValue, setActiveValue] = React.useState(defaultValue ?? items[0]?.value);
  const activeIndex = items.findIndex((item) => item.value === activeValue);

  function moveFocus(direction: 1 | -1) {
    const nextIndex = (activeIndex + direction + items.length) % items.length;
    setActiveValue(items[nextIndex]?.value);
  }

  return (
    <div className={cn("grid gap-4", className)}>
      <div
        role="tablist"
        aria-label="Secciones de contenido"
        className="grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-1 rounded-xl border border-white/10 bg-black/20 p-1"
      >
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={activeValue === item.value}
            aria-controls={`${item.value}-panel`}
            id={`${item.value}-tab`}
            tabIndex={activeValue === item.value ? 0 : -1}
            onClick={() => setActiveValue(item.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") {
                event.preventDefault();
                moveFocus(1);
              }
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                moveFocus(-1);
              }
            }}
            className={cn(
              "min-h-10 rounded-lg px-3 text-sm font-semibold text-[var(--muted-foreground)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-teal)]",
              activeValue === item.value &&
                "bg-white/[0.09] text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div
          key={item.value}
          role="tabpanel"
          id={`${item.value}-panel`}
          aria-labelledby={`${item.value}-tab`}
          hidden={activeValue !== item.value}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
