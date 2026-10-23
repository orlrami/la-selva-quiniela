"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authMessages } from "@/lib/auth/messages";
import { invitePromptSchema } from "@/lib/auth/schemas";

export function InviteTokenForm() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = invitePromptSchema.safeParse({ token });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    setError(undefined);
    router.push(`/invite/${encodeURIComponent(parsed.data.token)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
      <Input
        label={authMessages.ui.fieldInvite}
        name="token"
        value={token}
        onChange={(event) => setToken(event.target.value)}
        placeholder={authMessages.ui.fieldInvitePlaceholder}
        autoComplete="off"
        spellCheck={false}
        error={error}
        required
      />
      <Button type="submit" size="lg" fullWidth>
        {authMessages.ui.invitePromptTokenCta}
      </Button>
    </form>
  );
}
