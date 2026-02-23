-- AlterTable: add inviteCode and inviteCodeExpiresAt to Organization
ALTER TABLE "Organization" ADD COLUMN "inviteCode" TEXT;
ALTER TABLE "Organization" ADD COLUMN "inviteCodeExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_inviteCode_key" ON "Organization"("inviteCode");
