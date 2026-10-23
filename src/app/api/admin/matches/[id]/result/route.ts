import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/lib/dal";
import { adminMessages } from "@/lib/admin/messages";
import {
  clearMatchResult,
  setMatchResult,
  type MatchResultFailure,
} from "@/lib/admin/match-results";

const bodySchema = z.object({
  homeScore: z.number().int().min(0).max(20),
  awayScore: z.number().int().min(0).max(20),
});

const failureStatus: Record<MatchResultFailure, number> = {
  "match-not-found": 404,
  "invalid-score": 400,
};

const failureMessage: Record<MatchResultFailure, string> = {
  "match-not-found": adminMessages.errors.matchNotFound,
  "invalid-score": adminMessages.errors.invalidScore,
};

async function requireAdminUser() {
  const user = await getCurrentUser();
  if (!user) return { status: 401, message: "Sesión no válida" } as const;
  if (user.role !== "ADMIN") {
    return { status: 403, message: adminMessages.errors.notAdmin } as const;
  }
  return { user } as const;
}

function revalidateAfterScoreChange() {
  revalidatePath("/admin");
  revalidatePath("/admin/matches");
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
  revalidatePath("/predictions");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminUser();
  if ("status" in guard) {
    return NextResponse.json(
      { ok: false, error: guard.message },
      { status: guard.status },
    );
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: adminMessages.errors.invalidScore },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: adminMessages.errors.invalidScore },
      { status: 400 },
    );
  }

  let result;
  try {
    result = await setMatchResult(
      id,
      parsed.data.homeScore,
      parsed.data.awayScore,
    );
  } catch (error) {
    console.error("setMatchResult crashed", error);
    return NextResponse.json(
      { ok: false, error: adminMessages.errors.server },
      { status: 500 },
    );
  }

  if (!result.ok) {
    const failure = result.error ?? "invalid-score";
    return NextResponse.json(
      { ok: false, error: failureMessage[failure] },
      { status: failureStatus[failure] },
    );
  }

  revalidateAfterScoreChange();
  return NextResponse.json({
    ok: true,
    updatedPredictions: result.updatedPredictions,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminUser();
  if ("status" in guard) {
    return NextResponse.json(
      { ok: false, error: guard.message },
      { status: guard.status },
    );
  }

  const { id } = await params;

  let result;
  try {
    result = await clearMatchResult(id);
  } catch (error) {
    console.error("clearMatchResult crashed", error);
    return NextResponse.json(
      { ok: false, error: adminMessages.errors.server },
      { status: 500 },
    );
  }

  if (!result.ok) {
    const failure = result.error ?? "match-not-found";
    return NextResponse.json(
      { ok: false, error: failureMessage[failure] },
      { status: failureStatus[failure] },
    );
  }

  revalidateAfterScoreChange();
  return NextResponse.json({ ok: true });
}
