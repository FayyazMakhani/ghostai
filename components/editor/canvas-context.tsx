import { createContext, useContext } from "react"
import type { OnNodesChange, OnEdgesChange } from "@xyflow/react"
import type { CanvasNode, CanvasEdge } from "@/types/canvas"

interface CanvasContextValue {
  onNodesChange: OnNodesChange<CanvasNode>
  onEdgesChange: OnEdgesChange<CanvasEdge>
}

export const CanvasContext = createContext<CanvasContextValue | null>(null)

export function useCanvasContext() {
  const ctx = useContext(CanvasContext)
  if (!ctx) throw new Error("useCanvasContext must be used inside CanvasContext.Provider")
  return ctx
}
