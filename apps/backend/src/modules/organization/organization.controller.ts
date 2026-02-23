import { Request, Response } from "express"
import { requireSession } from "../../middleware/require-session"
import {
  createOrganization,
  deleteOrganization,
  getOrGenerateInviteCode,
  getOrgMembership,
  getOrganizationBySlug,
} from "./organization.service"
import { prisma } from "../../lib/prisma"

export async function getOrganization(req: Request, res: Response) {
  const session = await requireSession(req, res)
  if (!session) return

  const slug = req.params.slug as string

  const organization = await getOrganizationBySlug(slug)
  if (!organization) {
    res.status(404).json({ error: "Organização não encontrada" })
    return
  }

  const membership = await getOrgMembership(session.user.id, organization.id)
  if (!membership || membership.status !== "ACTIVE") {
    res.status(403).json({ error: "Sem acesso a esta organização" })
    return
  }

  res.json({ organization, role: membership.role })
}

export async function postOrganization(req: Request, res: Response) {
  const session = await requireSession(req, res)
  if (!session) return

  const { name } = req.body as { name?: string }
  if (!name || name.trim().length < 2) {
    res.status(400).json({ error: "Nome deve ter pelo menos 2 caracteres" })
    return
  }

  // Verifica plano do usuário
  const subscription = await prisma.subscription.findUnique({
    where: { authUserId: session.user.id },
  })

  if (!subscription || subscription.status === "TRIAL") {
    res.status(403).json({ error: "Seu plano atual não permite criar organizações. Faça upgrade para continuar." })
    return
  }

  // Plano pago: limita a 1 organização própria (como OWNER)
  const ownerCount = await prisma.membership.count({
    where: { authUserId: session.user.id, role: "OWNER", status: "ACTIVE" },
  })
  if (ownerCount >= 1) {
    res.status(403).json({ error: "Seu plano permite criar apenas 1 organização." })
    return
  }

  const organization = await createOrganization(session.user.id, name)
  res.status(201).json({ id: organization.id, name: organization.name, slug: organization.slug })
}

export async function getInviteCode(req: Request, res: Response) {
  const session = await requireSession(req, res)
  if (!session) return

  const slug = req.params.slug as string
  const force = req.query.force === "true"

  const organization = await getOrganizationBySlug(slug)
  if (!organization) {
    res.status(404).json({ error: "Organização não encontrada" })
    return
  }

  const membership = await getOrgMembership(session.user.id, organization.id)
  if (!membership || membership.status !== "ACTIVE") {
    res.status(403).json({ error: "Sem acesso" })
    return
  }
  if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
    res.status(403).json({ error: "Apenas OWNER ou ADMIN podem ver o código de convite" })
    return
  }

  const result = await getOrGenerateInviteCode(organization.id, force)
  res.json(result)
}

export async function deleteOrg(req: Request, res: Response) {
  const session = await requireSession(req, res)
  if (!session) return

  const slug = req.params.slug as string

  const organization = await getOrganizationBySlug(slug)
  if (!organization) {
    res.status(404).json({ error: "Organização não encontrada" })
    return
  }

  const membership = await getOrgMembership(session.user.id, organization.id)
  if (!membership || membership.status !== "ACTIVE" || membership.role !== "OWNER") {
    res.status(403).json({ error: "Apenas o proprietário pode excluir a organização" })
    return
  }

  await deleteOrganization(organization.id)
  res.json({ message: "Organização excluída com sucesso" })
}
