import { tasks, auth } from "@trigger.dev/sdk"
import { getCurrentIdentity, canAccessProject } from "@/lib/project-access"
import { prisma } from "@/lib/prisma"
import type { designAgent } from "@/trigger/design-agent"

export async function POST(request: Request) {
  try {
    const identity = await getCurrentIdentity()
    if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 })

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return Response.json({ error: "invalid JSON" }, { status: 400 })
    }
    if (typeof body !== "object" || body === null || Array.isArray(body))
      return Response.json({ error: "body must be a JSON object" }, { status: 400 })

    const b = body as Record<string, unknown>
    if (typeof b.prompt !== "string" || !b.prompt.trim())
      return Response.json({ error: "prompt is required" }, { status: 400 })
    if (typeof b.roomId !== "string" || !b.roomId.trim())
      return Response.json({ error: "roomId is required" }, { status: 400 })
    if (typeof b.projectId !== "string" || !b.projectId.trim())
      return Response.json({ error: "projectId is required" }, { status: 400 })

    const prompt = b.prompt.trim()
    const roomId = b.roomId.trim()
    const projectId = b.projectId.trim()

    const hasAccess = await canAccessProject(projectId, identity.userId, identity.email)
    if (!hasAccess) return Response.json({ error: "Forbidden" }, { status: 403 })

    const handle = await tasks.trigger<typeof designAgent>("design-agent", { prompt, roomId })

    try {
      await prisma.taskRun.create({
        data: { runId: handle.id, projectId, userId: identity.userId },
      })
    } catch (err) {
      console.error("[ai/design] taskRun.create failed (non-fatal):", err)
    }

    let publicToken: string | null = null
    try {
      publicToken = await auth.createPublicToken({
        scopes: { read: { runs: [handle.id] } },
      })
    } catch (err) {
      console.error("[ai/design] createPublicToken failed (non-fatal):", err)
    }

    return Response.json({ runId: handle.id, publicToken }, { status: 201 })
  } catch (err) {
    console.error("[ai/design] unhandled error:", err)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
