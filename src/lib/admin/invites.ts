import "server-only";

import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

export type InviteFailure =
  | "invalid-max-uses"
  | "invalid-expires"
  | "invite-not-found";

export interface CreateInviteInput {
  createdById: string;
  maxUses: number;
  expiresInDays: number;
}

export interface CreateInviteOutcome {
  ok: boolean;
  error?: InviteFailure;
  invite?: { id: string; token: string };
}

const TOKEN_BYTES = 16;
const MAX_USES_LIMIT = 200;
const MAX_EXPIRES_DAYS = 365;

export async function createInvite(
  input: CreateInviteInput,
): Promise<CreateInviteOutcome> {
  if (
    !Number.isInteger(input.maxUses) ||
    input.maxUses < 1 ||
    input.maxUses > MAX_USES_LIMIT
  ) {
    return { ok: false, error: "invalid-max-uses" };
  }
  if (
    !Number.isInteger(input.expiresInDays) ||
    input.expiresInDays < 1 ||
    input.expiresInDays > MAX_EXPIRES_DAYS
  ) {
    return { ok: false, error: "invalid-expires" };
  }

  const quiniela = await prisma.quiniela.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!quiniela) {
    return { ok: false, error: "invite-not-found" };
  }

  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  const expiresAt = new Date(
    Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000,
  );

  const invite = await prisma.invite.create({
    data: {
      quinielaId: quiniela.id,
      createdById: input.createdById,
      token,
      maxUses: input.maxUses,
      expiresAt,
    },
    select: { id: true, token: true },
  });

  return { ok: true, invite };
}

export async function revokeInvite(
  inviteId: string,
): Promise<CreateInviteOutcome> {
  if (typeof inviteId !== "string" || inviteId.length === 0) {
    return { ok: false, error: "invite-not-found" };
  }
  const existing = await prisma.invite.findUnique({
    where: { id: inviteId },
    select: { id: true },
  });
  if (!existing) {
    return { ok: false, error: "invite-not-found" };
  }
  await prisma.invite.delete({ where: { id: inviteId } });
  return { ok: true };
}
