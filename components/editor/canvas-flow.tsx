"use client"

import { useCallback, useEffect, useRef } from "react"
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
  ConnectionMode,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react"
import { useLiveblocksFlow, Cursors, type CursorsCursorProps } from "@liveblocks/react-flow"
import { useUndo, useRedo, useUpdateMyPresence, useOther, useEventListener, useMutation } from "@liveblocks/react"
import "@xyflow/react/dist/style.css"
import "@liveblocks/react-ui/styles.css"
import "@liveblocks/react-flow/styles.css"
import type { CanvasNode, CanvasEdge, ShapeDragPayload, NodeShape } from "@/types/canvas"
import { DEFAULT_NODE_COLOR, SHAPE_DEFAULTS, NODE_SHAPES } from "@/types/canvas"
import { CanvasNodeComponent } from "./canvas-node"
import { CanvasEdgeComponent } from "./canvas-edge"
import { ShapePanel } from "./shape-panel"
import { CanvasControlBar } from "./canvas-control-bar"
import { CanvasContext } from "./canvas-context"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { StarterTemplatesModal } from "./starter-templates-modal"
import { PresenceAvatars } from "./presence-avatars"
import type { CanvasTemplate } from "./starter-templates"
import { useCanvasAutosave, type SaveStatus } from "@/hooks/use-canvas-autosave"

const nodeTypes: NodeTypes = {
  canvasNode: CanvasNodeComponent,
}

const edgeTypes: EdgeTypes = {
  default: CanvasEdgeComponent,
  canvasEdge: CanvasEdgeComponent,
}

const DEFAULT_EDGE_OPTIONS = {
  type: "canvasEdge",
} as const

const GRID_SIZE = 16
const SNAP_GRID: [number, number] = [GRID_SIZE, GRID_SIZE]

function snapPosition(pos: { x: number; y: number }) {
  return {
    x: Math.round(pos.x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(pos.y / GRID_SIZE) * GRID_SIZE,
  }
}

const MAX_NODE_DIM = 2000

function cursorLabelColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? "#000000" : "#ffffff"
}

// Compact cursor — reads name/color directly from UserMeta.info, bypassing resolveUsers.
function CustomCursor({ connectionId }: CursorsCursorProps) {
  const info = useOther(connectionId, (o) => o.info)
  const thinking = useOther(connectionId, (o) => o.presence.thinking)
  if (!info) return null
  const labelColor = cursorLabelColor(info.color)
  return (
    <div style={{ position: "relative", width: 0, height: 0, pointerEvents: "none" }}>
      <svg
        width="14"
        height="18"
        viewBox="0 0 14 18"
        style={{ position: "absolute", top: 0, left: 0, display: "block" }}
        fill="none"
      >
        <path
          d="M1 1L1 14L4.5 10.5L7 16.5L9.5 15.5L7 9.5H12L1 1Z"
          fill={info.color}
          stroke="rgba(0,0,0,0.35)"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 8,
          background: info.color,
          color: labelColor,
          fontSize: 11,
          fontWeight: 600,
          lineHeight: 1,
          padding: "3px 7px",
          borderRadius: 9999,
          whiteSpace: "nowrap",
          userSelect: "none",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {thinking && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            style={{ animation: "spin 1s linear infinite", flexShrink: 0 }}
          >
            <circle cx="5" cy="5" r="4" fill="none" stroke={labelColor} strokeWidth="1.5" strokeDasharray="16" strokeDashoffset="6" strokeLinecap="round" />
          </svg>
        )}
        {info.name}
      </div>
    </div>
  )
}

const CURSOR_COMPONENTS = { Cursor: CustomCursor }

interface CanvasFlowInnerProps {
  projectId: string
  isTemplatesOpen: boolean
  onTemplatesOpenChange: (open: boolean) => void
  onSaveStatusChange: (status: SaveStatus) => void
  onRegisterSaveNow: (fn: () => void) => void
}

