"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { CheckCircle2, Copy, MessageCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  revokeInviteAction,
} from "@/lib/admin/actions";
import { adminMessages } from "@/lib/admin/messages";
import type { AdminInvite } from "@/lib/admin/data";
import { cn } from "@/lib/utils";

interface InviteRowProps {
  invite: AdminInvite;
  baseUrl: string;
}

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function statusLabel(status: AdminInvite["status"]): string {
  switch (status) {
    case "active":
      return adminMessages.invites.activeBadge;
    case "expired":
      return adminMessages.invites.expiredBadge;
    case "exhausted":
      return adminMessages.invites.exhaustedBadge;
  }
}

function statusClasses(status: AdminInvite["status"]): string {
  switch (status) {
    case "active":
      return "border-[var(--accent-green)]/30 bg-[var(--accent-green)]/10 text-[var(--accent-green)]";
    case "expired":
      return "border-[var(--accent-danger)]/30 bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]";
    case "exhausted":
      return "border-white/20 bg-white/[0.06] text-[var(--muted-foreground)]";
  }
}

export function InviteRow({ invite, baseUrl }: InviteRowProps) {
  const inviteUrl = `${baseUrl}/invite/${encodeURIComponent(invite.token)}`;
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();
  const [revokeState, revokeAction, revokePending] = useActionState(
    revokeInviteAction,
    null,
  );

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(id);
  }, [copied]);

  function handleCopy() {
    void navigator.clipboard.writeText(inviteUrl).then(() => setCopied(true));
  }

  function handleRevoke() {
    if (!confirm(`¿Revocar la invitación ${invite.token}?`)) return;
    const formData = new FormData();
    formData.set("inviteId", invite.id);
    startTransition(() => {
      void revokeAction(formData);
    });
  }

  return (
    <article className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <p className="break-all font-mono text-sm font-semibold text-[var(--foreground)]">
            {invite.token}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]",
            statusClasses(invite.status),
          )}
        >
          {statusLabel(invite.status)}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-xs text-[var(--muted-foreground)] sm:grid-cols-3">
        <div>
          <dt className="font-semibold uppercase tracking-[0.16em]">Usos</dt>
          <dd className="text-sm text-[var(--foreground)]">
            {adminMessages.invites.usesUsed(invite.useCount, invite.maxUses)}
          </dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-[0.16em]">Vence</dt>
          <dd className="text-sm text-[var(--foreground)]">
            {dateFormatter.format(new Date(invite.expiresAt))}
          </dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-[0.16em]">Creada</dt>
          <dd className="text-sm text-[var(--foreground)]">
            {dateFormatter.format(new Date(invite.createdAt))}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="break-all text-xs text-[var(--muted-foreground)]">
          {inviteUrl}
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={handleCopy}>
            {copied ? (
              <CheckCircle2 className="size-4" aria-hidden />
            ) : (
              <Copy className="size-4" aria-hidden />
            )}
            {copied
              ? adminMessages.invites.copiedCta
              : adminMessages.invites.copyCta}
          </Button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              adminMessages.invites.whatsappMessage(inviteUrl),
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--accent-green)]/40 bg-[var(--accent-green)]/12 px-3 text-xs font-semibold text-[var(--accent-green)] transition hover:bg-[var(--accent-green)]/20"
          >
            <MessageCircle className="size-4" aria-hidden />
            {adminMessages.invites.whatsappCta}
          </a>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            loading={revokePending}
            onClick={handleRevoke}
          >
            <Trash2 className="size-4" aria-hidden />
            {revokePending
              ? adminMessages.invites.revokingCta
              : adminMessages.invites.revokeCta}
          </Button>
        </div>
      </div>

      {revokeState?.formError ? (
        <p className="text-xs text-[var(--accent-danger)]">
          {revokeState.formError}
        </p>
      ) : null}
    </article>
  );
}
