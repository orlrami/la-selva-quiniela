-- Drop the unique index on email and the email column itself
DROP INDEX IF EXISTS "User_email_key";
ALTER TABLE "User" DROP COLUMN IF EXISTS "email";

-- Consolidate displayName into name (column already populated separately)
ALTER TABLE "User" DROP COLUMN IF EXISTS "displayName";

-- Add the new username + normalized usernameKey columns
ALTER TABLE "User" ADD COLUMN "username" TEXT NOT NULL;
ALTER TABLE "User" ADD COLUMN "usernameKey" TEXT NOT NULL;
CREATE UNIQUE INDEX "User_usernameKey_key" ON "User"("usernameKey");

-- Drop the optional email pin on invites
ALTER TABLE "Invite" DROP COLUMN IF EXISTS "email";
