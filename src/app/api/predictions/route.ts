import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSession } from "@/lib/dal";
import { predictionMessages } from "@/lib/predictions/messages";
import {
  savePrediction,
  type SavePredictionFailure,
} from "@/lib/predictions/save";

const bodySchema = z
  .object({
    matchId: z.string().min(1),
    homeScore: z.number().int().min(0).max(20).optional(),
    awayScore: z.number().int().min(0).max(20).optional(),
    pickedWinnerTeamId: z.string().min(1).optional(),
  })
  .refine(
    (data) =>
      (data.homeScore !== undefined && data.awayScore !== undefined) ||
      typeof data.pickedWinnerTeamId === "string",
    { error: "missing-prediction-fields" },
  );

const failureToStatus: Record<SavePredictionFailure, number> = {
  "not-member": 403,
  "match-not-found": 404,
  locked: 409,
  "invalid-score": 400,
  "invalid-pick": 400,
  "teams-not-resolved": 409,
};

const failureToMessage: Record<SavePredictionFailure, string> = {
  "not-member": predictionMessages.errors.notMember,
  "match-not-found": predictionMessages.errors.matchNotFound,
  locked: predictionMessages.errors.locked,
  "invalid-score": predictionMessages.errors.invalidScore,
  "invalid-pick": predictionMessages.errors.invalidScore,
  "teams-not-resolved": predictionMessages.errors.matchNotFound,
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json(
      { ok: false, error: predictionMessages.errors.unauthenticated },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: predictionMessages.errors.invalidScore },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: predictionMessages.errors.invalidScore },
      { status: 400 },
    );
  }

  let result;
  try {
    result = await savePrediction({
      userId: session.userId,
      matchId: parsed.data.matchId,
      homeScore: parsed.data.homeScore,
      awayScore: parsed.data.awayScore,
      pickedWinnerTeamId: parsed.data.pickedWinnerTeamId,
    });
  } catch (error) {
    console.error("savePrediction crashed", error);
    return NextResponse.json(
      { ok: false, error: predictionMessages.errors.server },
      { status: 500 },
    );
  }

  if (!result.ok) {
    const failure = result.error ?? "invalid-score";
    return NextResponse.json(
      { ok: false, error: failureToMessage[failure] },
      { status: failureToStatus[failure] },
    );
  }

  revalidatePath("/predictions");
  revalidatePath("/dashboard");

  return NextResponse.json({ ok: true, prediction: result.prediction });
}
