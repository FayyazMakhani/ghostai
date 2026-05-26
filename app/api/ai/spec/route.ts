import { tasks, auth } from "@trigger.dev/sdk"
import { z } from "zod"
import { getCurrentIdentity, canAccessProject } from "@/lib/project-access"
import { prisma } from "@/lib/prisma"
import type { generateSpec } from "@/trigger/generate-spec"

const chatMessageSchema = z.object({
  sender: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.string(),
})

const nodeDataSchema = z.object({
  label: z.string(),
  color: z.string().optional(),
  shape: z.string().optional(),
})

const nodeSchema = z.object({
  id: z.string(),
  type: z.string().optional(),
  position: z.object({ x: z.number(), y: z.number() }),
  data: nodeDataSchema,
  width: z.number().optional(),
  height: z.number().optional(),
})

const edgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  data: z.object({ label: z.string().optional() }).optional(),
})

const bodySchema = z.object({
  roomId: z.string().min(1),
  chatHistory: z.array(chatMessageSchema).default([]),
  nodes: z.array(nodeSchema).default([]),
  edges: z.array(edgeSchema).default([]),
})

export async function POST(request: Request) {
  try {
    const identity = await getCurrentIdentity()
    if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 })

    let raw: unknown
    try {
      raw = await request.json()
    } catch {
      return Response.json({ error: "invalid JSON" }, { status: 400 })
    }

    const parsed = bodySchema.safeParse(raw)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message ?? "invalid input" }, { status: 400 })
    }

    const { roomId, chatHistory, nodes, edges } = parsed.data

    // Resolve projectId from roomId — never trust a client-supplied projectId.
    // In this app the project's database id is used as the Liveblocks room id.
    const project = await prisma.project.findUnique({
      where: { id: roomId },
      select: { id: true },
    })
    if (!project) return Response.json({ error: "Project not found" }, { status: 404 })

    const projectId = project.id

    const hasAccess = await canAccessProject(projectId, identity.userId, identity.email)
    if (!hasAccess) return Response.json({ error: "Forbidden" }, { status: 403 })

    const handle = await tasks.trigger<typeof generateSpec>("generate-spec", {
      projectId,
      roomId,
      chatHistory,
      nodes,
      edges,
    })

    try {
      await prisma.taskRun.create({
        data: { runId: handle.id, projectId, userId: identity.userId },
      })
    } catch (err) {
      console.error("[ai/spec] taskRun.create failed (non-fatal):", err)
    }

    let publicToken: string | null = null
    try {
      publicToken = await auth.createPublicToken({
        scopes: { read: { runs: [handle.id] } },
        expirationTime: "1h",
      })
    } catch (err) {
      console.error("[ai/spec] createPublicToken failed (non-fatal):", err)
    }

    return Response.json({ runId: handle.id, publicToken }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    console.error("[ai/spec] unhandled error:", err)
    return Response.json({ error: message }, { status: 500 })
  }
}
