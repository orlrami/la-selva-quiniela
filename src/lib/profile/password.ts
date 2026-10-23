import "server-only";

import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const PASSWORD_COST = 12;

export type ChangePasswordFailure =
  | "current-required"
  | "current-wrong"
  | "new-required"
  | "new-too-short"
  | "new-missing-letter"
  | "new-missing-number"
  | "confirm-mismatch"
  | "user-not-found";

export interface ChangePasswordResult {
  ok: boolean;
  error?: ChangePasswordFailure;
}

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ error: "current-required" })
      .min(1, { error: "current-required" }),
    newPassword: z
      .string({ error: "new-required" })
      .min(8, { error: "new-too-short" })
      .regex(/[a-zA-Z]/, { error: "new-missing-letter" })
      .regex(/[0-9]/, { error: "new-missing-number" }),
    confirmPassword: z
      .string({ error: "new-required" })
      .min(1, { error: "new-required" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    error: "confirm-mismatch",
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
): Promise<ChangePasswordResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) return { ok: false, error: "user-not-found" };

  const matches = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!matches) return { ok: false, error: "current-wrong" };

  const newHash = await bcrypt.hash(input.newPassword, PASSWORD_COST);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });
  return { ok: true };
}
