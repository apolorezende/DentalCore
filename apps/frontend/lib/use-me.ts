"use client"

import { useEffect, useState } from "react"

export type MeData = {
  user: {
    id: string
    name: string
    email: string
    image: string | null
  }
  organization: {
    id: string
    name: string
    slug: string
    status: string
  } | null
  role: string | null
}

export function useMe() {
  const [data, setData] = useState<MeData | null>(null)
  const [isPending, setIsPending] = useState(true)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/me`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setData(json))
      .finally(() => setIsPending(false))
  }, [])

  return { data, isPending }
}
