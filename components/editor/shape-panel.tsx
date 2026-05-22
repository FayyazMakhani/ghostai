"use client"

import {
  RectangleHorizontal,
  Diamond,
  Circle,
  Pill,
  Cylinder,
  Hexagon,
  type LucideIcon,
} from "lucide-react"
import type { NodeShape, ShapeDragPayload } from "@/types/canvas"
import { SHAPE_DEFAULTS } from "@/types/canvas"

interface ShapeEntry {
  shape: NodeShape
  Icon: LucideIcon
  label: string
}

const SHAPES: ShapeEntry[] = [
  { shape: "rectangle", Icon: RectangleHorizontal, label: "Rectangle" },
  { shape: "diamond", Icon: Diamond, label: "Diamond" },
  { shape: "circle", Icon: Circle, label: "Circle" },
  { shape: "pill", Icon: Pill, label: "Pill" },
  { shape: "cylinder", Icon: Cylinder, label: "Cylinder" },
  { shape: "hexagon", Icon: Hexagon, label: "Hexagon" },
]

function handleDragStart(e: React.DragEvent, shape: NodeShape) {
  const payload: ShapeDragPayload = { shape, ...SHAPE_DEFAULTS[shape] }
  e.dataTransfer.setData("application/json", JSON.stringify(payload))
  e.dataTransfer.effectAllowed = "copy"
}

interface ShapePanelProps {
  onAddShape: (shape: NodeShape) => void
}

export function ShapePanel({ onAddShape }: ShapePanelProps) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-[#2a2a30] bg-[#111114] px-3 py-2 shadow-lg">
      {SHAPES.map(({ shape, Icon, label }) => (
        <button
          key={shape}
          draggable
          onDragStart={(e) => handleDragStart(e, shape)}
          onClick={() => onAddShape(shape)}
          title={label}
          aria-label={label}
          className="flex h-8 w-8 cursor-grab items-center justify-center rounded-lg text-[#808090] transition-colors hover:bg-[#1e1e23] hover:text-[#f0f0f4] active:cursor-grabbing"
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  )
}
