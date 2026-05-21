"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import type { CanvasNode } from "@/types/canvas"
import { NODE_COLORS } from "@/types/canvas"

export function CanvasNodeComponent({ data }: NodeProps<CanvasNode>) {
  const colorPair = NODE_COLORS.find((c) => c.bg === data.color) ?? NODE_COLORS[0]

  return (
    <div
      className="relative flex h-full w-full items-center justify-center rounded-xl border border-[#3a3a42] text-sm font-medium"
      style={{ background: colorPair.bg, color: colorPair.text }}
    >
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="!h-2 !w-2 !border !border-white/60 !bg-white/80"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!h-2 !w-2 !border !border-white/60 !bg-white/80"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!h-2 !w-2 !border !border-white/60 !bg-white/80"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="!h-2 !w-2 !border !border-white/60 !bg-white/80"
      />
      <span className="select-none px-3 text-center leading-snug">{data.label}</span>
    </div>
  )
}
