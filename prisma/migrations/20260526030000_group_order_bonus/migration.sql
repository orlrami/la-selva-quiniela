CREATE TABLE "GroupOrderBonus" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quinielaId" TEXT NOT NULL,
    "groupCode" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "perfectOrder" BOOLEAN NOT NULL DEFAULT false,
    "top2Correct" BOOLEAN NOT NULL DEFAULT false,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupOrderBonus_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GroupOrderBonus_userId_quinielaId_groupCode_key" ON "GroupOrderBonus"("userId", "quinielaId", "groupCode");
CREATE INDEX "GroupOrderBonus_quinielaId_idx" ON "GroupOrderBonus"("quinielaId");

ALTER TABLE "GroupOrderBonus" ADD CONSTRAINT "GroupOrderBonus_quinielaId_fkey" FOREIGN KEY ("quinielaId") REFERENCES "Quiniela"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupOrderBonus" ADD CONSTRAINT "GroupOrderBonus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
