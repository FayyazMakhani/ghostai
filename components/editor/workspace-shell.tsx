"use client"

import { useState } from "react"

import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { ShareDialog } from "@/components/editor/share-dialog"
import { CanvasWrapper } from "@/components/editor/canvas-wrapper"
import { useProjectActions } from "@/hooks/use-project-actions"
import type { ProjectSummary } from "@/lib/projects"

interface WorkspaceShellProps {
  projectId: string
  projectName: string
  isOwner: boolean
  ownedProjects: ProjectSummary[]
  sharedProjects: ProjectSummary[]
}

export function WorkspaceShell({
  projectId,
  projectName,
  isOwner,
  ownedProjects,
  sharedProjects,
}: WorkspaceShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false)

  const {
    dialogKind,
    targetProject,
    projectName: dialogProjectName,
    slug,
    roomId,
    isLoading,
    error,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    setProjectName,
    handleSubmit,
  } = useProjectActions(projectId)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
        projectName={projectName}
        isAISidebarOpen={isAISidebarOpen}
        onToggleAISidebar={() => setIsAISidebarOpen((v) => !v)}
        onShare={() => setIsShareOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
      />

      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        activeProjectId={projectId}
        onNewProject={openCreate}
        onRenameProject={openRename}
        onDeleteProject={openDelete}
      />

      <ShareDialog
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        projectId={projectId}
        isOwner={isOwner}
      />

      <ProjectDialogs
        dialogKind={dialogKind}
        targetProject={targetProject}
        projectName={dialogProjectName}
        slug={slug}
        roomId={roomId}
        isLoading={isLoading}
        error={error}
        onClose={closeDialog}
        onProjectNameChange={setProjectName}
        onSubmit={handleSubmit}
      />

      <div className="relative flex flex-1 overflow-hidden pt-12">
        <main className="relative flex flex-1 overflow-hidden">
          <CanvasWrapper
            roomId={projectId}
            isTemplatesOpen={isTemplatesOpen}
            onTemplatesOpenChange={setIsTemplatesOpen}
          />
        </main>

        {/* AI sidebar placeholder */}
        <aside
          className={`fixed bottom-0 right-0 top-12 z-40 flex w-80 flex-col border-l border-surface-border bg-surface transition-transform duration-200 ease-in-out ${
            isAISidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-copy-muted">AI chat coming soon</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
