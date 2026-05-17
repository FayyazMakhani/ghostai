import { prisma } from "@/lib/prisma"
import { getCurrentIdentity } from "@/lib/project-access"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; email: string }> }
) {
  const identity = await getCurrentIdentity()
  if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId, email: rawEmail } = await params
  const email = decodeURIComponent(rawEmail)

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  })

  if (!project) return Response.json({ error: "Not found" }, { status: 404 })
  if (project.ownerId !== identity.userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { count } = await prisma.projectCollaborator.deleteMany({
    where: { projectId, email },
  })

  if (count === 0) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  return new Response(null, { status: 204 })
}
