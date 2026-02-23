-- Remove tabela User de negócio (substituída por referência direta ao AuthUser)
DROP TABLE IF EXISTS "User" CASCADE;

-- Remove coluna userId e adiciona authUserId em Membership
ALTER TABLE "Membership" DROP COLUMN IF EXISTS "userId";
ALTER TABLE "Membership" ADD COLUMN "authUserId" TEXT NOT NULL DEFAULT '';

-- Remove constraint única antiga e adiciona nova
DROP INDEX IF EXISTS "Membership_userId_organizationId_key";
CREATE UNIQUE INDEX "Membership_authUserId_organizationId_key" ON "Membership"("authUserId", "organizationId");
