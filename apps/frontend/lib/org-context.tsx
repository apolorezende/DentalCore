"use client"

import { createContext, useContext } from "react"

export type OrgContextValue = {
  org: {
    id: string
    name: string
    slug: string
    status: string
  }
  role: string
}

export const OrgContext = createContext<OrgContextValue | null>(null)

export function useOrg(): OrgContextValue {
  const ctx = useContext(OrgContext)
  if (!ctx) throw new Error("useOrg must be used inside OrgContext.Provider")
  return ctx
}
