import "server-only";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { AVATAR_COLOR_VALUES } from "./messages";

export type SaveProfileFailure = "invalid-name" | "invalid-avatar-color";

export interface SaveProfileResult {
  ok: boolean;
  error?: SaveProfileFailure;
  profile?: {
    name: string;
    avatarColor: string;
  };
}

export const saveProfileSchema = z.object({
  name: z
    .string({ error: "invalid-name" })
    .trim()
    .min(2, { error: "invalid-name" })
    .max(40, { error: "invalid-name" }),
  avatarColor: z
    .string()
    .refine((value) => AVATAR_COLOR_VALUES.includes(value as never), {
      error: "invalid-avatar-color",
    }),
});

export type SaveProfileInput = z.infer<typeof saveProfileSchema>;

export async function saveProfile(
  userId: string,
  input: SaveProfileInput,
): Promise<SaveProfileResult> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name,
      avatarColor: input.avatarColor,
    },
    select: { name: true, avatarColor: true },
  });
  return { ok: true, profile: user };
}
