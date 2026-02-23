import { Request, Response } from "express"
import { requireSession } from "../../middleware/require-session"
import { getOrgMembership, getOrganizationBySlug } from "./organization.service"
import { joinByCode, listMembers, updateMemberStatus } from "./membership.service"
import { prisma } from "../../lib/prisma"

export async function postJoinByCode(req: Request, res: Response) {
  const session = await requireSession(req, res)
  if (!session) return

  const { code } = req.body as { code?: string }
  if (!code || code.trim().length === 0) {
    res.status(400).json({ error: "Código inválido" })
    return
  }

  const result = await joinByCode(session.user.id, code)
  if ("error" in result) {
    res.status(result.status).json({ error: result.error })
    return
  }

  res.json(result)
}

export async function getMembers(req: Request, res: Response) {
  const session = await requireSession(req, res)
  if (!session) return

  const slug = req.params.slug as string

  const organization = await getOrganizationBySlug(slug)
  if (!organization) {
    res.status(404).json({ error: "Organização não encontrada" })
    return
  }

  const requester = await getOrgMembership(session.user.id, organization.id)
  if (!requester || requester.status !== "ACTIVE") {
    res.status(403).json({ error: "Sem acesso" })
    return
  }

  const members = await listMembers(organization.id)
  res.json(members)
}

export async function patchMember(req: Request, res: Response) {
  const session = await requireSession(req, res)
  if (!session) return

  const slug = req.params.slug as string
  const memberId = req.params.memberId as string
  const { action, role } = req.body as { action?: "approve" | "reject" | "remove"; role?: string }

  if (!action || !["approve", "reject", "remove"].includes(action)) {
    res.status(400).json({ error: "Ação inválida" })
    return
  }

  const organization = await getOrganizationBySlug(slug)
  if (!organization) {
    res.status(404).json({ error: "Organização não encontrada" })
    return
  }

  const requester = await getOrgMembership(session.user.id, organization.id)
  if (!requester || requester.status !== "ACTIVE" || (requester.role !== "OWNER" && requester.role !== "ADMIN")) {
    res.status(403).json({ error: "Apenas OWNER ou ADMIN podem gerenciar membros" })
    return
  }

  const target = await prisma.membership.findUnique({ where: { id: memberId } })
  if (!target || target.organizationId !== organization.id) {
    res.status(404).json({ error: "Membro não encontrado" })
    return
  }
  if (target.authUserId === session.user.id) {
    res.status(400).json({ error: "Não é possível alterar seu próprio membership" })
    return
  }

  const result = await updateMemberStatus(memberId, action, role)
  res.json(result)
}
