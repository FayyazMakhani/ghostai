import { auth } from "@clerk/nextjs/server"
import { Prisma } from "@/app/generated/prisma/client"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  })

  return Response.json(projects)
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 })
  }
  if (typeof body !== "object" || body === null || Array.isArray(body))
    return Response.json({ error: "body must be a JSON object" }, { status: 400 })

  const b = body as Record<string, unknown>
  const name =
    typeof b.name === "string" && b.name.trim() ? b.name.trim() : "Untitled Project"

  if (b.id !== undefined) {
    if (typeof b.id !== "string" || !/^[a-z0-9-]+$/.test(b.id) || b.id.length > 100)
      return Response.json({ error: "invalid id" }, { status: 400 })
  }
  const id = b.id as string | undefined

  try {
    const project = await prisma.project.create({
      data: { ...(id !== undefined && { id }), ownerId: userId, name },
    })
    return Response.json(project, { status: 201 })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")
      return Response.json({ error: "id already in use" }, { status: 409 })
    throw err
  }
}
