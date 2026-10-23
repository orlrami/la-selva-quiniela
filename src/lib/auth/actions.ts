"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";

import { authMessages } from "./messages";
import {
  loginSchema,
  normalizeUsername,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "./schemas";

const PASSWORD_COST = 12;

type FieldErrors<T extends z.ZodTypeAny> = Partial<
  Record<keyof z.infer<T>, string[]>
>;

export type LoginFormState = {
  formError?: string;
  fieldErrors?: FieldErrors<typeof loginSchema>;
  values?: Partial<LoginInput>;
} | null;

export type RegisterFormState = {
  formError?: string;
  fieldErrors?: FieldErrors<typeof registerSchema>;
  values?: Partial<RegisterInput>;
} | null;

function fieldErrorsFromZod<T extends z.ZodTypeAny>(
  error: z.ZodError<z.infer<T>>,
): FieldErrors<T> {
  const result: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key !== "string") continue;
    if (!result[key]) result[key] = [];
    result[key].push(issue.message);
  }
  return result as FieldErrors<T>;
}

export async function loginAction(
  _previous: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const raw = {
    username: formData.get("username"),
    password: formData.get("password"),
  };
  const parsed = loginSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      fieldErrors: fieldErrorsFromZod(parsed.error),
      values: {
        username: typeof raw.username === "string" ? raw.username : "",
      },
    };
  }

  const { username, password } = parsed.data;
  const usernameKey = normalizeUsername(username);

  try {
    const user = await prisma.user.findUnique({
      where: { usernameKey },
      select: { id: true, role: true, passwordHash: true },
    });

    if (!user) {
      return {
        formError: authMessages.errors.invalidCredentials,
        values: { username },
      };
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return {
        formError: authMessages.errors.invalidCredentials,
        values: { username },
      };
    }

    await createSession(user.id, user.role);
  } catch (error) {
    console.error("loginAction failed", error);
    return {
      formError: authMessages.errors.serverError,
      values: { username },
    };
  }

  redirect("/dashboard");
}

export async function registerAction(
  _previous: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const raw = {
    token: formData.get("token"),
    username: formData.get("username"),
    password: formData.get("password"),
  };
  const parsed = registerSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      fieldErrors: fieldErrorsFromZod(parsed.error),
      values: {
        token: typeof raw.token === "string" ? raw.token : "",
        username: typeof raw.username === "string" ? raw.username : "",
      },
    };
  }

  const { token, username, password } = parsed.data;
  const usernameKey = normalizeUsername(username);

  let userId: string;
  let role: "MEMBER" | "ADMIN" = "MEMBER";

  try {
    const invite = await prisma.invite.findUnique({
      where: { token },
      select: {
        id: true,
        quinielaId: true,
        maxUses: true,
        useCount: true,
        expiresAt: true,
      },
    });

    if (!invite) {
      return {
        formError: authMessages.errors.inviteNotFound,
        values: { token, username },
      };
    }

    if (invite.expiresAt.getTime() < Date.now()) {
      return {
        formError: authMessages.errors.inviteExpired,
        values: { token, username },
      };
    }

    if (invite.useCount >= invite.maxUses) {
      return {
        formError: authMessages.errors.inviteExhausted,
        values: { token, username },
      };
    }

    const existing = await prisma.user.findUnique({
      where: { usernameKey },
      select: { id: true },
    });
    if (existing) {
      return {
        formError: authMessages.errors.accountAlreadyExists,
        values: { token, username },
      };
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_COST);

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username,
          usernameKey,
          name: username,
          passwordHash,
        },
        select: { id: true, role: true },
      });

      await tx.quinielaMember.create({
        data: {
          userId: user.id,
          quinielaId: invite.quinielaId,
          role: "PLAYER",
        },
      });

      await tx.invite.update({
        where: { id: invite.id },
        data: {
          useCount: { increment: 1 },
          usedById: user.id,
          usedAt: new Date(),
        },
      });

      return user;
    });

    userId = created.id;
    role = created.role;
  } catch (error) {
    console.error("registerAction failed", error);
    return {
      formError: authMessages.errors.serverError,
      values: { token, username },
    };
  }

  await createSession(userId, role);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
