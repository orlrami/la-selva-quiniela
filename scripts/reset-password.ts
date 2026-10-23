// Reset a user's password by username.
// Usage: npx tsx scripts/reset-password.ts <username> <newPassword>
import "dotenv/config";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { normalizeUsername } from "@/lib/auth/schemas";

const PASSWORD_COST = 12;

async function main() {
  const [username, newPassword] = process.argv.slice(2);
  if (!username || !newPassword) {
    throw new Error("Usage: tsx scripts/reset-password.ts <username> <newPassword>");
  }

  const usernameKey = normalizeUsername(username);
  const user = await prisma.user.findUnique({
    where: { usernameKey },
    select: { id: true, username: true },
  });
  if (!user) throw new Error(`No user with username "${username}" (key="${usernameKey}")`);

  const passwordHash = await bcrypt.hash(newPassword, PASSWORD_COST);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  console.log(`Password reset for "${user.username}". New password: ${newPassword}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
