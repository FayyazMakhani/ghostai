"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { useProjectDialogs } from "@/hooks/use-project-dialogs"

export default function EditorPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const {
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
  } = useProjectDialogs()

  return (
    <div className="h-screen bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
      />
      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        projects={projects}
        onNewProject={openCreate}
        onRenameProject={openRename}
        onDeleteProject={openDelete}
      />
      <main className="flex h-full items-center justify-center pt-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-xl font-semibold text-copy-primary">
              Create a project or open an existing one
            </h1>
            <p className="text-sm text-copy-muted">
              Start a new architecture workspace, or choose a project from the
              sidebar.
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </main>
      <ProjectDialogs
        dialogKind={dialogKind}
        targetProject={targetProject}
        projectName={projectName}
        slug={slug}
        isLoading={isLoading}
        onClose={closeDialog}
        onProjectNameChange={setProjectName}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
