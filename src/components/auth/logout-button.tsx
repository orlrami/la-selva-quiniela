"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/auth/actions";
import { authMessages } from "@/lib/auth/messages";

export function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      loading={pending}
      onClick={() => {
        startTransition(async () => {
          await logoutAction();
        });
      }}
    >
      <LogOut className="size-4" aria-hidden />
      {pending ? authMessages.ui.logoutPending : authMessages.ui.logout}
    </Button>
  );
}
