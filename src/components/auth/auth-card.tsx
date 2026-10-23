"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Trophy } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authMessages } from "@/lib/auth/messages";

interface AuthCardProps {
  icon: ReactNode;
  iconAccent?: "gold" | "teal";
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

const iconAccentStyles = {
  gold: "border-[var(--accent-gold)]/30 bg-[var(--accent-gold)]/12 text-[var(--accent-gold)]",
  teal: "border-[var(--accent-teal)]/30 bg-[var(--accent-teal)]/12 text-[var(--accent-teal)]",
} as const;

export function AuthCard({
  icon,
  iconAccent = "teal",
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: AuthCardProps) {
  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden px-4 py-6 text-[var(--foreground)] sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[linear-gradient(180deg,rgba(231,189,84,0.16),transparent)]" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 grid w-full max-w-md gap-5"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-lg border border-[var(--accent-gold)]/35 bg-[var(--accent-gold)]/15 text-[var(--accent-gold)]">
              <Trophy className="size-5" aria-hidden />
            </div>
            <div>
              <p className="text-base font-semibold">{authMessages.ui.appName}</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {authMessages.ui.tagline}
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-[var(--muted-foreground)] sm:flex">
            <ShieldCheck className="size-4 text-[var(--accent-teal)]" aria-hidden />
            {authMessages.ui.privateBadge}
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div
              className={`mb-2 grid size-12 place-items-center rounded-lg border ${iconAccentStyles[iconAccent]}`}
            >
              {icon}
            </div>
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-teal)]">
                {eyebrow}
              </p>
            ) : null}
            <CardTitle className="text-2xl">{title}</CardTitle>
            {subtitle ? (
              <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                {subtitle}
              </p>
            ) : null}
          </CardHeader>
          <CardContent className="grid gap-5">{children}</CardContent>
        </Card>

        {footer ? (
          <p className="text-center text-sm text-[var(--muted-foreground)]">
            {footer}
          </p>
        ) : null}
      </motion.div>
    </main>
  );
}
