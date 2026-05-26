import { task, metadata } from "@trigger.dev/sdk"
import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import { z } from "zod"
import { put } from "@vercel/blob"
import { prisma } from "@/lib/prisma"

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

const payloadSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  chatHistory: z.array(chatMessageSchema).default([]),
  nodes: z.array(nodeSchema).default([]),
  edges: z.array(edgeSchema).default([]),
})

type Payload = z.infer<typeof payloadSchema>

function buildCanvasSummary(
  nodes: Payload["nodes"],
  edges: Payload["edges"]
): string {
  if (nodes.length === 0) return "The canvas is empty."

  const nodeLines = nodes.map((n) => {
    const shape = n.data.shape ?? "rectangle"
    return `- ${n.data.label} (id: ${n.id}, shape: ${shape})`
  })

  const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n.data.label]))
  const edgeLines = edges.map((e) => {
    const from = nodeById[e.source] ?? e.source
    const to = nodeById[e.target] ?? e.target
    const label = e.data?.label ? ` [${e.data.label}]` : ""
    return `- ${from} → ${to}${label}`
  })

  const parts = [`### Components\n${nodeLines.join("\n")}`]
  if (edgeLines.length > 0) parts.push(`### Connections\n${edgeLines.join("\n")}`)
  return parts.join("\n\n")
}

function buildChatSummary(chatHistory: Payload["chatHistory"]): string {
  if (chatHistory.length === 0) return ""
  return chatHistory
    .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
    .join("\n")
}

export const generateSpec = task({
  id: "generate-spec",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10_000,
    randomize: true,
  },
  run: async (rawPayload: unknown) => {
    const parsed = payloadSchema.safeParse(rawPayload)
    if (!parsed.success) {
      throw new Error(`Invalid payload: ${parsed.error.issues[0]?.message ?? "unknown"}`)
    }

    const { projectId, nodes, edges, chatHistory } = parsed.data

    metadata.set("status", "generating")
    metadata.set("projectId", projectId)

    const canvasSummary = buildCanvasSummary(nodes, edges)
    const chatSummary = buildChatSummary(chatHistory)

    const systemPrompt = `You are Ghost AI, a technical writer that converts system architecture diagrams into precise Markdown technical specifications.

Your output must be a complete, well-structured Markdown document. Use the following structure:

# [System Name] — Technical Specification

## Overview
Brief description of the system and its purpose.

## Architecture
High-level description of the architecture style and key design decisions.

## Components
For each component in the diagram:
### [Component Name]
- **Type**: (service / database / queue / gateway / etc.)
- **Responsibilities**: What it does
- **Interfaces**: How it communicates with other components (if edges are present)

## Data Flow
Step-by-step description of the main data flows through the system.

## Key Design Decisions
Notable architectural choices and trade-offs.

---
Only use information present in the canvas and chat context. Do not invent components or connections not shown in the diagram.
Produce clean Markdown — no code fences around the entire document, no raw HTML.`

    const userPrompt = `Generate a technical specification for this system design.

## Canvas Diagram
${canvasSummary}
${chatSummary ? `\n## Design Context (from chat)\n${chatSummary}` : ""}`

    const { text } = await generateText({
      model: google("gemini-2.5-flash-lite"),
      system: systemPrompt,
      prompt: userPrompt,
    })

    metadata.set("status", "saving")

    const blob = await put(`specs/${projectId}/${Date.now()}.md`, text, {
      access: "private",
      contentType: "text/markdown",
      allowOverwrite: false,
    })

    const record = await prisma.projectSpec.create({
      data: { projectId, filePath: blob.url },
    })

    metadata.set("status", "complete")

    return { spec: text, specId: record.id }
  },
})
