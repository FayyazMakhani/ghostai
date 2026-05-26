"use client"

import { Component, type ReactNode } from "react"
import { ClientSideSuspense } from "@liveblocks/react"
import { CanvasFlow } from "./canvas-flow"
import type { SaveStatus } from "@/hooks/use-canvas-autosave"

interface ErrorBoundaryState {
  hasError: boolean
}

class LiveblocksErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

interface CanvasWrapperProps {
  projectId: string
  isTemplatesOpen: boolean
  onTemplatesOpenChange: (open: boolean) => void
  onSaveStatusChange: (status: SaveStatus) => void
  onRegisterSaveNow: (fn: () => void) => void
}

export function CanvasWrapper({ projectId, isTemplatesOpen, onTemplatesOpenChange, onSaveStatusChange, onRegisterSaveNow }: CanvasWrapperProps) {
  return (
    <LiveblocksErrorBoundary
      fallback={
        <div className="flex h-full w-full items-center justify-center">
          <p className="text-sm text-copy-muted">Could not connect to canvas</p>
        </div>
      }
    >
      <ClientSideSuspense
        fallback={
          <div className="flex h-full w-full items-center justify-center">
            <p className="text-sm text-copy-muted">Loading canvas…</p>
          </div>
        }
      >
        <CanvasFlow
          projectId={projectId}
          isTemplatesOpen={isTemplatesOpen}
          onTemplatesOpenChange={onTemplatesOpenChange}
          onSaveStatusChange={onSaveStatusChange}
          onRegisterSaveNow={onRegisterSaveNow}
        />
      </ClientSideSuspense>
    </LiveblocksErrorBoundary>
  )
}
