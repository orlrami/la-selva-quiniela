"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/auth/logout-button";
import { appMessages } from "@/lib/app/messages";
import { cn } from "@/lib/utils";

import { visibleNavItems, type NavItem } from "./nav-items";

interface AppHeaderProps {
  userName: string;
  userRole: "MEMBER" | "ADMIN";
  avatarColor?: string | null;
}

function isActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function AppHeader({ userName, userRole, avatarColor }: AppHeaderProps) {
  const pathname = usePathname();
  const items: NavItem[] = visibleNavItems(userRole);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[rgba(6,16,13,0.78)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-teal)]"
        >
          <span className="grid size-10 place-items-center rounded-lg border border-[var(--accent-gold)]/35 bg-[var(--accent-gold)]/15 text-[var(--accent-gold)]">
            <Trophy className="size-5" aria-hidden />
          </span>
          <span className="grid leading-tight">
            <span className="text-sm font-semibold">
              {appMessages.brand.name}
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">
              {appMessages.brand.tagline}
            </span>
          </span>
        </Link>

        <nav
          aria-label={appMessages.nav.primary}
          className="ml-auto hidden items-center gap-1 md:flex"
        >
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-[var(--accent-gold)]/15 text-[var(--accent-gold)]"
                    : "text-[var(--muted-foreground)] hover:bg-white/[0.06] hover:text-[var(--foreground)]",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-lg p-1 transition hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-teal)]"
            aria-label={appMessages.nav.profile}
          >
            <Avatar name={userName} color={avatarColor} size="sm" />
            <span className="hidden text-sm font-medium sm:block">
              {userName}
            </span>
          </Link>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
