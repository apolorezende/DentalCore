"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { signOut } from "@/lib/auth-client"
import { useMe } from "@/lib/use-me"
import { useOrganizations } from "@/lib/use-organizations"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreateOrgDialog } from "@/components/org/create-org-dialog"
import {
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  Users,
} from "lucide-react"

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "" },
  { label: "Equipe", icon: Users, path: "/team" },
  { label: "Configurações", icon: Settings, path: "/settings" },
]

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

export function Sidebar() {
  const router = useRouter()
  const params = useParams()
  const currentSlug = params?.slug as string | undefined

  const { data: me, isPending: mePending } = useMe()
  const { data: orgs, isPending: orgsPending, refresh } = useOrganizations()
  const [createOpen, setCreateOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    router.push("/login")
  }

  function navigateTo(path: string) {
    if (!currentSlug) return
    router.push(`/dashboard/${currentSlug}${path}`)
  }

  return (
    <>
      <aside className="flex flex-col w-64 min-h-screen border-r bg-card px-3 py-4 gap-2">

        {/* Pill seletor de organização */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 w-full px-2 py-2.5 rounded-lg border bg-background hover:bg-accent transition-colors text-left">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/10 text-primary shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>

              {orgsPending ? (
                <Skeleton className="h-4 w-28 flex-1" />
              ) : (
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-semibold truncate leading-none">
                    {orgs.find((o) => o.slug === currentSlug)?.name ?? "Selecionar org"}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize mt-0.5">
                    {orgs.find((o) => o.slug === currentSlug)?.status?.toLowerCase()}
                  </span>
                </div>
              )}
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              Suas organizações
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {orgs.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => router.push(`/dashboard/${org.slug}`)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/10 text-primary shrink-0">
                  <Building2 className="w-3 h-3" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm truncate">{org.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">{org.role.toLowerCase()}</span>
                </div>
                {org.slug === currentSlug && (
                  <Check className="w-4 h-4 text-primary shrink-0" />
                )}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 cursor-pointer text-muted-foreground"
            >
              <Plus className="w-4 h-4" />
              Nova organização
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator />

        {/* Navegação */}
        <nav className="flex flex-col gap-1 flex-1 mt-1">
          {navItems.map((item) => {
            const href = `/dashboard/${currentSlug}${item.path}`
            return (
              <button
                key={item.path}
                onClick={() => navigateTo(item.path)}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors w-full text-left"
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <Separator />

        {/* Perfil do usuário */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent transition-colors w-full text-left mt-1">
              {mePending ? (
                <>
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </>
              ) : (
                <>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={me?.user.image ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {me?.user.name ? getInitials(me.user.name) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium truncate">{me?.user.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{me?.user.email}</span>
                  </div>
                  <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-sm">{me?.user.name}</span>
                <span className="text-xs text-muted-foreground">{me?.user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigateTo("/settings")}>
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </aside>

      <CreateOrgDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={refresh}
      />
    </>
  )
}
