"use client"

import { useEffect, useState } from "react"

export type OrgItem = {
  id: string
  name: string
  slug: string
  status: string
  role: string
}

export function useOrganizations() {
  const [data, setData] = useState<OrgItem[]>([])
  const [isPending, setIsPending] = useState(true)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/me/organizations`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((json) => setData(json))
      .finally(() => setIsPending(false))
  }, [])

  function refresh() {
    setIsPending(true)
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/me/organizations`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((json) => setData(json))
      .finally(() => setIsPending(false))
  }

  return { data, isPending, refresh }
}
