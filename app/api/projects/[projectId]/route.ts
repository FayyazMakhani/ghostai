import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId } = await params
  const project = await prisma.project.findUnique({ where: { id: projectId } })

  if (!project) return Response.json({ error: "Not found" }, { status: 404 })
  if (project.ownerId !== userId) return Response.json({ error: "Forbidden" }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : undefined

  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim()
      : undefined

  const allowedStatuses = ["DRAFT", "ARCHIVED"]
  const status =
    typeof body.status === "string" && allowedStatuses.includes(body.status)
      ? body.status
      : undefined

  const canvasJsonPath =
    typeof body.canvasJsonPath === "string" && body.canvasJsonPath.trim()
      ? body.canvasJsonPath.trim()
      : undefined

  if (!name) return Response.json({ error: "name is required" }, { status: 400 })

  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name
  if (description !== undefined) data.description = description
  if (status !== undefined) data.status = status
  if (canvasJsonPath !== undefined) data.canvasJsonPath = canvasJsonPath

  const updated = await prisma.project.update({
    where: { id: projectId },
    data,
  })

  return Response.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId } = await params
  const project = await prisma.project.findUnique({ where: { id: projectId } })

  if (!project) return Response.json({ error: "Not found" }, { status: 404 })
  if (project.ownerId !== userId) return Response.json({ error: "Forbidden" }, { status: 403 })

  await prisma.project.delete({ where: { id: projectId } })

  return new Response(null, { status: 204 })
}
