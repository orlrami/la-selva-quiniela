"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { registerAction, type RegisterFormState } from "@/lib/auth/actions";
import { authMessages } from "@/lib/auth/messages";

const initialState: RegisterFormState = null;

interface RegisterFormProps {
  initialToken?: string;
  lockToken?: boolean;
}

export function RegisterForm({
  initialToken,
  lockToken = false,
}: RegisterFormProps) {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState,
  );

  const tokenValue = state?.values?.token ?? initialToken ?? "";

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      {state?.formError ? (
        <Toast variant="warning" title={state.formError} />
      ) : null}

      {lockToken ? (
        <input type="hidden" name="token" value={tokenValue} />
      ) : (
        <Input
          label={authMessages.ui.fieldInvite}
          name="token"
          autoComplete="off"
          spellCheck={false}
          defaultValue={tokenValue}
          placeholder={authMessages.ui.fieldInvitePlaceholder}
          error={state?.fieldErrors?.token?.[0]}
          required
        />
      )}

      <Input
        label={authMessages.ui.fieldUsername}
        name="username"
        type="text"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        defaultValue={state?.values?.username ?? ""}
        placeholder={authMessages.ui.fieldUsernamePlaceholder}
        hint={authMessages.ui.fieldUsernameHint}
        error={state?.fieldErrors?.username?.[0]}
        required
      />

      <Input
        label={authMessages.ui.fieldPassword}
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder={authMessages.ui.fieldNewPasswordPlaceholder}
        hint={authMessages.ui.hintNewPassword}
        error={state?.fieldErrors?.password?.[0]}
        required
      />

      <Button type="submit" size="lg" fullWidth loading={pending}>
        {pending
          ? authMessages.ui.registerPendingCta
          : authMessages.ui.registerCta}
      </Button>
    </form>
  );
}
