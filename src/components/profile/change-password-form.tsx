"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { CheckCircle2, KeyRound, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changePasswordAction } from "@/lib/profile/actions";
import { profileMessages } from "@/lib/profile/messages";

type Toast = { kind: "saved" } | { kind: "error"; message: string };

export function ChangePasswordForm() {
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<Toast | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const formRef = useRef<HTMLFormElement>(null);
  const toastTimer = useRef<number | null>(null);

  function flash(next: Toast) {
    setToast(next);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2800);
  }

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    },
    [],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await changePasswordAction(null, formData);
      if (result.ok) {
        setFieldErrors({});
        formRef.current?.reset();
        flash({ kind: "saved" });
      } else {
        setFieldErrors(result.fieldErrors ?? {});
        flash({
          kind: "error",
          message: result.formError ?? profileMessages.toasts.error,
        });
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="grid gap-4"
      noValidate
    >
      <Input
        label={profileMessages.password.currentLabel}
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        placeholder={profileMessages.password.currentPlaceholder}
        error={fieldErrors.currentPassword}
        required
      />
      <Input
        label={profileMessages.password.newLabel}
        name="newPassword"
        type="password"
        autoComplete="new-password"
        placeholder={profileMessages.password.newPlaceholder}
        hint={profileMessages.password.newHint}
        error={fieldErrors.newPassword}
        required
      />
      <Input
        label={profileMessages.password.confirmLabel}
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        placeholder={profileMessages.password.confirmPlaceholder}
        error={fieldErrors.confirmPassword}
        required
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        {toast ? (
          toast.kind === "saved" ? (
            <span className="inline-flex items-center gap-1 text-sm text-[var(--accent-green)]">
              <CheckCircle2 className="size-4" aria-hidden />
              {profileMessages.toasts.passwordChanged}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-sm text-[var(--accent-danger)]">
              <TriangleAlert className="size-4" aria-hidden />
              {toast.message}
            </span>
          )
        ) : (
          <span />
        )}
        <Button type="submit" size="md" loading={pending}>
          <KeyRound className="size-4" aria-hidden />
          {pending
            ? profileMessages.password.savingCta
            : profileMessages.password.saveCta}
        </Button>
      </div>
    </form>
  );
}
