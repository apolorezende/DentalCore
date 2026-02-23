import { prisma } from "./auth"

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

export async function uniqueSlug(base: string): Promise<string> {
  const slug = slugify(base)
  let suffix = 0

  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`
    const existing = await prisma.organization.findUnique({
      where: { slug: candidate },
    })
    if (!existing) return candidate
    suffix++
  }
}
