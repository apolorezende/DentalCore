import dotenv from "dotenv"
dotenv.config()

import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
export const prisma = new PrismaClient({ adapter })


export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3333",

  trustedOrigins: [
    process.env.FRONTEND_URL ?? "http://localhost:3000",
  ],

  emailAndPassword: {
    enabled: true,
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await prisma.subscription.upsert({
            where: { authUserId: user.id },
            create: { authUserId: user.id, planName: "trial", status: "TRIAL" },
            update: {},
          })
        },
      },
    },
  },
})

export type Auth = typeof auth
