import { get } from "@vercel/blob"
import { prisma } from "@/lib/prisma"
import { getCurrentIdentity, canAccessProject } from "@/lib/project-access"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; specId: string }> }
) {
  const identity = await getCurrentIdentity()
  if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId, specId } = await params

  const hasAccess = await canAccessProject(projectId, identity.userId, identity.email)
  if (!hasAccess) return Response.json({ error: "Forbidden" }, { status: 403 })

  const spec = await prisma.projectSpec.findUnique({
    where: { id: specId },
    select: { projectId: true, filePath: true },
  })

  if (!spec) return Response.json({ error: "Not found" }, { status: 404 })
  if (spec.projectId !== projectId) return Response.json({ error: "Forbidden" }, { status: 403 })

  let result: Awaited<ReturnType<typeof get>>
  try {
    result = await get(spec.filePath, { access: "private" })
  } catch {
    return Response.json({ error: "Failed to fetch spec" }, { status: 502 })
  }
  if (!result || result.statusCode !== 200) {
    return Response.json({ error: "Failed to fetch spec" }, { status: 502 })
  }

  const content = await new Response(result.stream).text()
  return Response.json({ content })
}
