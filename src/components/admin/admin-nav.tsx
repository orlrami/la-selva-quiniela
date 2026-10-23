"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck2, Home, Ticket } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Resumen", icon: Home },
  { href: "/admin/matches", label: "Resultados", icon: CalendarCheck2 },
  { href: "/admin/invites", label: "Invitaciones", icon: Ticket },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegación de administración"
      className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      <div className="flex min-w-max gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
                active
                  ? "border-[var(--accent-gold)]/40 bg-[var(--accent-gold)]/12 text-[var(--accent-gold)]"
                  : "border-white/10 bg-white/[0.04] text-[var(--muted-foreground)] hover:border-white/22 hover:text-[var(--foreground)]",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
