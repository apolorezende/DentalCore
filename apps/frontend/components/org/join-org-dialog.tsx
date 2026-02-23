"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function JoinOrgDialog({ open, onOpenChange }: Props) {
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/organizations/join-by-code`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      }
    )

    setLoading(false)

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError(json.error ?? "Erro ao processar solicitação")
      return
    }

    const json = await res.json()
    setSuccessMsg(json.message ?? "Solicitação enviada!")
  }

  function handleClose(value: boolean) {
    if (!value) {
      setCode("")
      setError(null)
      setSuccessMsg(null)
    }
    onOpenChange(value)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Entrar em organização</DialogTitle>
          <DialogDescription>
            Digite o código de convite fornecido pelo responsável da organização.
          </DialogDescription>
        </DialogHeader>

        {successMsg ? (
          <div className="py-4 text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-xl font-bold">
              ✓
            </div>
            <div>
              <p className="font-medium text-foreground">Solicitação enviada!</p>
              <p className="text-sm text-muted-foreground mt-1">{successMsg}</p>
            </div>
            <Button variant="outline" onClick={() => handleClose(false)}>
              Fechar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="invite-code">Código de convite</Label>
              <Input
                id="invite-code"
                placeholder="XXXXXXXX"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
                }
                maxLength={8}
                required
                disabled={loading}
                autoFocus
                className="font-mono tracking-widest text-center text-lg"
              />
              <p className="text-xs text-muted-foreground">
                Peça o código de 8 caracteres ao responsável da clínica.
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || code.length < 6}>
                {loading ? "Verificando..." : "Solicitar acesso"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
