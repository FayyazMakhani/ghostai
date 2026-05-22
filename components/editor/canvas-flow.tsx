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
} from "@xyflow/react"
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow"
import "@xyflow/react/dist/style.css"
import "@liveblocks/react-flow/styles.css"
import type { CanvasNode, CanvasEdge, ShapeDragPayload, NodeShape } from "@/types/canvas"
import { DEFAULT_NODE_COLOR, SHAPE_DEFAULTS } from "@/types/canvas"
import { CanvasNodeComponent } from "./canvas-node"
import { ShapePanel } from "./shape-panel"

const nodeTypes: NodeTypes = {
  canvasNode: CanvasNodeComponent,
}

const MAX_NODE_DIM = 2000

function CanvasFlowInner() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    })

  const { screenToFlowPosition } = useReactFlow()

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
    <div ref={containerRef} className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        nodeTypes={nodeTypes}
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
        <Panel position="bottom-center" style={{ marginBottom: "1.5rem" }}>
          <ShapePanel onAddShape={addShapeAtCenter} />
        </Panel>
      </ReactFlow>
    </div>
  )
}

export function CanvasFlow() {
  return (
    <ReactFlowProvider>
      <CanvasFlowInner />
    </ReactFlowProvider>
  )
}
