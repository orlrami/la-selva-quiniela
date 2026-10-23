import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/app/page-placeholder";
import { StatsPreview } from "@/components/stats/stats-preview";
import { appMessages } from "@/lib/app/messages";
import { getBonusReveal } from "@/lib/bonus/reveal";
import { requireUser } from "@/lib/dal";
import { getPlayerStats } from "@/lib/stats/data";

export const metadata: Metadata = {
  title: `Estadísticas · ${appMessages.brand.name}`,
};

export default async function StatsPage() {
  const user = await requireUser();
  const [stats, reveal] = await Promise.all([
    getPlayerStats(user.id),
    getBonusReveal(user.id),
  ]);

  if (!stats || !reveal) {
    return (
      <PagePlaceholder
        title="Estadísticas"
        subtitle="Aparecerán cuando se jueguen y califiquen los primeros partidos."
      />
    );
  }

  return <StatsPreview stats={stats} reveal={reveal} currentUserId={user.id} />;
}
