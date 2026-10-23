"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { CheckCircle2, Save, TriangleAlert } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveProfileAction } from "@/lib/profile/actions";
import { profileMessages } from "@/lib/profile/messages";

import { AvatarColorPicker } from "./avatar-color-picker";

interface ProfileFormProps {
  initialName: string;
  initialAvatarColor: string;
}

type Toast = { kind: "saved" } | { kind: "error"; message: string };

export function ProfileForm({
  initialName,
  initialAvatarColor,
}: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [avatarColor, setAvatarColor] = useState(initialAvatarColor);
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<Toast | null>(null);
  const [nameError, setNameError] = useState<string | undefined>();
  const toastTimer = useRef<number | null>(null);

  function flashToast(next: Toast) {
    setToast(next);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  }

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveProfileAction(null, formData);
      if (result.ok) {
        setNameError(undefined);
        flashToast({ kind: "saved" });
      } else {
        setNameError(result.fieldErrors?.name);
        flashToast({
          kind: "error",
          message: result.formError ?? profileMessages.toasts.error,
        });
      }
    });
  }

  const previewName = name.trim().length > 0 ? name.trim() : initialName;

  return (
    <form onSubmit={handleSubmit} className="grid gap-6" noValidate>
      <section
        aria-label={profileMessages.edit.previewLabel}
        className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-5 sm:flex-row sm:items-center sm:gap-5"
      >
        <Avatar name={previewName} color={avatarColor} size="lg" />
        <div className="grid gap-1 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
            {profileMessages.edit.previewLabel}
          </p>
          <p className="text-xl font-semibold leading-tight">{previewName}</p>
        </div>
      </section>

      <Input
        label={profileMessages.edit.nameLabel}
        name="name"
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder={profileMessages.edit.namePlaceholder}
        hint={profileMessages.edit.nameHint}
        error={nameError}
        autoComplete="nickname"
        maxLength={40}
        required
      />

      <AvatarColorPicker value={avatarColor} onChange={setAvatarColor} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        {toast ? (
          toast.kind === "saved" ? (
            <span className="inline-flex items-center gap-1 text-sm text-[var(--accent-green)]">
              <CheckCircle2 className="size-4" aria-hidden />
              {profileMessages.toasts.saved}
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
          <Save className="size-4" aria-hidden />
          {pending
            ? profileMessages.edit.savingCta
            : profileMessages.edit.saveCta}
        </Button>
      </div>
    </form>
  );
}
