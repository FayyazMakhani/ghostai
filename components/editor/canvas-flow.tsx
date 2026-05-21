"use client"

import { useCallback } from "react"
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
import type { CanvasNode, CanvasEdge, ShapeDragPayload } from "@/types/canvas"
import { DEFAULT_NODE_COLOR } from "@/types/canvas"
import { CanvasNodeComponent } from "./canvas-node"
import { ShapePanel } from "./shape-panel"

const nodeTypes: NodeTypes = {
  canvasNode: CanvasNodeComponent,
}

let nodeCounter = 0

function CanvasFlowInner() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    })

  const { screenToFlowPosition } = useReactFlow()

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

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      const id = `${payload.shape}-${Date.now()}-${++nodeCounter}`

      const newNode: CanvasNode = {
        id,
        type: "canvasNode",
        position,
        data: { label: "", color: DEFAULT_NODE_COLOR.bg, shape: payload.shape },
        width: payload.width,
        height: payload.height,
      }

      onNodesChange([{ type: "add", item: newNode }])
    },
    [screenToFlowPosition, onNodesChange],
  )

  return (
    <div className="h-full w-full">
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
          <ShapePanel />
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
