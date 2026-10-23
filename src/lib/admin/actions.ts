"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/dal";

import {
  clearMatchResult,
  setMatchResult,
  type MatchResultFailure,
} from "./match-results";
import { adminMessages } from "./messages";
import {
  createInvite,
  revokeInvite,
  type InviteFailure,
} from "./invites";

type FieldErrors = Record<string, string[]>;

export interface MatchResultActionState {
  matchId?: string;
  formError?: string;
  fieldErrors?: FieldErrors;
  ok?: boolean;
  cleared?: boolean;
}

export interface InviteCreateActionState {
  formError?: string;
  fieldErrors?: FieldErrors;
  ok?: boolean;
  invite?: { id: string; token: string };
}

const matchResultBodySchema = z.object({
  matchId: z.string().min(1),
  homeScore: z.coerce.number().int().min(0).max(20),
  awayScore: z.coerce.number().int().min(0).max(20),
});

const matchClearBodySchema = z.object({
  matchId: z.string().min(1),
});

const inviteCreateBodySchema = z.object({
  maxUses: z.coerce.number().int().min(1).max(200),
  expiresInDays: z.coerce.number().int().min(1).max(365),
});

const matchFailureMessage: Record<MatchResultFailure, string> = {
  "match-not-found": adminMessages.errors.matchNotFound,
  "invalid-score": adminMessages.errors.invalidScore,
};

const inviteFailureMessage: Record<InviteFailure, string> = {
  "invalid-max-uses": adminMessages.errors.invalidMaxUses,
  "invalid-expires": adminMessages.errors.invalidExpires,
  "invite-not-found": adminMessages.errors.inviteCreateFailed,
};

function revalidateAfterScoreChange() {
  revalidatePath("/admin");
  revalidatePath("/admin/matches");
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
  revalidatePath("/predictions");
}

function revalidateAfterInviteChange() {
  revalidatePath("/admin");
  revalidatePath("/admin/invites");
}

export async function setMatchResultAction(
  _previous: MatchResultActionState | null,
  formData: FormData,
): Promise<MatchResultActionState> {
  await requireAdmin();

  const raw = {
    matchId: formData.get("matchId"),
    homeScore: formData.get("homeScore"),
    awayScore: formData.get("awayScore"),
  };
  const parsed = matchResultBodySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      matchId: typeof raw.matchId === "string" ? raw.matchId : undefined,
      formError: adminMessages.errors.invalidScore,
    };
  }

  try {
    const result = await setMatchResult(
      parsed.data.matchId,
      parsed.data.homeScore,
      parsed.data.awayScore,
    );
    if (!result.ok) {
      return {
        matchId: parsed.data.matchId,
        formError:
          matchFailureMessage[result.error ?? "invalid-score"] ??
          adminMessages.errors.server,
      };
    }
  } catch (error) {
    console.error("setMatchResultAction failed", error);
    return {
      matchId: parsed.data.matchId,
      formError: adminMessages.errors.server,
    };
  }

  revalidateAfterScoreChange();
  return { matchId: parsed.data.matchId, ok: true };
}

export async function clearMatchResultAction(
  _previous: MatchResultActionState | null,
  formData: FormData,
): Promise<MatchResultActionState> {
  await requireAdmin();

  const parsed = matchClearBodySchema.safeParse({
    matchId: formData.get("matchId"),
  });
  if (!parsed.success) {
    return { formError: adminMessages.errors.matchNotFound };
  }

  try {
    const result = await clearMatchResult(parsed.data.matchId);
    if (!result.ok) {
      return {
        matchId: parsed.data.matchId,
        formError:
          matchFailureMessage[result.error ?? "match-not-found"] ??
          adminMessages.errors.server,
      };
    }
  } catch (error) {
    console.error("clearMatchResultAction failed", error);
    return {
      matchId: parsed.data.matchId,
      formError: adminMessages.errors.server,
    };
  }

  revalidateAfterScoreChange();
  return { matchId: parsed.data.matchId, ok: true, cleared: true };
}

export async function createInviteAction(
  _previous: InviteCreateActionState | null,
  formData: FormData,
): Promise<InviteCreateActionState> {
  const admin = await requireAdmin();

  const parsed = inviteCreateBodySchema.safeParse({
    maxUses: formData.get("maxUses"),
    expiresInDays: formData.get("expiresInDays"),
  });
  if (!parsed.success) {
    return { formError: adminMessages.errors.inviteCreateFailed };
  }

  try {
    const result = await createInvite({
      createdById: admin.id,
      maxUses: parsed.data.maxUses,
      expiresInDays: parsed.data.expiresInDays,
    });
    if (!result.ok) {
      return {
        formError:
          inviteFailureMessage[result.error ?? "invite-not-found"] ??
          adminMessages.errors.server,
      };
    }
    revalidateAfterInviteChange();
    return { ok: true, invite: result.invite };
  } catch (error) {
    console.error("createInviteAction failed", error);
    return { formError: adminMessages.errors.server };
  }
}

export async function revokeInviteAction(
  _previous: { ok?: boolean; formError?: string } | null,
  formData: FormData,
): Promise<{ ok?: boolean; formError?: string }> {
  await requireAdmin();

  const inviteId = formData.get("inviteId");
  if (typeof inviteId !== "string" || inviteId.length === 0) {
    return { formError: adminMessages.errors.inviteRevokeFailed };
  }

  try {
    const result = await revokeInvite(inviteId);
    if (!result.ok) {
      return { formError: adminMessages.errors.inviteRevokeFailed };
    }
    revalidateAfterInviteChange();
    return { ok: true };
  } catch (error) {
    console.error("revokeInviteAction failed", error);
    return { formError: adminMessages.errors.server };
  }
}
