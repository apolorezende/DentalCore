import { prisma } from "../../lib/prisma"

export async function listMembers(organizationId: string) {
  const memberships = await prisma.membership.findMany({
    where: { organizationId, status: { in: ["ACTIVE", "INVITED"] } },
    orderBy: { createdAt: "asc" },
  })

  const userIds = memberships.map((m) => m.authUserId)
  const users = await prisma.user.findMany({ where: { id: { in: userIds } } })
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]))

  return memberships.map((m) => ({
    membershipId: m.id,
    authUserId: m.authUserId,
    name: userMap[m.authUserId]?.name ?? "Desconhecido",
    email: userMap[m.authUserId]?.email ?? "",
    role: m.role,
    status: m.status,
    createdAt: m.createdAt,
  }))
}

export async function joinByCode(userId: string, code: string) {
  const now = new Date()
  const organization = await prisma.organization.findFirst({
    where: { inviteCode: code.trim().toUpperCase(), inviteCodeExpiresAt: { gt: now } },
  })
  if (!organization) return { error: "Código inválido ou expirado", status: 404 }

  const existing = await prisma.membership.findUnique({
    where: { authUserId_organizationId: { authUserId: userId, organizationId: organization.id } },
  })
  if (existing?.status === "ACTIVE") return { error: "Você já é membro desta organização", status: 409 }
  if (existing?.status === "INVITED") return { error: "Você já tem uma solicitação pendente para esta organização", status: 409 }

  await prisma.membership.upsert({
    where: { authUserId_organizationId: { authUserId: userId, organizationId: organization.id } },
    create: { authUserId: userId, organizationId: organization.id, role: "DENTIST", status: "INVITED" },
    update: { status: "INVITED", role: "DENTIST" },
  })

  return { orgName: organization.name, message: "Solicitação enviada! Aguarde aprovação do responsável." }
}

const VALID_ROLES = ["OWNER", "ADMIN", "DENTIST", "SECRETARY", "FINANCE"]

export async function updateMemberStatus(
  memberId: string,
  action: "approve" | "reject" | "remove",
  role?: string
) {
  if (action === "approve") {
    const newRole = role && VALID_ROLES.includes(role) ? role : "DENTIST"
    await prisma.membership.update({ where: { id: memberId }, data: { status: "ACTIVE", role: newRole as any } })
    return { message: "Membro aprovado" }
  }

  await prisma.membership.update({ where: { id: memberId }, data: { status: "REMOVED" } })
  return { message: action === "reject" ? "Solicitação rejeitada" : "Membro removido" }
}
