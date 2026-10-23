"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { loginAction, type LoginFormState } from "@/lib/auth/actions";
import { authMessages } from "@/lib/auth/messages";

const initialState: LoginFormState = null;

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      {state?.formError ? (
        <Toast variant="warning" title={state.formError} />
      ) : null}

      <Input
        label={authMessages.ui.fieldUsername}
        name="username"
        type="text"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        defaultValue={state?.values?.username ?? ""}
        placeholder={authMessages.ui.fieldUsernamePlaceholder}
        error={state?.fieldErrors?.username?.[0]}
        required
      />
      <Input
        label={authMessages.ui.fieldPassword}
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder={authMessages.ui.fieldPasswordPlaceholder}
        error={state?.fieldErrors?.password?.[0]}
        required
      />

      <Button type="submit" size="lg" fullWidth loading={pending}>
        {pending ? authMessages.ui.loginPendingCta : authMessages.ui.loginCta}
      </Button>
    </form>
  );
}
