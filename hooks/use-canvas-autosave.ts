"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type { CanvasNode, CanvasEdge } from "@/types/canvas"

export type SaveStatus = "idle" | "saving" | "saved" | "error"

interface UseCanvasAutosaveOptions {
  projectId: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  debounceMs?: number
}

export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  debounceMs = 1500,
}: UseCanvasAutosaveOptions): { saveStatus: SaveStatus; saveNow: () => void } {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const isFirstRender = useRef(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const projectIdRef = useRef(projectId)
  projectIdRef.current = projectId
  const nodesRef = useRef(nodes)
  nodesRef.current = nodes
  const edgesRef = useRef(edges)
  edgesRef.current = edges

  const savedClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = useCallback(async (nodesToSave: CanvasNode[], edgesToSave: CanvasEdge[]) => {
    setSaveStatus("saving")
    try {
      const res = await fetch(`/api/projects/${projectIdRef.current}/canvas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes: nodesToSave, edges: edgesToSave }),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      setSaveStatus("saved")
      if (savedClearTimerRef.current) clearTimeout(savedClearTimerRef.current)
      savedClearTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000)
    } catch {
      setSaveStatus("error")
    }
  }, [])

  const saveNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    void save(nodesRef.current, edgesRef.current)
  }, [save])

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      save(nodes, edges)
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [nodes, edges, save, debounceMs])

  return { saveStatus, saveNow }
}
