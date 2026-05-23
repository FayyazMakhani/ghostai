import { useEffect } from "react"
import type { ReactFlowInstance } from "@xyflow/react"

const ZOOM_DURATION = 200

function isEditableTarget(e: KeyboardEvent): boolean {
  const target = e.target as HTMLElement
  if (!target) return false
  const tag = target.tagName.toLowerCase()
  if (tag === "input" || tag === "textarea") return true
  if (target.isContentEditable) return true
  return false
}

interface UseKeyboardShortcutsOptions {
  instance: ReactFlowInstance | null
  undo: () => void
  redo: () => void
}

export function useKeyboardShortcuts({ instance, undo, redo }: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isEditableTarget(e)) return

      const ctrl = e.ctrlKey || e.metaKey

      if (!ctrl) {
        if (e.key === "+" || e.key === "=") {
          e.preventDefault()
          instance?.zoomIn({ duration: ZOOM_DURATION })
        } else if (e.key === "-") {
          e.preventDefault()
          instance?.zoomOut({ duration: ZOOM_DURATION })
        }
        return
      }

      if (e.key === "z" || e.key === "Z") {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
      } else if (e.key === "y" || e.key === "Y") {
        e.preventDefault()
        redo()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [instance, undo, redo])
}
