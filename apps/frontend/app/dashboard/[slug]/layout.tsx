"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { OrgContext, type OrgContextValue } from "@/lib/org-context"
import { Sidebar } from "@/components/layout/sidebar"
import { Skeleton } from "@/components/ui/skeleton"

export default function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const router = useRouter()
  const [orgData, setOrgData] = useState<OrgContextValue | null>(null)
  const [isPending, setIsPending] = useState(true)

  useEffect(() => {
    params.then(({ slug }) => {
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/organizations/${slug}`, {
        credentials: "include",
      }).then(async (r) => {
        if (r.status === 401) { router.replace("/login"); return }
        if (r.status === 403 || r.status === 404) { router.replace("/dashboard"); return }
        const json = await r.json()
        setOrgData({ org: json.organization, role: json.role })
        setIsPending(false)
      })
    })
  }, [params, router])

  if (isPending) {
    return (
      <div className="flex min-h-screen">
        <div className="w-64 border-r bg-card p-4 flex flex-col gap-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <main className="flex-1 p-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </main>
      </div>
    )
  }

  if (!orgData) return null

  return (
    <OrgContext.Provider value={orgData}>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </OrgContext.Provider>
  )
}
