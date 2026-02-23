-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_organizationId_fkey";

-- DropIndex
DROP INDEX "Subscription_organizationId_idx";

-- Adiciona coluna authUserId como nullable temporariamente
ALTER TABLE "Subscription" ADD COLUMN "authUserId" TEXT;

-- Popula authUserId com o OWNER de cada organização
UPDATE "Subscription" s
SET "authUserId" = m."authUserId"
FROM "Membership" m
WHERE m."organizationId" = s."organizationId"
  AND m.role = 'OWNER';

-- Remove linhas órfãs (sem OWNER encontrado, improvável mas seguro)
DELETE FROM "Subscription" WHERE "authUserId" IS NULL;

-- Remove coluna antiga
ALTER TABLE "Subscription" DROP COLUMN "organizationId";

-- Torna authUserId NOT NULL
ALTER TABLE "Subscription" ALTER COLUMN "authUserId" SET NOT NULL;

-- CreateIndex único (1 subscription por user)
CREATE UNIQUE INDEX "Subscription_authUserId_key" ON "Subscription"("authUserId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_authUserId_fkey" FOREIGN KEY ("authUserId") REFERENCES "auth_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
