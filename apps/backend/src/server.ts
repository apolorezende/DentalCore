import "./lib/auth" // garante dotenv.config() antes de tudo
import express from "express"
import cors from "cors"
import { toNodeHandler } from "better-auth/node"
import { auth } from "./lib/auth"
import router from "./routes"

const app = express()

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  })
)

app.use(express.json())

// Rotas do Better-Auth (login, signup, sessão, etc.)
app.all("/api/auth/*splat", toNodeHandler(auth))

// Rotas da aplicação
app.use("/api", router)

app.get("/", (_req, res) => {
  res.json({ message: "Backend rodando 🚀" })
})

app.listen(3333, () => {
  console.log("Servidor rodando na porta 3333")
})
