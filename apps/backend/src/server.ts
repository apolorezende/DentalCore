import "./lib/auth" // garante dotenv.config() antes de tudo
import express, { Request, Response } from "express"
import cors from "cors"
import { toNodeHandler } from "better-auth/node"
import { auth, prisma } from "./lib/auth"

const app = express()

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  })
)

app.use(express.json())

// Monta todas as rotas do better-auth em /api/auth/*
app.all("/api/auth/*splat", toNodeHandler(auth))

// Helper: obtém sessão ou responde 401
async function requireSession(req: Request, res: Response) {
  const session = await auth.api.getSession({ headers: req.headers as any })
  if (!session) {
    res.status(401).json({ error: "Não autenticado" })
    return null
  }
  return session
}

// Retorna dados do usuário logado + primeira organização
app.get("/api/me", async (req: Request, res: Response) => {
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
})

// Retorna todas as orgs do usuário logado
app.get("/api/me/organizations", async (req: Request, res: Response) => {
  const session = await requireSession(req, res)
  if (!session) return

  const memberships = await prisma.membership.findMany({
    where: { authUserId: session.user.id, status: "ACTIVE" },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  })

  res.json(
    memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      status: m.organization.status,
      role: m.role,
    }))
  )
})

// Valida acesso e retorna dados de uma org pelo slug
app.get("/api/organizations/:slug", async (req: Request, res: Response) => {
  const session = await requireSession(req, res)
  if (!session) return

  const slug = req.params.slug as string

  const organization = await prisma.organization.findUnique({ where: { slug } })
  if (!organization) {
    res.status(404).json({ error: "Organização não encontrada" })
    return
  }

  const membership = await prisma.membership.findUnique({
    where: {
      authUserId_organizationId: {
        authUserId: session.user.id,
        organizationId: organization.id,
      },
    },
  })

  if (!membership || membership.status !== "ACTIVE") {
    res.status(403).json({ error: "Sem acesso a esta organização" })
    return
  }

  res.json({
    organization,
    role: membership.role,
  })
})

