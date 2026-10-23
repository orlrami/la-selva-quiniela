import type { ReactNode } from "react";

import { AppHeader } from "@/components/app/app-header";
import { BottomNav } from "@/components/app/bottom-nav";
import { requireUser } from "@/lib/dal";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <div className="relative flex min-h-screen flex-1 flex-col">
      <AppHeader
        userName={user.name}
        userRole={user.role}
        avatarColor={user.avatarColor}
      />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:py-10">
        {children}
      </main>
      <footer className="border-t border-white/8 py-4 text-center text-[11px] text-[var(--muted-foreground)]">
        Quiniela made by Orlando Jesus
      </footer>
      <BottomNav userRole={user.role} />
    </div>
  );
}
