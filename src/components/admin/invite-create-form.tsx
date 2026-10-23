"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { createInviteAction } from "@/lib/admin/actions";
import { adminMessages } from "@/lib/admin/messages";

interface FormResult {
  ok: boolean;
  message?: string;
  token?: string;
}

export function InviteCreateForm() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<FormResult | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const response = await createInviteAction(null, formData);
      if (response.ok && response.invite) {
        setResult({ ok: true, token: response.invite.token });
        formRef.current?.reset();
      } else {
        setResult({
          ok: false,
          message: response.formError ?? adminMessages.errors.server,
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
      {result?.ok ? (
        <Toast
          variant="success"
          title="Invitación creada"
          description={`Token ${result.token}`}
        />
      ) : null}
      {result && !result.ok ? (
        <Toast variant="warning" title={result.message ?? ""} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={adminMessages.invites.fieldMaxUses}
          name="maxUses"
          type="number"
          min={1}
          max={200}
          defaultValue={1}
          hint={adminMessages.invites.fieldMaxUsesHint}
          required
        />
        <Input
          label={adminMessages.invites.fieldExpires}
          name="expiresInDays"
          type="number"
          min={1}
          max={365}
          defaultValue={30}
          hint={adminMessages.invites.fieldExpiresHint}
          required
        />
      </div>

      <Button type="submit" size="md" loading={pending}>
        <Plus className="size-4" aria-hidden />
        {pending
          ? adminMessages.invites.creatingCta
          : adminMessages.invites.createCta}
      </Button>
    </form>
  );
}
