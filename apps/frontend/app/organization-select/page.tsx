"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, Users, Plus, LogOut, ChevronRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useOrganizations, type OrgItem } from "@/lib/use-organizations"
import { CreateOrgDialog } from "@/components/org/create-org-dialog"
import { JoinOrgDialog } from "@/components/org/join-org-dialog"
import { signOut } from "@/lib/auth-client"

const ORG_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-fuchsia-500",
  "bg-teal-500",
]

function getOrgColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return ORG_COLORS[Math.abs(hash) % ORG_COLORS.length]
}


function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; className: string }> = {
    OWNER: { label: "Proprietário", className: "bg-violet-50 text-violet-700 border-violet-200" },
    ADMIN: { label: "Admin", className: "bg-blue-50 text-blue-700 border-blue-200" },
    MEMBER: { label: "Membro", className: "bg-zinc-100 text-zinc-600 border-zinc-200" },
  }
  const config = map[role] ?? { label: role, className: "bg-zinc-100 text-zinc-600 border-zinc-200" }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${config.className}`}>
      {config.label}
    </span>
  )
}

function OrgCard({ org, onClick }: { org: OrgItem; onClick: () => void }) {
  const colorClass = getOrgColor(org.name)
  const initial = org.name.charAt(0).toUpperCase()

  return (
    <button
      onClick={onClick}
      className="group w-full text-left rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-zinc-400 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-11 h-11 rounded-xl ${colorClass} flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate leading-tight">{org.name}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <RoleBadge role={org.role} />
          </div>
        </div>
        <ChevronRight className="flex-shrink-0 w-4 h-4 text-muted-foreground mt-1 transition-transform duration-200 group-hover:translate-x-0.5" />
      </div>
    </button>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start gap-4">
            <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({
  onCreateOrg,
  onJoinOrg,
}: {
  onCreateOrg: () => void
  onJoinOrg: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/5 border border-primary/10 mb-2">
          <Sparkles className="w-6 h-6 text-primary/60" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Bem-vindo ao Dental Core</h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          Você ainda não faz parte de nenhuma organização. Crie a sua ou entre em uma existente.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        <button
          onClick={onCreateOrg}
          className="group relative flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center transition-all duration-200 hover:border-zinc-400 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform duration-200 group-hover:scale-105">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Criar organização</p>
            <p className="text-sm text-muted-foreground mt-1">
              Configure sua clínica do zero
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            Começar <ChevronRight className="w-3 h-3" />
          </div>
        </button>

        <button
          onClick={onJoinOrg}
          className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center transition-all duration-200 hover:border-zinc-400 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-secondary text-secondary-foreground border border-border shadow-sm transition-transform duration-200 group-hover:scale-105">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Entrar em organização</p>
            <p className="text-sm text-muted-foreground mt-1">
              Junte-se a uma clínica existente
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            Solicitar acesso <ChevronRight className="w-3 h-3" />
          </div>
        </button>
      </div>
    </div>
  )
}

export default function OrganizationSelectPage() {
  const router = useRouter()
  const { data: orgs, isPending, refresh } = useOrganizations()
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">D</span>
          </div>
          <span className="font-semibold text-sm tracking-tight">Dental Core</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair
        </Button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {isPending ? (
          <div className="w-full max-w-3xl space-y-6">
            <div className="space-y-1.5">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-80" />
            </div>
            <LoadingSkeleton />
          </div>
        ) : orgs.length === 0 ? (
          <EmptyState
            onCreateOrg={() => setCreateOpen(true)}
            onJoinOrg={() => setJoinOpen(true)}
          />
        ) : (
          <div className="w-full max-w-3xl space-y-6">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Selecione uma organização</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {orgs.length === 1
                  ? "Você faz parte de 1 organização."
                  : `Você faz parte de ${orgs.length} organizações.`}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {orgs.map((org) => (
                <OrgCard
                  key={org.id}
                  org={org}
                  onClick={() => router.push(`/dashboard/${org.slug}`)}
                />
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateOpen(true)}
                className="gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Nova organização
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setJoinOpen(true)}
                className="gap-1.5 text-muted-foreground"
              >
                <Users className="w-3.5 h-3.5" />
                Entrar em org existente
              </Button>
            </div>
          </div>
        )}
      </main>

      <CreateOrgDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={refresh}
      />
      <JoinOrgDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </div>
  )
}
