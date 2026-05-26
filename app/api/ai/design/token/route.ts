import { auth } from "@trigger.dev/sdk"
import { getCurrentIdentity } from "@/lib/project-access"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
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
  if (typeof b.runId !== "string" || !b.runId.trim())
    return Response.json({ error: "runId is required" }, { status: 400 })

  const runId = b.runId.trim()

  const taskRun = await prisma.taskRun.findUnique({ where: { runId } })
  if (!taskRun) return Response.json({ error: "Not found" }, { status: 404 })
  if (taskRun.userId !== identity.userId)
    return Response.json({ error: "Forbidden" }, { status: 403 })

  const token = await auth.createPublicToken({
    scopes: { read: { runs: [runId] } },
  })

  return Response.json({ token })
}
