-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "advancerTeamId" TEXT,
ADD COLUMN     "decidedByPenalties" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Match_advancerTeamId_idx" ON "Match"("advancerTeamId");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_advancerTeamId_fkey" FOREIGN KEY ("advancerTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
