CREATE TYPE "BonusCategory" AS ENUM ('CHAMPION', 'RUNNER_UP', 'THIRD_PLACE', 'GOLDEN_BOOT', 'GOLDEN_GLOVE', 'GOLDEN_BALL');

CREATE TABLE "BonusPick" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quinielaId" TEXT NOT NULL,
    "category" "BonusCategory" NOT NULL,
    "teamId" TEXT,
    "playerName" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "correct" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BonusPick_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BonusPick_quinielaId_idx" ON "BonusPick"("quinielaId");
CREATE INDEX "BonusPick_teamId_idx" ON "BonusPick"("teamId");
CREATE UNIQUE INDEX "BonusPick_userId_quinielaId_category_key" ON "BonusPick"("userId", "quinielaId", "category");

ALTER TABLE "BonusPick" ADD CONSTRAINT "BonusPick_quinielaId_fkey" FOREIGN KEY ("quinielaId") REFERENCES "Quiniela"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BonusPick" ADD CONSTRAINT "BonusPick_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BonusPick" ADD CONSTRAINT "BonusPick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
