import type { Node, Edge } from "@xyflow/react"

export type NodeShape =
  | "rectangle"
  | "diamond"
  | "circle"
  | "pill"
  | "cylinder"
  | "hexagon"

export const NODE_SHAPES: NodeShape[] = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
]

export const NODE_COLORS = [
  { bg: "#1F1F1F", text: "#EDEDED", name: "Charcoal" },
  { bg: "#10233D", text: "#52A8FF", name: "Blue" },
  { bg: "#2E1938", text: "#BF7AF0", name: "Purple" },
  { bg: "#331B00", text: "#FF990A", name: "Orange" },
  { bg: "#3C1618", text: "#FF6166", name: "Red" },
  { bg: "#3A1726", text: "#F75F8F", name: "Pink" },
  { bg: "#0F2E18", text: "#62C073", name: "Green" },
  { bg: "#062822", text: "#0AC7B4", name: "Teal" },
] as const

export const DEFAULT_NODE_COLOR = NODE_COLORS[0]

export const SHAPE_DEFAULTS: Record<NodeShape, { width: number; height: number }> = {
  rectangle: { width: 160, height: 80 },
  diamond: { width: 150, height: 150 },
  circle: { width: 100, height: 100 },
  pill: { width: 160, height: 60 },
  cylinder: { width: 120, height: 80 },
  hexagon: { width: 130, height: 130 },
}

export interface ShapeDragPayload {
  shape: NodeShape
  width: number
  height: number
}

export interface NodeData extends Record<string, unknown> {
  label: string
  color?: string
  shape?: NodeShape
}

export interface EdgeData extends Record<string, unknown> {
  label?: string
}

export type CanvasNode = Node<NodeData, "canvasNode">
export type CanvasEdge = Edge<EdgeData, "canvasEdge">
