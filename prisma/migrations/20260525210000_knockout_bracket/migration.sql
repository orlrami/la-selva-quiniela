-- New enum used by Match.winnerFeedsAs / loserFeedsAs.
CREATE TYPE "Side" AS ENUM ('HOME', 'AWAY');

-- Match: knockout matches start without teams (resolved as earlier rounds finish).
ALTER TABLE "Match" ALTER COLUMN "homeTeamId" DROP NOT NULL;
ALTER TABLE "Match" ALTER COLUMN "awayTeamId" DROP NOT NULL;

-- Match: bracket positioning + winner/loser feed links.
ALTER TABLE "Match" ADD COLUMN "bracketSlot" TEXT;
ALTER TABLE "Match" ADD COLUMN "winnerFeedsToId" TEXT;
ALTER TABLE "Match" ADD COLUMN "winnerFeedsAs" "Side";
ALTER TABLE "Match" ADD COLUMN "loserFeedsToId" TEXT;
ALTER TABLE "Match" ADD COLUMN "loserFeedsAs" "Side";

ALTER TABLE "Match"
  ADD CONSTRAINT "Match_winnerFeedsToId_fkey"
  FOREIGN KEY ("winnerFeedsToId") REFERENCES "Match"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Match"
  ADD CONSTRAINT "Match_loserFeedsToId_fkey"
  FOREIGN KEY ("loserFeedsToId") REFERENCES "Match"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Match_bracketSlot_idx" ON "Match"("bracketSlot");

-- Prediction: knockout picks store a winner team instead of scores.
ALTER TABLE "Prediction" ALTER COLUMN "homeScore" DROP NOT NULL;
ALTER TABLE "Prediction" ALTER COLUMN "awayScore" DROP NOT NULL;
ALTER TABLE "Prediction" ADD COLUMN "pickedWinnerTeamId" TEXT;
ALTER TABLE "Prediction" ADD COLUMN "correctWinner" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Prediction"
  ADD CONSTRAINT "Prediction_pickedWinnerTeamId_fkey"
  FOREIGN KEY ("pickedWinnerTeamId") REFERENCES "Team"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Prediction_pickedWinnerTeamId_idx" ON "Prediction"("pickedWinnerTeamId");
