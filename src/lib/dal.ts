import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { readSessionFromCookies, type SessionPayload } from "@/lib/session";

export interface AuthenticatedUser {
  id: string;
  username: string;
  name: string;
  avatarColor: string;
  role: "MEMBER" | "ADMIN";
}

export const getSession = cache(async (): Promise<SessionPayload | null> => {
  return readSessionFromCookies();
});

export const verifySession = cache(async (): Promise<SessionPayload> => {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }
  return session;
});

export const getCurrentUser = cache(
  async (): Promise<AuthenticatedUser | null> => {
    const session = await getSession();
    if (!session?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        username: true,
        name: true,
        avatarColor: true,
        role: true,
      },
    });

    return user ?? null;
  },
);

export async function requireUser(): Promise<AuthenticatedUser> {
  await verifySession();
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return user;
}
