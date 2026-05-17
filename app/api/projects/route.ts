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

  const body = await request.json().catch(() => ({}))
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : "Untitled Project"

  if (body.id !== undefined) {
    if (typeof body.id !== "string" || !/^[a-z0-9-]+$/.test(body.id) || body.id.length > 100)
      return Response.json({ error: "invalid id" }, { status: 400 })
  }
  const id: string | undefined = body.id

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
