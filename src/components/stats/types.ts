import type { BonusRevealData } from "@/lib/bonus/reveal";
import type { PlayerStatsData } from "@/lib/stats/data";

export interface StatsDesignProps {
  stats: PlayerStatsData;
  reveal: BonusRevealData;
  currentUserId: string;
}
