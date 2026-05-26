import { prisma } from "@/lib/prisma"
import { getCurrentIdentity, canAccessProject } from "@/lib/project-access"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const identity = await getCurrentIdentity()
  if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId } = await params

  const hasAccess = await canAccessProject(projectId, identity.userId, identity.email)
  if (!hasAccess) return Response.json({ error: "Forbidden" }, { status: 403 })

  const specs = await prisma.projectSpec.findMany({
    where: { projectId },
    select: { id: true, filePath: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  })

  return Response.json({
    specs: specs.map((s) => ({
      id: s.id,
      createdAt: s.createdAt.toISOString(),
      filename: s.filePath.split("/").pop() ?? `spec-${s.id}.md`,
    })),
  })
}
