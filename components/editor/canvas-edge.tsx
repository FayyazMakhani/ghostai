"use client"

import { useState, useRef, useCallback } from "react"
import {
  getSmoothStepPath,
  EdgeLabelRenderer,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react"
import type { CanvasNode, CanvasEdge } from "@/types/canvas"
import { useCanvasContext } from "./canvas-context"

const STROKE_REST = "rgba(248,250,252,0.4)"
const STROKE_ACTIVE = "rgba(248,250,252,0.88)"

export function CanvasEdgeComponent({
  id,
  data,
  selected,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: EdgeProps<CanvasEdge>) {
  const { onEdgesChange } = useCanvasContext()
  const { getEdge } = useReactFlow<CanvasNode, CanvasEdge>()

  const [hovered, setHovered] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState("")
  const cancelRef = useRef(false)
  const editingRef = useRef(false)

  const isActive = selected || hovered
  const strokeColor = isActive ? STROKE_ACTIVE : STROKE_REST
  const markerId = `arrow-${id}`

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  })

  const label = data?.label ?? ""

  const startEditing = useCallback(() => {
    setEditValue(label)
    editingRef.current = true
    setEditing(true)
  }, [label])

  const commitEdit = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current = false
      editingRef.current = false
      setEditing(false)
      return
    }
    if (!editingRef.current) return
    editingRef.current = false
    setEditing(false)
    const edge = getEdge(id)
    if (!edge) return
    onEdgesChange([
      {
        type: "replace",
        id: edge.id,
        item: { ...edge, data: { ...edge.data, label: editValue } },
      },
    ])
  }, [editValue, id, getEdge, onEdgesChange])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation()
      if (e.key === "Escape") {
        e.preventDefault()
        cancelRef.current = true
        setEditing(false)
      } else if (e.key === "Enter") {
        e.preventDefault()
        commitEdit()
      }
    },
    [commitEdit],
  )

  const openEditing = useCallback(
    (e: React.MouseEvent | React.PointerEvent) => {
      e.stopPropagation()
      startEditing()
    },
    [startEditing],
  )

  return (
    <>
      <defs>
        <marker
          id={markerId}
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="3.5"
          orient="auto"
        >
          <path d="M0,0.5 L0,6.5 L7,3.5 Z" fill={strokeColor} />
        </marker>
      </defs>

      {/* Wide transparent path for easy hit detection */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={20}
        stroke="transparent"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDoubleClick={openEditing}
      />

      {/* Visible edge path — thin, dimmed at rest, bright when active */}
      <path
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        markerEnd={`url(#${markerId})`}
        style={{ transition: "stroke 0.12s" }}
        pointerEvents="none"
      />

      <EdgeLabelRenderer>
        <div
          className="nodrag nopan"
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          onDoubleClick={openEditing}
        >
          {editing ? (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={handleKeyDown}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                placeholder="Add label…"
                className="rounded-full border border-[#3a3a42] bg-[#18181c] px-2.5 py-0.5 text-center text-xs text-[#f0f0f4] outline-none placeholder:text-[#505060]"
                style={{ width: `${Math.max(80, editValue.length * 7.5 + 28)}px` }}
              />
            </div>
          ) : label ? (
            <span className="cursor-pointer rounded-full border border-[#3a3a42] bg-[#18181c] px-2.5 py-0.5 text-xs text-[#c0c0cc] select-none">
              {label}
            </span>
          ) : isActive ? (
            <span className="cursor-pointer rounded-full px-2.5 py-0.5 text-xs text-[#505060] select-none">
              Add label…
            </span>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
