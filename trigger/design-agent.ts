import { task } from "@trigger.dev/sdk"
import { google } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"
import { LiveObject, LiveMap } from "@liveblocks/client"
import { getLiveblocks } from "@/lib/liveblocks"
import { DEFAULT_NODE_COLOR, NODE_COLORS, NODE_SHAPES, SHAPE_DEFAULTS } from "@/types/canvas"
import type { NodeShape } from "@/types/canvas"

const AI_AGENT_ID = "ghost-ai"
const AI_AGENT_COLOR = "#6457f9"

const SHAPE_USE_CASES = [
  "rectangle — general-purpose node, service, component",
  "diamond — decision, gateway, condition, branching logic",
  "circle — event, trigger, endpoint, start/end point",
  "pill — API, process, microservice, handler",
  "cylinder — database, cache, storage, queue",
  "hexagon — external system, third-party service, boundary",
].join("\n")

const COLOR_GUIDE = NODE_COLORS.map((c) => `"${c.name}"`).join(", ")

const actionSchema = z.object({
  reasoning: z.string().describe("One sentence explaining the design decision"),
  actions: z.array(
    z.object({
      type: z.enum([
        "add_node",
        "move_node",
        "resize_node",
        "update_node",
        "delete_node",
        "add_edge",
        "delete_edge",
      ]),
      id: z.string().describe("Unique node or edge ID, e.g. node-1, edge-1"),
      label: z.string().optional().describe("Node display label (2–4 words)"),
      shape: z
        .enum(["rectangle", "diamond", "circle", "pill", "cylinder", "hexagon"])
        .optional(),
      colorName: z
        .string()
        .optional()
        .describe(`Color name from: ${COLOR_GUIDE}`),
      x: z.number().optional().describe("Canvas X position"),
      y: z.number().optional().describe("Canvas Y position"),
      width: z.number().optional(),
      height: z.number().optional(),
      source: z.string().optional().describe("Source node ID (edges only)"),
      target: z.string().optional().describe("Target node ID (edges only)"),
      edgeLabel: z.string().optional().describe("Short edge label (optional)"),
    })
  ),
})

type DesignOutput = z.infer<typeof actionSchema>

async function setAIPresence(
  lb: ReturnType<typeof getLiveblocks>,
  roomId: string,
  thinking: boolean,
  ttl = 30
) {
  await lb.setPresence(roomId, {
    userId: AI_AGENT_ID,
    data: { cursor: null, thinking },
    userInfo: { name: "Ghost AI", avatar: "", color: AI_AGENT_COLOR },
    ttl,
  })
}

async function broadcastStatus(
  lb: ReturnType<typeof getLiveblocks>,
  roomId: string,
  message: string
) {
  await lb.broadcastEvent(roomId, { type: "ai-status", message })
}

function resolveColor(colorName: string | undefined) {
  if (!colorName) return DEFAULT_NODE_COLOR
  return NODE_COLORS.find((c) => c.name === colorName) ?? DEFAULT_NODE_COLOR
}

