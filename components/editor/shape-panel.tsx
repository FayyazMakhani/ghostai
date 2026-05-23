"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
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
import { SHAPE_DEFAULTS, DEFAULT_NODE_COLOR } from "@/types/canvas"
import { ShapeRenderer } from "./canvas-shapes"

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

interface DragState {
  shape: NodeShape
  x: number
  y: number
}

interface ShapePanelProps {
  onAddShape: (shape: NodeShape) => void
}

export function ShapePanel({ onAddShape }: ShapePanelProps) {
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [mounted, setMounted] = useState(false)
  const dragImageRef = useRef<HTMLDivElement>(null)
  const isDragging = dragState !== null

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isDragging) return
    const onMouseMove = (e: MouseEvent) => {
      setDragState((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null))
    }
    document.addEventListener("mousemove", onMouseMove)
    return () => document.removeEventListener("mousemove", onMouseMove)
  }, [isDragging])

  const handleDragStart = useCallback((e: React.DragEvent, shape: NodeShape) => {
    const payload: ShapeDragPayload = { shape, ...SHAPE_DEFAULTS[shape] }
    e.dataTransfer.setData("application/json", JSON.stringify(payload))
    e.dataTransfer.effectAllowed = "copy"
    if (dragImageRef.current) {
      e.dataTransfer.setDragImage(dragImageRef.current, 0, 0)
    }
    setDragState({ shape, x: e.clientX, y: e.clientY })
  }, [])

  const handleDragEnd = useCallback(() => {
    setDragState(null)
  }, [])

  const preview = dragState

  return (
    <>
      <div
        ref={dragImageRef}
        className="pointer-events-none fixed -left-2499.75 -top-2499.75"
      />

      {mounted &&
        preview &&
        createPortal(
          <div
            className="pointer-events-none fixed z-50"
            style={{
              left: preview.x,
              top: preview.y,
              transform: "translate(-50%, -50%)",
              width: SHAPE_DEFAULTS[preview.shape].width,
              height: SHAPE_DEFAULTS[preview.shape].height,
              opacity: 0.8,
            }}
          >
            <ShapeRenderer
              shape={preview.shape}
              bg={DEFAULT_NODE_COLOR.bg}
              border="#3a3a42"
            />
          </div>,
          document.body,
        )}

      <div className="flex items-center gap-1 rounded-full border border-[#2a2a30] bg-[#111114] px-3 py-2 shadow-lg">
        {SHAPES.map(({ shape, Icon, label }) => (
          <button
            key={shape}
            draggable
            onDragStart={(e) => handleDragStart(e, shape)}
            onDragEnd={handleDragEnd}
            onClick={() => onAddShape(shape)}
            title={label}
            aria-label={label}
            className="flex h-8 w-8 cursor-grab items-center justify-center rounded-lg text-[#808090] transition-colors hover:bg-[#1e1e23] hover:text-[#f0f0f4] active:cursor-grabbing"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    </>
  )
}
