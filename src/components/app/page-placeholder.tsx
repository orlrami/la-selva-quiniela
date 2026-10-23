import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { appMessages } from "@/lib/app/messages";

interface PagePlaceholderProps {
  title: string;
  subtitle?: string;
  description?: string;
  children?: ReactNode;
}

export function PagePlaceholder({
  title,
  subtitle,
  description,
  children,
}: PagePlaceholderProps) {
  return (
    <Card className="mx-auto w-full max-w-3xl">
      <CardHeader className="gap-3">
        <div className="grid size-12 place-items-center rounded-lg border border-[var(--accent-teal)]/30 bg-[var(--accent-teal)]/12 text-[var(--accent-teal)]">
          <Sparkles className="size-5" aria-hidden />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-teal)]">
          {appMessages.placeholder.eyebrow}
        </p>
        <CardTitle className="text-2xl">{title}</CardTitle>
        {subtitle ? (
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">
            {subtitle}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="text-sm leading-6 text-[var(--muted-foreground)]">
          {description ?? appMessages.placeholder.description}
        </p>
        {children}
      </CardContent>
    </Card>
  );
}
