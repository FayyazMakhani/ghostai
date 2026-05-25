import { get, put } from "@vercel/blob"
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

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { canvasJsonPath: true },
  })

  if (!project?.canvasJsonPath) {
    return Response.json({ error: "No saved canvas" }, { status: 404 })
  }

  let result: Awaited<ReturnType<typeof get>>
  try {
    result = await get(project.canvasJsonPath, { access: "private" })
  } catch {
    return Response.json({ error: "Failed to fetch canvas" }, { status: 502 })
  }
  if (!result || result.statusCode !== 200) {
    return Response.json({ error: "Failed to fetch canvas" }, { status: 502 })
  }

  const text = await new Response(result.stream).text()
  let canvas: unknown
  try {
    canvas = JSON.parse(text)
  } catch {
    return Response.json({ error: "Stored canvas is corrupted" }, { status: 500 })
  }
  return Response.json(canvas)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const identity = await getCurrentIdentity()
  if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId } = await params

  const hasAccess = await canAccessProject(projectId, identity.userId, identity.email)
  if (!hasAccess) return Response.json({ error: "Forbidden" }, { status: 403 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "Invalid body" }, { status: 400 })
  }

  let blob: Awaited<ReturnType<typeof put>>
  try {
    blob = await put(`canvas/${projectId}.json`, JSON.stringify(body), {
      access: "private",
      contentType: "application/json",
      allowOverwrite: true,
    })
  } catch {
    return Response.json({ error: "Failed to save canvas" }, { status: 502 })
  }

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { canvasJsonPath: blob.url },
    })
  } catch (err) {
    console.error("Failed to update canvasJsonPath for project", projectId, err)
    return Response.json({ error: "Failed to record canvas save" }, { status: 500 })
  }

  return Response.json({ url: blob.url })
}