// Cria nova organização e membership OWNER
app.post("/api/organizations", async (req: Request, res: Response) => {
  const session = await requireSession(req, res)
  if (!session) return

  const { name } = req.body as { name?: string }
  if (!name || name.trim().length < 2) {
    res.status(400).json({ error: "Nome deve ter pelo menos 2 caracteres" })
    return
  }

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

  let slug = slugify(name)
  let suffix = 0
  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`
    const existing = await prisma.organization.findUnique({ where: { slug: candidate } })
    if (!existing) { slug = candidate; break }
    suffix++
  }

  const organization = await prisma.organization.create({
    data: { name: name.trim(), slug, status: "TRIAL" },
  })

  await prisma.membership.create({
    data: {
      authUserId: session.user.id,
      organizationId: organization.id,
      role: "OWNER",
      status: "ACTIVE",
    },
  })

  await prisma.subscription.create({
    data: {
      organizationId: organization.id,
      planName: "trial",
      status: "TRIAL",
    },
  })

  res.status(201).json({ id: organization.id, name: organization.name, slug: organization.slug })
})

// Gera/retorna código de convite da org (OWNER/ADMIN)
app.get("/api/organizations/:slug/invite-code", async (req: Request, res: Response) => {
  const session = await requireSession(req, res)
  if (!session) return

  const slug = req.params.slug as string
  const force = req.query.force === "true"

  const organization = await prisma.organization.findUnique({ where: { slug } })
  if (!organization) { res.status(404).json({ error: "Organização não encontrada" }); return }

  const membership = await prisma.membership.findUnique({
    where: { authUserId_organizationId: { authUserId: session.user.id, organizationId: organization.id } },
  })
  if (!membership || membership.status !== "ACTIVE") { res.status(403).json({ error: "Sem acesso" }); return }
  if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
    res.status(403).json({ error: "Apenas OWNER ou ADMIN podem ver o código de convite" }); return
  }

  const now = new Date()
  const needsNew = force || !organization.inviteCode || !organization.inviteCodeExpiresAt || organization.inviteCodeExpiresAt <= now

  if (needsNew) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const updated = await prisma.organization.update({
      where: { id: organization.id },
      data: { inviteCode: code, inviteCodeExpiresAt: expiresAt },
    })
    res.json({ code: updated.inviteCode, expiresAt: updated.inviteCodeExpiresAt }); return
  }

  res.json({ code: organization.inviteCode, expiresAt: organization.inviteCodeExpiresAt })
})

// Usuário entra numa org pelo código de convite
app.post("/api/organizations/join-by-code", async (req: Request, res: Response) => {
  const session = await requireSession(req, res)
  if (!session) return

  const { code } = req.body as { code?: string }
  if (!code || code.trim().length === 0) { res.status(400).json({ error: "Código inválido" }); return }

  const now = new Date()
  const organization = await prisma.organization.findFirst({
    where: { inviteCode: code.trim().toUpperCase(), inviteCodeExpiresAt: { gt: now } },
  })
  if (!organization) { res.status(404).json({ error: "Código inválido ou expirado" }); return }

  const existing = await prisma.membership.findUnique({
    where: { authUserId_organizationId: { authUserId: session.user.id, organizationId: organization.id } },
  })
  if (existing && existing.status === "ACTIVE") { res.status(409).json({ error: "Você já é membro desta organização" }); return }
  if (existing && existing.status === "INVITED") { res.status(409).json({ error: "Você já tem uma solicitação pendente para esta organização" }); return }

  await prisma.membership.upsert({
    where: { authUserId_organizationId: { authUserId: session.user.id, organizationId: organization.id } },
    create: { authUserId: session.user.id, organizationId: organization.id, role: "DENTIST", status: "INVITED" },
    update: { status: "INVITED", role: "DENTIST" },
  })

  res.json({ orgName: organization.name, message: "Solicitação enviada! Aguarde aprovação do responsável." })
})

// Lista membros da org (qualquer membro autenticado)
app.get("/api/organizations/:slug/members", async (req: Request, res: Response) => {
  const session = await requireSession(req, res)
  if (!session) return

  const slug = req.params.slug as string

  const organization = await prisma.organization.findUnique({ where: { slug } })
  if (!organization) { res.status(404).json({ error: "Organização não encontrada" }); return }

  const requester = await prisma.membership.findUnique({
    where: { authUserId_organizationId: { authUserId: session.user.id, organizationId: organization.id } },
  })
  if (!requester || requester.status !== "ACTIVE") { res.status(403).json({ error: "Sem acesso" }); return }

  const memberships = await prisma.membership.findMany({
    where: { organizationId: organization.id, status: { in: ["ACTIVE", "INVITED"] } },
    orderBy: { createdAt: "asc" },
  })

  const userIds = memberships.map((m) => m.authUserId)
  const users = await prisma.user.findMany({ where: { id: { in: userIds } } })
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]))

  res.json(
    memberships.map((m) => ({
      membershipId: m.id,
      authUserId: m.authUserId,
      name: userMap[m.authUserId]?.name ?? "Desconhecido",
      email: userMap[m.authUserId]?.email ?? "",
      role: m.role,
      status: m.status,
      createdAt: m.createdAt,
    }))
  )
})

// Aprova, rejeita ou remove membro (OWNER/ADMIN)
app.patch("/api/organizations/:slug/members/:memberId", async (req: Request, res: Response) => {
  const session = await requireSession(req, res)
  if (!session) return

  const slug = req.params.slug as string
  const memberId = req.params.memberId as string
  const { action, role } = req.body as { action?: "approve" | "reject" | "remove"; role?: string }

  if (!action || !["approve", "reject", "remove"].includes(action)) {
    res.status(400).json({ error: "Ação inválida" }); return
  }

  const organization = await prisma.organization.findUnique({ where: { slug } })
  if (!organization) { res.status(404).json({ error: "Organização não encontrada" }); return }

  const requester = await prisma.membership.findUnique({
    where: { authUserId_organizationId: { authUserId: session.user.id, organizationId: organization.id } },
  })
  if (!requester || requester.status !== "ACTIVE" || (requester.role !== "OWNER" && requester.role !== "ADMIN")) {
    res.status(403).json({ error: "Apenas OWNER ou ADMIN podem gerenciar membros" }); return
  }

  const target = await prisma.membership.findUnique({ where: { id: memberId } })
  if (!target || target.organizationId !== organization.id) { res.status(404).json({ error: "Membro não encontrado" }); return }
  if (target.authUserId === session.user.id) { res.status(400).json({ error: "Não é possível alterar seu próprio membership" }); return }

  if (action === "approve") {
    const validRoles = ["OWNER", "ADMIN", "DENTIST", "SECRETARY", "FINANCE"]
    const newRole = role && validRoles.includes(role) ? role : "DENTIST"
    await prisma.membership.update({ where: { id: memberId }, data: { status: "ACTIVE", role: newRole as any } })
    res.json({ message: "Membro aprovado" })
  } else {
    await prisma.membership.update({ where: { id: memberId }, data: { status: "REMOVED" } })
    res.json({ message: action === "reject" ? "Solicitação rejeitada" : "Membro removido" })
  }
})

app.get("/", (_req, res) => {
  res.json({ message: "Backend rodando 🚀" })
})

app.listen(3333, () => {
  console.log("Servidor rodando na porta 3333")
})
