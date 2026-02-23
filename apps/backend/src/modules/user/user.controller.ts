import { Request, Response } from "express"
import { Membership, Organization } from "@prisma/client"
import { prisma } from "../../lib/prisma"
import { requireSession } from "../../middleware/require-session"

export async function getMe(req: Request, res: Response) {
  const session = await requireSession(req, res)
  if (!session) return

  const membership = await prisma.membership.findFirst({
    where: { authUserId: session.user.id },
    include: { organization: true },
  })

  res.json({
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image ?? null,
    },
    organization: membership?.organization ?? null,
    role: membership?.role ?? null,
  })
}

export async function getMyOrganizations(req: Request, res: Response) {
  const session = await requireSession(req, res)
  if (!session) return

  const memberships = await prisma.membership.findMany({
    where: { authUserId: session.user.id, status: "ACTIVE" },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  })

  res.json(
    memberships.map((m: Membership & { organization: Organization }) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      status: m.organization.status,
      role: m.role,
    }))
  )
}
