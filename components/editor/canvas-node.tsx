"use client"

import { useRef, useState, useCallback } from "react"
import { Handle, NodeResizer, NodeResizeControl, ResizeControlVariant, Position, useReactFlow, type NodeProps } from "@xyflow/react"
import type { CanvasNode } from "@/types/canvas"
import { NODE_COLORS } from "@/types/canvas"
import { DiamondSVG, HexagonSVG, CylinderSVG } from "./canvas-shapes"
import { useCanvasContext } from "./canvas-context"
import { CanvasColorToolbar } from "./canvas-color-toolbar"

const BORDER_REST = "#2a2a30"
const BORDER_SELECTED = "#00c8d4"
const MIN_WIDTH = 60
const MIN_HEIGHT = 40

// Handles are hidden by default. pointer-events-none while invisible so they
// don't block the NodeResizer edge lines that sit below them at the same position.
const HANDLE_CLASS =
  "!h-2 !w-2 !border !border-white/60 !bg-white/80 !opacity-0 !pointer-events-none group-hover:!opacity-100 group-hover:!pointer-events-auto !transition-opacity !duration-150"

const RESIZER_HANDLE_STYLE: React.CSSProperties = {
  width: 9,
  height: 9,
  borderRadius: 2,
  background: "#00c8d4",
  border: "none",
  opacity: 0.9,
}

// Edge lines are visually hidden (transparent) but kept interactive.
// padding widens the hit area from 1 px to ~9 px so edges are actually grabbable.
const RESIZER_LINE_STYLE: React.CSSProperties = {
  borderColor: "transparent",
  padding: "4px",
}

// For non-rectangular shapes the bounding-box corners sit off the visible
// shape edge. Instead we place one handle at each edge midpoint so the
// affordance sits on the shape outline.
const EDGE_RESIZE_POSITIONS = ["top", "right", "bottom", "left"] as const