function resolveShape(shape: string | undefined): NodeShape {
  if (shape && NODE_SHAPES.includes(shape as NodeShape)) return shape as NodeShape
  return "rectangle"
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyActions(root: any, actions: DesignOutput["actions"]) {
  // Cast to a usable shape — the runtime structure is guaranteed by canvas-wrapper initialStorage
  let flow = (root as any).get("flow") as
    | LiveObject<{
        nodes: LiveMap<string, LiveObject<{
          id: string; type: string; position: { x: number; y: number };
          data: LiveObject<{ label: string; color?: string; shape?: string }>;
          width?: number; height?: number
        }>>
        edges: LiveMap<string, LiveObject<{
          id: string; type: string; source: string; target: string;
          data: LiveObject<{ label?: string }>
        }>>
      }>
    | undefined

  if (!flow) {
    // Storage not yet initialized — create it and continue applying actions
    const newFlow = new LiveObject({ nodes: new LiveMap(), edges: new LiveMap() })
    ;(root as any).set("flow", newFlow)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    flow = newFlow as any
  }

  const nodesMap = flow!.get("nodes")
  const edgesMap = flow!.get("edges")

  if (!nodesMap || !edgesMap) return

  for (const action of actions) {
    switch (action.type) {
      case "add_node": {
        const shape = resolveShape(action.shape)
        const defaults = SHAPE_DEFAULTS[shape]
        const color = resolveColor(action.colorName)
        nodesMap.set(
          action.id,
          new LiveObject({
            id: action.id,
            type: "canvasNode",
            position: { x: action.x ?? 0, y: action.y ?? 0 },
            data: new LiveObject({
              label: action.label ?? "",
              color: color.bg,
              shape,
            }),
            width: action.width ?? defaults.width,
            height: action.height ?? defaults.height,
          }) as any
        )
        break
      }

      case "move_node": {
        const node = nodesMap.get(action.id)
        if (node) {
          const current = node.get("position")
          const x = action.x ?? current?.x ?? 0
          const y = action.y ?? current?.y ?? 0
          node.update({ position: { x, y } })
        }
        break
      }

      case "resize_node": {
        const node = nodesMap.get(action.id)
        if (node) {
          const updates: Record<string, unknown> = {}
          if (action.width != null) updates.width = action.width
          if (action.height != null) updates.height = action.height
          node.update(updates as any)
        }
        break
      }

      case "update_node": {
        const node = nodesMap.get(action.id)
        if (node) {
          const data = node.get("data")
          if (data) {
            const updates: Record<string, unknown> = {}
            if (action.label != null) updates.label = action.label
            if (action.colorName) updates.color = resolveColor(action.colorName).bg
            if (action.shape) updates.shape = resolveShape(action.shape)
            data.update(updates as any)
          }
        }
        break
      }

      case "delete_node": {
        nodesMap.delete(action.id)
        break
      }

      case "add_edge": {
        if (!action.source || !action.target) break
        edgesMap.set(
          action.id,
          new LiveObject({
            id: action.id,
            type: "canvasEdge",
            source: action.source,
            target: action.target,
            data: new LiveObject({ label: action.edgeLabel ?? "" }),
          }) as any
        )
        break
      }

      case "delete_edge": {
        edgesMap.delete(action.id)
        break
      }
    }
  }
}

export const designAgent = task({
  id: "design-agent",
  maxDuration: 120,
  run: async (payload: { prompt: string; roomId: string }) => {
    const { prompt, roomId } = payload
    const lb = getLiveblocks()

    try {
      await setAIPresence(lb, roomId, true)
      await broadcastStatus(lb, roomId, "Analyzing your prompt…")

      // Read current canvas state to give the AI context
      let existingNodes = ""
      let existingEdges = ""
      try {
        const doc = await lb.getStorageDocument(roomId, "json")
        if (doc && typeof doc === "object" && "flow" in doc) {
          const flow = doc.flow as {
            nodes?: Record<string, { id?: string; data?: { label?: string; shape?: string } }>
            edges?: Record<string, { id?: string; source?: string; target?: string }>
          }
          const nodes = Object.values(flow?.nodes ?? {}).slice(0, 30)
          const edges = Object.values(flow?.edges ?? {}).slice(0, 30)
          if (nodes.length > 0) {
            existingNodes = nodes
              .map((n) => `id="${n.id}" label="${n.data?.label}" shape="${n.data?.shape}"`)
              .join("\n")
          }
          if (edges.length > 0) {
            existingEdges = edges
              .map((e) => `id="${e.id}" source="${e.source}" target="${e.target}"`)
              .join("\n")
          }
        }
      } catch {
        // Fresh room — no existing content
      }

      await broadcastStatus(lb, roomId, "Generating design…")

      const { object } = await generateObject({
        model: google("gemini-2.5-flash-lite"),
        schema: actionSchema,
        system: `You are Ghost AI, an expert system architecture designer producing visual canvas designs.

## Node Shapes
${SHAPE_USE_CASES}

## Color Palette
Available colors: ${COLOR_GUIDE}
Guidelines:
- Blue: APIs, HTTP services, gateways
- Purple: auth, identity, security
- Green: data processing, analytics, workers
- Teal: messaging, queues, event buses, databases
- Orange: caching, notifications, warnings
- Charcoal: generic nodes, utilities, default
- Cylinder shape: always prefer Teal or Blue color
- Hexagon shape: use for external/third-party systems

## Layout Rules
- Minimum spacing: 250px horizontal, 180px vertical between node centers
- Start at top-left: first node at x=50, y=50
- Flow left-to-right or top-to-bottom
- Group related services in rows/columns
- Grid columns: x = 50, 350, 650, 950
- Grid rows: y = 50, 250, 450, 650

## Action Types
- add_node: id, label, shape, colorName, x, y (width/height optional)
- move_node: id, x, y
- resize_node: id, width, height
- update_node: id + any of label/shape/colorName
- delete_node: id
- add_edge: id, source, target (edgeLabel optional)
- delete_edge: id

## Current Canvas
${existingNodes ? `Existing nodes:\n${existingNodes}` : "Canvas is empty — create a fresh design."}
${existingEdges ? `\nExisting edges:\n${existingEdges}` : ""}

Generate unique IDs like "node-1", "node-2", "edge-1". For modifications, reference exact existing IDs.
Keep labels concise (2–4 words). Produce a complete, well-organized architecture.`,
        prompt: `User request: ${prompt}`,
      })

      await broadcastStatus(lb, roomId, "Applying changes to canvas…")

      // Maintain presence TTL while mutating (mutateStorage can take a few seconds)
      await setAIPresence(lb, roomId, true)

      await lb.mutateStorage(roomId, ({ root }) => {
        applyActions(root as any, object.actions)
      })

      await broadcastStatus(lb, roomId, "Design complete!")
      await setAIPresence(lb, roomId, false, 4)

      return { success: true, actionsApplied: object.actions.length }
    } catch (error) {
      console.error("[design-agent] unhandled error:", error)
      try {
        await broadcastStatus(lb, roomId, "AI failed to respond, please try again")
        await setAIPresence(lb, roomId, false, 4)
      } catch {
        // Ignore cleanup errors
      }
      throw error
    }
  },
})
