import { NextResponse, type NextRequest } from "next/server";

import {
  autoGradeMatches,
  syncFifaRanks,
  updateLiveStatuses,
} from "@/lib/autograder/grader";
import { syncR32FromEspn } from "@/lib/autograder/r32-sync";
import { syncKickoffsFromEspn } from "@/lib/autograder/kickoff-sync";

function isAuthorized(request: NextRequest): boolean {
  const key = process.env.AUTOGRADER_SECRET;
  if (!key) return false;
  const header = request.headers.get("x-autograder-key");
  return header === key;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const [gradeResult, liveUpdated, ranksUpdated, r32Confirmed, kickoffsSynced] =
      await Promise.all([
        autoGradeMatches(),
        updateLiveStatuses(),
        syncFifaRanks(),
        syncR32FromEspn(),
        syncKickoffsFromEspn(),
      ]);

    return NextResponse.json({
      ok: true,
      graded: gradeResult.graded,
      skipped: gradeResult.skipped,
      errors: gradeResult.errors,
      liveUpdated,
      ranksUpdated,
      r32Confirmed,
      kickoffsSynced,
      fixturesProcessed: gradeResult.processed,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 },
    );
  }
}