export function CanvasNodeComponent({ id, data, selected }: NodeProps<CanvasNode>) {
  const { onNodesChange } = useCanvasContext()
  const { getNode } = useReactFlow<CanvasNode>()

  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState("")
  const cancelRef = useRef(false)
  // Tracks editing synchronously to prevent double-commit when blur fires after
  // Enter already committed (unmounting the focused textarea triggers a blur).
  const editingRef = useRef(false)

  const colorPair = NODE_COLORS.find((c) => c.bg === data.color) ?? NODE_COLORS[0]
  const shape = data.shape ?? "rectangle"
  const border = selected ? BORDER_SELECTED : BORDER_REST

  const toolbar = selected ? (
    <CanvasColorToolbar
      nodeId={id}
      activeColor={colorPair.bg}
      onNodesChange={onNodesChange}
    />
  ) : null
  const handleClass = HANDLE_CLASS

  const startEditing = useCallback(
    (initialValue?: string) => {
      const value = initialValue !== undefined ? initialValue : (data.label ?? "")
      setEditValue(value)
      editingRef.current = true
      setEditing(true)
    },
    [data.label],
  )

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
    const node = getNode(id)
    if (!node) return
    onNodesChange([
      { type: "replace", id: node.id, item: { ...node, data: { ...node.data, label: editValue } } },
    ])
  }, [editValue, id, getNode, onNodesChange])

  const handleTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      e.stopPropagation()
      if (e.key === "Escape") {
        e.preventDefault()
        cancelRef.current = true
        setEditing(false)
      } else if (e.key === "Enter" && !e.shiftKey) {
        // Enter commits. Shift+Enter falls through so the browser inserts \n via onChange.
        e.preventDefault()
        commitEdit()
      }
    },
    [commitEdit],
  )

  // Starts editing when the user types a printable character while the node
  // has focus. The textarea is opened empty and the browser delivers the
  // keystroke to the now-focused textarea, avoiding a doubled first character.
  const handleContainerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (editing) return
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.stopPropagation()
        startEditing("") // intentionally empty — browser types the key into the textarea
      }
    },
    [editing, startEditing],
  )

  // React Flow computes edge endpoints from the handle element's outer bounding box
  // (for Position.Bottom: y + height). The default CSS centers handles on the node
  // boundary (translate -50%, +50%), so the outer edge overshoots by half the handle
  // height, creating a visible gap. Overriding the transform keeps each handle's outer
  // edge flush with the node boundary so edges terminate exactly there.
  const handles = (
    <>
      <Handle type="source" position={Position.Top} id="top" className={handleClass} style={{ transform: "translate(-50%, 0%)" }} />
      <Handle type="source" position={Position.Right} id="right" className={handleClass} style={{ transform: "translate(0%, -50%)" }} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={handleClass} style={{ transform: "translate(-50%, 0%)" }} />
      <Handle type="source" position={Position.Left} id="left" className={handleClass} style={{ transform: "translate(0%, -50%)" }} />
    </>
  )

  // Rectangle uses corner handles + invisible edge lines (standard NodeResizer).
  // All other shapes place one handle at each edge midpoint so the affordance
  // sits on the visual shape boundary rather than the bounding-box corner.
  const resizer = selected ? (
    shape === "rectangle" ? (
      <NodeResizer
        isVisible
        minWidth={MIN_WIDTH}
        minHeight={MIN_HEIGHT}
        handleStyle={RESIZER_HANDLE_STYLE}
        lineStyle={RESIZER_LINE_STYLE}
      />
    ) : (
      <>
        {EDGE_RESIZE_POSITIONS.map((pos) => (
          <NodeResizeControl
            key={pos}
            position={pos}
            variant={ResizeControlVariant.Handle}
            minWidth={MIN_WIDTH}
            minHeight={MIN_HEIGHT}
            style={RESIZER_HANDLE_STYLE}
          />
        ))}
      </>
    )
  ) : null

  // Label keeps its space while invisible during editing to prevent layout shifts.
  // white-space: pre-wrap renders \n characters as visible line breaks.
  const label = (
    <span
      className={`relative z-10 px-3 text-center text-sm font-medium leading-snug ${
        editing ? "invisible" : "select-none"
      }`}
      style={{ whiteSpace: "pre-wrap" }}
    >
      {data.label || <span className="opacity-40">Label</span>}
    </span>
  )

  const editor = editing && (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center px-3"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <textarea
        autoFocus
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={commitEdit}
        onKeyDown={handleTextareaKeyDown}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full resize-none bg-transparent text-center text-sm font-medium leading-snug outline-none"
        style={{ color: colorPair.text, caretColor: colorPair.text }}
      />
    </div>
  )

  // tabIndex={-1}: focusable by click, not reachable via Tab, so "click then type"
  // works without making all nodes part of the Tab order.
  const sharedProps = {
    tabIndex: -1,
    onKeyDown: handleContainerKeyDown,
    onDoubleClick: (e: React.MouseEvent) => {
      if (!editing) {
        e.stopPropagation()
        startEditing() // pre-fills with existing label for double-click editing
      }
    },
  }

  if (shape === "rectangle") {
    return (
      <div
        {...sharedProps}
        className="group relative flex h-full w-full items-center justify-center rounded-xl outline-none"
        style={{ background: colorPair.bg, color: colorPair.text, boxShadow: `inset 0 0 0 1px ${border}` }}
      >
        {toolbar}
        {resizer}
        {handles}
        {label}
        {editor}
      </div>
    )
  }

  if (shape === "pill") {
    return (
      <div
        {...sharedProps}
        className="group relative flex h-full w-full items-center justify-center rounded-full outline-none"
        style={{ background: colorPair.bg, color: colorPair.text, boxShadow: `inset 0 0 0 1px ${border}` }}
      >
        {toolbar}
        {resizer}
        {handles}
        {label}
        {editor}
      </div>
    )
  }

  if (shape === "circle") {
    return (
      <div
        {...sharedProps}
        className="group relative flex h-full w-full items-center justify-center rounded-full outline-none"
        style={{ background: colorPair.bg, color: colorPair.text, boxShadow: `inset 0 0 0 1px ${border}` }}
      >
        {toolbar}
        {resizer}
        {handles}
        {label}
        {editor}
      </div>
    )
  }

  return (
    <div
      {...sharedProps}
      className="group relative flex h-full w-full items-center justify-center outline-none"
      style={{ color: colorPair.text }}
    >
      {toolbar}
      {resizer}
      {shape === "diamond" && <DiamondSVG bg={colorPair.bg} border={border} />}
      {shape === "hexagon" && <HexagonSVG bg={colorPair.bg} border={border} />}
      {shape === "cylinder" && <CylinderSVG bg={colorPair.bg} border={border} />}
      {handles}
      {label}
      {editor}
    </div>
  )
}
