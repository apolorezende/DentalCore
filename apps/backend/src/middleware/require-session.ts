import { Request, Response } from "express"
import { auth } from "../lib/auth"

export async function requireSession(req: Request, res: Response) {
  const session = await auth.api.getSession({ headers: req.headers as any })
  if (!session) {
    res.status(401).json({ error: "Não autenticado" })
    return null
  }
  return session
}
