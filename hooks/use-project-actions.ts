"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { ProjectSummary } from "@/lib/projects"

export type { ProjectSummary }
export type DialogKind = "create" | "rename" | "delete" | null

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function generateSuffix(): string {
  return Math.random().toString(36).slice(2, 7)
}

export function useProjectActions(activeProjectId?: string) {
  const router = useRouter()
  const [dialogKind, setDialogKind] = useState<DialogKind>(null)
  const [targetProject, setTargetProject] = useState<ProjectSummary | null>(null)
  const [projectName, setProjectName] = useState("")
  const [roomSuffix, setRoomSuffix] = useState<string>(generateSuffix)
  const [isLoading, setIsLoading] = useState(false)

  const slug = toSlug(projectName)
  const roomId = slug ? `${slug}-${roomSuffix}` : roomSuffix

  function openCreate() {
    setProjectName("")
    setTargetProject(null)
    setRoomSuffix(generateSuffix())
    setDialogKind("create")
  }

  function openRename(project: ProjectSummary) {
    setProjectName(project.name)
    setTargetProject(project)
    setDialogKind("rename")
  }

  function openDelete(project: ProjectSummary) {
    setTargetProject(project)
    setDialogKind("delete")
  }

  function closeDialog() {
    setDialogKind(null)
    setTargetProject(null)
    setProjectName("")
  }

  async function handleCreate() {
    if (!projectName.trim()) return
    setIsLoading(true)
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName.trim(), id: roomId }),
      })
      if (res.ok) {
        const project = await res.json()
        closeDialog()
        router.push(`/editor/${project.id}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRename() {
    if (!targetProject || !projectName.trim()) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/projects/${targetProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName.trim() }),
      })
      if (res.ok) {
        closeDialog()
        router.refresh()
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    if (!targetProject) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/projects/${targetProject.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        const deletedId = targetProject.id
        closeDialog()
        if (activeProjectId && activeProjectId === deletedId) {
          router.push("/editor")
        } else {
          router.refresh()
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit() {
    if (dialogKind === "create") return handleCreate()
    if (dialogKind === "rename") return handleRename()
    if (dialogKind === "delete") return handleDelete()
  }

  return {
    dialogKind,
    targetProject,
    projectName,
    slug,
    roomId,
    isLoading,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    setProjectName,
    handleSubmit,
  }
}
