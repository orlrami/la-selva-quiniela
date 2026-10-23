import {
  BookOpen,
  ClipboardCheck,
  Home,
  Network,
  ShieldCheck,
  Trophy,
  Users,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { appMessages } from "@/lib/app/messages";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export const navItems: readonly NavItem[] = [
  { label: appMessages.nav.dashboard, href: "/dashboard", icon: Home },
  {
    label: appMessages.nav.predictions,
    href: "/predictions",
    icon: ClipboardCheck,
  },
  { label: appMessages.nav.leaderboard, href: "/leaderboard", icon: Trophy },
  { label: "Todos", href: "/todos", icon: Users },
  { label: "Bracket", href: "/bracket", icon: Network },
  { label: appMessages.nav.rules, href: "/rules", icon: BookOpen },
  { label: appMessages.nav.profile, href: "/profile", icon: UserRound },
  {
    label: appMessages.nav.admin,
    href: "/admin",
    icon: ShieldCheck,
    adminOnly: true,
  },
] as const;

export function visibleNavItems(role: "MEMBER" | "ADMIN"): NavItem[] {
  return navItems.filter((item) => !item.adminOnly || role === "ADMIN");
}
