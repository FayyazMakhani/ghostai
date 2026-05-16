"use client"

import { useState } from "react"

export interface MockProject {
  id: string
  name: string
  owned: boolean
}

export type DialogKind = "create" | "rename" | "delete" | null

const INITIAL_PROJECTS: MockProject[] = [
  { id: "1", name: "Microservices Platform", owned: true },
  { id: "2", name: "Event-Driven Pipeline", owned: true },
  { id: "3", name: "Shared Architecture", owned: false },
]

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function useProjectDialogs() {
  const [projects, setProjects] = useState<MockProject[]>(INITIAL_PROJECTS)
  const [dialogKind, setDialogKind] = useState<DialogKind>(null)
  const [targetProject, setTargetProject] = useState<MockProject | null>(null)
  const [projectName, setProjectName] = useState("")
  const isLoading = false

  const slug = toSlug(projectName)

  function openCreate() {
    setProjectName("")
    setTargetProject(null)
    setDialogKind("create")
  }

  function openRename(project: MockProject) {
    setProjectName(project.name)
    setTargetProject(project)
    setDialogKind("rename")
  }

  function openDelete(project: MockProject) {
    setTargetProject(project)
    setDialogKind("delete")
  }

  function closeDialog() {
    setDialogKind(null)
    setTargetProject(null)
    setProjectName("")
  }

  function handleSubmit() {
    if (dialogKind === "create" && projectName.trim()) {
      setProjects((prev) => [
        ...prev,
        { id: Date.now().toString(), name: projectName.trim(), owned: true },
      ])
      closeDialog()
    } else if (dialogKind === "rename" && targetProject && projectName.trim()) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === targetProject.id ? { ...p, name: projectName.trim() } : p
        )
      )
      closeDialog()
    } else if (dialogKind === "delete" && targetProject) {
      setProjects((prev) => prev.filter((p) => p.id !== targetProject.id))
      closeDialog()
    }
  }

  return {
    projects,
    dialogKind,
    targetProject,
    projectName,
    isLoading,
    slug,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    setProjectName,
    handleSubmit,
  }
}
