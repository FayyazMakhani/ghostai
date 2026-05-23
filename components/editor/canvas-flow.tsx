"use client"

import { useCallback, useRef } from "react"
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
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow"
import { useUndo, useRedo } from "@liveblocks/react"
import "@xyflow/react/dist/style.css"
import "@liveblocks/react-flow/styles.css"
import type { CanvasNode, CanvasEdge, ShapeDragPayload, NodeShape } from "@/types/canvas"
import { DEFAULT_NODE_COLOR, SHAPE_DEFAULTS } from "@/types/canvas"
import { CanvasNodeComponent } from "./canvas-node"
import { CanvasEdgeComponent } from "./canvas-edge"
import { ShapePanel } from "./shape-panel"
import { CanvasControlBar } from "./canvas-control-bar"
import { CanvasContext } from "./canvas-context"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { StarterTemplatesModal } from "./starter-templates-modal"
import type { CanvasTemplate } from "./starter-templates"

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

const MAX_NODE_DIM = 2000

interface CanvasFlowInnerProps {
  isTemplatesOpen: boolean
  onTemplatesOpenChange: (open: boolean) => void
}

function CanvasFlowInner({ isTemplatesOpen, onTemplatesOpenChange }: CanvasFlowInnerProps) {
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

  useKeyboardShortcuts({ instance: reactFlow, undo, redo })

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
      const position = screenToFlowPosition({ x: cx, y: cy })
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

      const width = Number.isFinite(payload.width) && payload.width > 0
        ? Math.min(payload.width, MAX_NODE_DIM)
        : 120
      const height = Number.isFinite(payload.height) && payload.height > 0
        ? Math.min(payload.height, MAX_NODE_DIM)
        : 80

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      const id = crypto.randomUUID()

      const newNode: CanvasNode = {
        id,
        type: "canvasNode",
        position,
        data: { label: "", color: DEFAULT_NODE_COLOR.bg, shape: payload.shape },
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
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <MiniMap
          style={{ background: "#111114" }}
          nodeColor="#3a3a42"
          nodeStrokeColor="#3a3a42"
          maskColor="rgba(8,8,9,0.6)"
        />
        <Cursors />
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
  isTemplatesOpen: boolean
  onTemplatesOpenChange: (open: boolean) => void
}

export function CanvasFlow({ isTemplatesOpen, onTemplatesOpenChange }: CanvasFlowProps) {
  return (
    <ReactFlowProvider>
      <CanvasFlowInner
        isTemplatesOpen={isTemplatesOpen}
        onTemplatesOpenChange={onTemplatesOpenChange}
      />
    </ReactFlowProvider>
  )
}
