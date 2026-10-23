"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { appMessages } from "@/lib/app/messages";
import { cn } from "@/lib/utils";

import { visibleNavItems } from "./nav-items";

interface BottomNavProps {
  userRole: "MEMBER" | "ADMIN";
}

function isActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function BottomNav({ userRole }: BottomNavProps) {
  const pathname = usePathname();
  const items = visibleNavItems(userRole);

  return (
    <nav
      aria-label={appMessages.nav.primary}
      className="sticky bottom-0 z-40 border-t border-white/10 bg-[rgba(6,16,13,0.92)] backdrop-blur-xl md:hidden"
    >
      <ul
        className="mx-auto grid w-full max-w-6xl"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href} className="flex">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 px-1 py-2.5 text-[11px] font-medium transition",
                  active
                    ? "text-[var(--accent-gold)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
                )}
              >
                <span
                  className={cn(
                    "grid size-9 place-items-center rounded-lg transition",
                    active
                      ? "bg-[var(--accent-gold)]/15"
                      : "bg-transparent",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
