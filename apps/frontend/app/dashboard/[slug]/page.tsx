"use client"

import { useOrg } from "@/lib/org-context"

export default function OrgDashboardPage() {
  const { org, role } = useOrg()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Olá! 👋</h1>
        <p className="text-muted-foreground mt-1">
          Painel da organização{" "}
          <span className="font-medium text-foreground">{org.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Plano</p>
          <p className="text-xl font-semibold mt-1 capitalize">
            {org.status.toLowerCase()}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Sua função</p>
          <p className="text-xl font-semibold mt-1 capitalize">
            {role.toLowerCase()}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Organização</p>
          <p className="text-xl font-semibold mt-1">{org.name}</p>
        </div>
      </div>
    </div>
  )
}
