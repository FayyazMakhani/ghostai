import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId } = await params
  const body = await request.json().catch(() => ({}))

  const data: Record<string, unknown> = {}
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim()
  if (typeof body.description === "string" && body.description.trim()) data.description = body.description.trim()
  if (typeof body.status === "string" && ["DRAFT", "ARCHIVED"].includes(body.status)) data.status = body.status
  if (typeof body.canvasJsonPath === "string" && body.canvasJsonPath.trim()) data.canvasJsonPath = body.canvasJsonPath.trim()

  if (Object.keys(data).length === 0)
    return Response.json({ error: "no updatable fields provided" }, { status: 400 })

  const { count } = await prisma.project.updateMany({
    where: { id: projectId, ownerId: userId },
    data,
  })

  if (count === 0) {
    const exists = await prisma.project.findUnique({ where: { id: projectId } })
    return exists
      ? Response.json({ error: "Forbidden" }, { status: 403 })
      : Response.json({ error: "Not found" }, { status: 404 })
  }

  const updated = await prisma.project.findUnique({ where: { id: projectId } })
  return Response.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId } = await params

  const { count } = await prisma.project.deleteMany({
    where: { id: projectId, ownerId: userId },
  })

  if (count === 0) {
    const exists = await prisma.project.findUnique({ where: { id: projectId } })
    return exists
      ? Response.json({ error: "Forbidden" }, { status: 403 })
      : Response.json({ error: "Not found" }, { status: 404 })
  }

  return new Response(null, { status: 204 })
}
