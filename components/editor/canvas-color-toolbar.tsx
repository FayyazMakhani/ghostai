"use client"

import { useState } from "react"
import { NodeToolbar, Position, useReactFlow } from "@xyflow/react"
import type { OnNodesChange } from "@xyflow/react"
import { NODE_COLORS } from "@/types/canvas"
import type { CanvasNode } from "@/types/canvas"

interface Props {
  nodeId: string
  activeColor: string
  onNodesChange: OnNodesChange<CanvasNode>
}

export function CanvasColorToolbar({ nodeId, activeColor, onNodesChange }: Props) {
  const { getNode } = useReactFlow<CanvasNode>()
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <NodeToolbar isVisible position={Position.Top} offset={10}>
      <div
        className="flex items-center gap-1.5 rounded-xl border border-surface-border bg-elevated px-2 py-1.5 shadow-lg"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {NODE_COLORS.map((pair, idx) => {
          const isActive = pair.bg === activeColor
          const isHovered = hoveredIdx === idx
          return (
            <button
              key={pair.bg}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                const node = getNode(nodeId)
                if (!node) return
                onNodesChange([
                  {
                    type: "replace",
                    id: nodeId,
                    item: { ...node, data: { ...node.data, color: pair.bg } },
                  },
                ])
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                background: pair.bg,
                boxShadow:
                  isActive && isHovered
                    ? `0 0 0 2px ${pair.text}, 0 0 7px 1px ${pair.text}60`
                    : isActive
                      ? `0 0 0 2px ${pair.text}`
                      : isHovered
                        ? `0 0 7px 1px ${pair.text}60`
                        : undefined,
              }}
              className="h-5 w-5 flex-shrink-0 rounded-md outline-none transition-shadow duration-150"
            />
          )
        })}
      </div>
    </NodeToolbar>
  )
}
