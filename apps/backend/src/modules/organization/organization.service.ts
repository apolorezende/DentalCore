import { prisma } from "../../lib/prisma"
import { uniqueSlug } from "../../lib/slug"

export async function createOrganization(userId: string, name: string) {
  const slug = await uniqueSlug(name)

  const organization = await prisma.organization.create({
    data: { name: name.trim(), slug, status: "TRIAL" },
  })

  await prisma.membership.create({
    data: {
      authUserId: userId,
      organizationId: organization.id,
      role: "OWNER",
      status: "ACTIVE",
    },
  })

  return organization
}

export async function getOrganizationBySlug(slug: string) {
  return prisma.organization.findUnique({ where: { slug } })
}

export async function getOrgMembership(userId: string, organizationId: string) {
  return prisma.membership.findUnique({
    where: { authUserId_organizationId: { authUserId: userId, organizationId } },
  })
}

export async function getOrGenerateInviteCode(organizationId: string, force: boolean) {
  const organization = await prisma.organization.findUnique({ where: { id: organizationId } })
  if (!organization) return null

  const now = new Date()
  const needsNew =
    force ||
    !organization.inviteCode ||
    !organization.inviteCodeExpiresAt ||
    organization.inviteCodeExpiresAt <= now

  if (needsNew) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: { inviteCode: code, inviteCodeExpiresAt: expiresAt },
    })
    return { code: updated.inviteCode, expiresAt: updated.inviteCodeExpiresAt }
  }

  return { code: organization.inviteCode, expiresAt: organization.inviteCodeExpiresAt }
}

export async function deleteOrganization(organizationId: string) {
  await prisma.organization.delete({ where: { id: organizationId } })
}