function CanvasFlowInner({ projectId, isTemplatesOpen, onTemplatesOpenChange, onSaveStatusChange, onRegisterSaveNow }: CanvasFlowInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    })

  const reactFlow = useReactFlow()
  const { screenToFlowPosition } = reactFlow

  const undo = useUndo()
  const redo = useRedo()
  const updateMyPresence = useUpdateMyPresence()

  useKeyboardShortcuts({ instance: reactFlow, undo, redo })

  const writeFeedMessage = useMutation(({ storage }, message: string) => {
    storage.get("ai-status-feed").push({ text: message })
  }, [])

  useEventListener(({ event }) => {
    if (event.type === "ai-status") writeFeedMessage(event.message)
  })

  const { saveStatus, saveNow } = useCanvasAutosave({ projectId, nodes, edges })
  useEffect(() => { onSaveStatusChange(saveStatus) }, [saveStatus, onSaveStatusChange])
  const onRegisterSaveNowRef = useRef(onRegisterSaveNow)
  onRegisterSaveNowRef.current = onRegisterSaveNow
  useEffect(() => { onRegisterSaveNowRef.current(saveNow) }, [saveNow])

  // Load saved canvas from blob on mount if the Liveblocks room is empty.
  const loadAttempted = useRef(false)
  useEffect(() => {
    if (loadAttempted.current) return
    loadAttempted.current = true
    if (nodes.length > 0 || edges.length > 0) return

    fetch(`/api/projects/${projectId}/canvas`)
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json() as { nodes: CanvasNode[]; edges: CanvasEdge[] }
        if (!Array.isArray(data?.nodes) || !Array.isArray(data?.edges)) return
        if (data.nodes.length > 0) {
          onNodesChange(data.nodes.map((node) => ({ type: "add" as const, item: node })))
        }
        if (data.edges.length > 0) {
          onEdgesChange(data.edges.map((edge) => ({ type: "add" as const, item: edge })))
        }
        setTimeout(() => reactFlow.fitView({ duration: 300 }), 50)
      })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      updateMyPresence({ cursor: position })
    },
    [updateMyPresence, screenToFlowPosition],
  )

  const handleMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null })
  }, [updateMyPresence])

  const handleImportTemplate = useCallback(
    (template: CanvasTemplate) => {
      if (edges.length > 0) {
        onEdgesChange(edges.map((edge) => ({ type: "remove" as const, id: edge.id })))
      }
      if (nodes.length > 0) {
        onNodesChange(nodes.map((node) => ({ type: "remove" as const, id: node.id })))
      }
      onNodesChange(template.nodes.map((node) => ({ type: "add" as const, item: node })))
      onEdgesChange(template.edges.map((edge) => ({ type: "add" as const, item: edge })))
      setTimeout(() => reactFlow.fitView({ duration: 300 }), 50)
    },
    [nodes, edges, onNodesChange, onEdgesChange, reactFlow],
  )

  const addShapeAtCenter = useCallback(
    (shape: NodeShape) => {
      const defaults = SHAPE_DEFAULTS[shape]
      const rect = containerRef.current?.getBoundingClientRect()
      const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
      const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2
      const position = snapPosition(screenToFlowPosition({ x: cx, y: cy }))
      const newNode: CanvasNode = {
        id: crypto.randomUUID(),
        type: "canvasNode",
        position,
        data: { label: "", color: DEFAULT_NODE_COLOR.bg, shape },
        width: defaults.width,
        height: defaults.height,
      }
      onNodesChange([{ type: "add", item: newNode }])
    },
    [screenToFlowPosition, onNodesChange],
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const raw = e.dataTransfer.getData("application/json")
      if (!raw) return

      let payload: ShapeDragPayload
      try {
        payload = JSON.parse(raw) as ShapeDragPayload
      } catch {
        return
      }

      const shape = NODE_SHAPES.includes(payload.shape as NodeShape)
        ? (payload.shape as NodeShape)
        : "rectangle"

      const width = Number.isFinite(payload.width) && payload.width > 0
        ? Math.min(payload.width, MAX_NODE_DIM)
        : 120
      const height = Number.isFinite(payload.height) && payload.height > 0
        ? Math.min(payload.height, MAX_NODE_DIM)
        : 80

      const position = snapPosition(screenToFlowPosition({ x: e.clientX, y: e.clientY }))
      const id = crypto.randomUUID()

      const newNode: CanvasNode = {
        id,
        type: "canvasNode",
        position,
        data: { label: "", color: DEFAULT_NODE_COLOR.bg, shape },
        width,
        height,
      }

      onNodesChange([{ type: "add", item: newNode }])
    },
    [screenToFlowPosition, onNodesChange],
  )

  return (
    <CanvasContext.Provider value={{ onNodesChange, onEdgesChange }}>
    <StarterTemplatesModal
      open={isTemplatesOpen}
      onOpenChange={onTemplatesOpenChange}
      onImport={handleImportTemplate}
    />
    <div
      ref={containerRef}
      className="h-full w-full"
      // Remove React Flow's default 1 px wrapper border on all nodes. Our custom
      // node components render their own shape-aware border via inline styles.
      style={{ "--xy-node-border": "none" } as React.CSSProperties}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
        connectionMode={ConnectionMode.Loose}
        snapToGrid
        snapGrid={SNAP_GRID}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <MiniMap
          style={{ background: "#111114" }}
          nodeColor="#3a3a42"
          nodeStrokeColor="#3a3a42"
          maskColor="rgba(8,8,9,0.6)"
        />
        <Cursors components={CURSOR_COMPONENTS} />
        <Panel position="top-right" style={{ marginTop: "0.75rem", marginRight: "0.75rem" }}>
          <PresenceAvatars />
        </Panel>
        <Panel position="bottom-left" style={{ marginBottom: "1.5rem", marginLeft: "1rem" }}>
          <CanvasControlBar />
        </Panel>
        <Panel position="bottom-center" style={{ marginBottom: "1.5rem" }}>
          <ShapePanel onAddShape={addShapeAtCenter} />
        </Panel>
      </ReactFlow>
    </div>
    </CanvasContext.Provider>
  )
}

interface CanvasFlowProps {
  projectId: string
  isTemplatesOpen: boolean
  onTemplatesOpenChange: (open: boolean) => void
  onSaveStatusChange: (status: SaveStatus) => void
  onRegisterSaveNow: (fn: () => void) => void
}

export function CanvasFlow({ projectId, isTemplatesOpen, onTemplatesOpenChange, onSaveStatusChange, onRegisterSaveNow }: CanvasFlowProps) {
  return (
    <ReactFlowProvider>
      <CanvasFlowInner
        projectId={projectId}
        isTemplatesOpen={isTemplatesOpen}
        onTemplatesOpenChange={onTemplatesOpenChange}
        onSaveStatusChange={onSaveStatusChange}
        onRegisterSaveNow={onRegisterSaveNow}
      />
    </ReactFlowProvider>
  )
}
