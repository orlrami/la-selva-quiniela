import type { ReactNode } from "react";

import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/dal";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="grid gap-5">
      <AdminNav />
      {children}
    </div>
  );
}
