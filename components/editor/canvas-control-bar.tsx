"use client"

import { ZoomIn, ZoomOut, Maximize2, Undo2, Redo2 } from "lucide-react"
import { useReactFlow } from "@xyflow/react"
import { useCanUndo, useCanRedo, useUndo, useRedo } from "@liveblocks/react"

const ZOOM_DURATION = 200

export function CanvasControlBar() {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()
  const undo = useUndo()
  const redo = useRedo()

  return (
    <div className="flex items-center bg-surface border border-surface-border rounded-xl shadow-lg overflow-hidden">
      <button
        type="button"
        onClick={() => zoomOut({ duration: ZOOM_DURATION })}
        className="flex items-center justify-center w-8 h-8 hover:bg-elevated transition-colors"
        title="Zoom out (−)"
        aria-label="Zoom out"
      >
        <ZoomOut className="h-4 w-4 text-copy-muted" />
      </button>
      <button
        type="button"
        onClick={() => fitView({ duration: ZOOM_DURATION })}
        className="flex items-center justify-center w-8 h-8 hover:bg-elevated transition-colors"
        title="Fit view"
        aria-label="Fit view"
      >
        <Maximize2 className="h-4 w-4 text-copy-muted" />
      </button>
      <button
        type="button"
        onClick={() => zoomIn({ duration: ZOOM_DURATION })}
        className="flex items-center justify-center w-8 h-8 hover:bg-elevated transition-colors"
        title="Zoom in (+)"
        aria-label="Zoom in"
      >
        <ZoomIn className="h-4 w-4 text-copy-muted" />
      </button>

      <div className="w-px h-5 bg-surface-border mx-0.5" />

      <button
        type="button"
        onClick={undo}
        disabled={!canUndo}
        className="flex items-center justify-center w-8 h-8 hover:bg-elevated transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Undo (Ctrl/Cmd+Z)"
        aria-label="Undo"
      >
        <Undo2 className="h-4 w-4 text-copy-muted" />
      </button>
      <button
        type="button"
        onClick={redo}
        disabled={!canRedo}
        className="flex items-center justify-center w-8 h-8 hover:bg-elevated transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Redo (Ctrl/Cmd+Shift+Z or Y)"
        aria-label="Redo"
      >
        <Redo2 className="h-4 w-4 text-copy-muted" />
      </button>
    </div>
  )
}
