"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Copy, RefreshCw, Check, UserCheck, UserX, UserMinus, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useOrg } from "@/lib/org-context"

type Member = {
  membershipId: string
  authUserId: string
  name: string
  email: string
  role: string
  status: "ACTIVE" | "INVITED"
  createdAt: string
}

type InviteCode = {
  code: string
  expiresAt: string
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Proprietário",
  ADMIN: "Admin",
  DENTIST: "Dentista",
  SECRETARY: "Secretária",
  FINANCE: "Financeiro",
}

const ROLE_COLORS: Record<string, string> = {
  OWNER: "bg-violet-50 text-violet-700 border-violet-200",
  ADMIN: "bg-blue-50 text-blue-700 border-blue-200",
  DENTIST: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SECRETARY: "bg-amber-50 text-amber-700 border-amber-200",
  FINANCE: "bg-rose-50 text-rose-700 border-rose-200",
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${ROLE_COLORS[role] ?? "bg-zinc-100 text-zinc-600 border-zinc-200"}`}>
      {ROLE_LABELS[role] ?? role}
    </span>
  )
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState("")

  useEffect(() => {
    function calc() {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft("Expirado"); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setTimeLeft(`Expira em ${h}h ${m}min`)
    }
    calc()
    const id = setInterval(calc, 60000)
    return () => clearInterval(id)
  }, [expiresAt])

  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="w-3 h-3" />
      {timeLeft}
    </span>
  )
}

export default function TeamPage() {
  const { org, role } = useOrg()
  const router = useRouter()
  const isAdmin = role === "OWNER" || role === "ADMIN"

  const [inviteCode, setInviteCode] = useState<InviteCode | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const [members, setMembers] = useState<Member[]>([])
  const [membersLoading, setMembersLoading] = useState(true)

  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [approveRoles, setApproveRoles] = useState<Record<string, string>>({})

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL

  const fetchMembers = useCallback(async () => {
    setMembersLoading(true)
    const res = await fetch(`${baseUrl}/api/organizations/${org.slug}/members`, { credentials: "include" })
    if (res.ok) setMembers(await res.json())
    setMembersLoading(false)
  }, [baseUrl, org.slug])

  const fetchInviteCode = useCallback(async (force = false) => {
    setInviteLoading(true)
    const url = `${baseUrl}/api/organizations/${org.slug}/invite-code${force ? "?force=true" : ""}`
    const res = await fetch(url, { credentials: "include" })
    if (res.ok) setInviteCode(await res.json())
    setInviteLoading(false)
  }, [baseUrl, org.slug])

  useEffect(() => {
    fetchMembers()
    if (isAdmin) fetchInviteCode()
  }, [fetchMembers, fetchInviteCode, isAdmin])

  async function handleCopy() {
    if (!inviteCode) return
    await navigator.clipboard.writeText(inviteCode.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleMemberAction(memberId: string, action: "approve" | "reject" | "remove", selectedRole?: string) {
    setActionLoading(memberId + action)
    const res = await fetch(`${baseUrl}/api/organizations/${org.slug}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action, role: selectedRole }),
    })
    setActionLoading(null)
    if (res.ok) fetchMembers()
  }

  async function handleDeleteOrg() {
    setDeleteLoading(true)
    setDeleteError(null)
    const res = await fetch(`${baseUrl}/api/organizations/${org.slug}`, {
      method: "DELETE",
      credentials: "include",
    })
    setDeleteLoading(false)
    if (res.ok) {
      router.push("/organization-select")
    } else {
      const data = await res.json()
      setDeleteError(data.error ?? "Erro ao excluir organização")
    }
  }

  const pending = members.filter((m) => m.status === "INVITED")
  const active = members.filter((m) => m.status === "ACTIVE")

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Gerenciar equipe</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie os membros de <span className="font-medium text-foreground">{org.name}</span>
        </p>
      </div>

      {/* Invite code card — OWNER/ADMIN only */}
      {isAdmin && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-sm">Código de convite</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Compartilhe este código para que novos membros solicitem acesso.
            </p>
          </div>

          {inviteLoading && !inviteCode ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-48 rounded-lg" />
              <Skeleton className="h-9 w-20 rounded-md" />
            </div>
          ) : inviteCode ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-muted border border-border font-mono text-xl font-bold tracking-[0.3em] select-all">
                {inviteCode.code.slice(0, 4)}-{inviteCode.code.slice(4)}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copiado!" : "Copiar"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchInviteCode(true)}
                  disabled={inviteLoading}
                  className="gap-1.5 text-muted-foreground"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${inviteLoading ? "animate-spin" : ""}`} />
                  Regenerar
                </Button>
              </div>
              <CountdownTimer expiresAt={inviteCode.expiresAt} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Erro ao carregar código.</p>
          )}
        </div>
      )}

      {/* Pending requests — OWNER/ADMIN only */}
      {isAdmin && (
        <div className="space-y-3">
          <div>
            <h2 className="font-semibold text-sm">Solicitações pendentes</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Aprove ou rejeite membros que solicitaram entrada com o código.
            </p>
          </div>

          {membersLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                </div>
              ))}
            </div>
          ) : pending.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/50 px-5 py-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pending.map((m) => {
                const selectedRole = approveRoles[m.membershipId] ?? "DENTIST"
                return (
                  <div key={m.membershipId} className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-xs font-bold shrink-0">
                          {getInitials(m.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{m.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <select
                          value={selectedRole}
                          onChange={(e) => setApproveRoles((prev) => ({ ...prev, [m.membershipId]: e.target.value }))}
                          className="text-xs rounded-md border border-border bg-background px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="DENTIST">Dentista</option>
                          <option value="ADMIN">Admin</option>
                          <option value="SECRETARY">Secretária</option>
                          <option value="FINANCE">Financeiro</option>
                        </select>
                        <Button
                          size="sm"
                          onClick={() => handleMemberAction(m.membershipId, "approve", selectedRole)}
                          disabled={actionLoading === m.membershipId + "approve"}
                          className="gap-1.5 h-8"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMemberAction(m.membershipId, "reject")}
                          disabled={actionLoading === m.membershipId + "reject"}
                          className="gap-1.5 h-8 border-destructive/30 text-destructive hover:bg-destructive/5"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Active members */}
      <div className="space-y-3">
        <div>
          <h2 className="font-semibold text-sm">Membros ativos</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {active.length} {active.length === 1 ? "membro" : "membros"} na organização
          </p>
        </div>

        {membersLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : active.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 px-5 py-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhum membro ativo</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
            {active.map((m) => (
              <div key={m.membershipId} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                  {getInitials(m.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{m.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <RoleBadge role={m.role} />
                  {isAdmin && m.role !== "OWNER" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMemberAction(m.membershipId, "remove")}
                      disabled={actionLoading === m.membershipId + "remove"}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger zone — OWNER only */}
      {role === "OWNER" && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-sm text-destructive">Zona de perigo</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ações irreversíveis que afetam toda a organização.
            </p>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Excluir organização</p>
              <p className="text-xs text-muted-foreground">
                Remove permanentemente a organização e todos os seus membros.
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
              Excluir organização
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) { setDeleteConfirmText(""); setDeleteError(null) }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Excluir organização</DialogTitle>
            <DialogDescription asChild>
              <div>
                Esta ação é <strong>irreversível</strong>. Todos os membros perderão acesso imediatamente.
                <br /><br />
                Para confirmar, digite o nome da organização: <strong>{org.name}</strong>
              </div>
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder={org.name}
            autoComplete="off"
          />
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteOrg}
              disabled={deleteConfirmText !== org.name || deleteLoading}
            >
              {deleteLoading ? "Excluindo..." : "Excluir permanentemente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
