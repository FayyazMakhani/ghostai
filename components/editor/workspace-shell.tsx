"use client"

import { useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { LiveObject, LiveMap, LiveList } from "@liveblocks/client"
import { LiveblocksProvider, RoomProvider } from "@liveblocks/react"

import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { ShareDialog } from "@/components/editor/share-dialog"
import { CanvasWrapper } from "@/components/editor/canvas-wrapper"
import { AISidebar } from "@/components/editor/ai-sidebar"
import { useProjectActions } from "@/hooks/use-project-actions"
import type { ProjectSummary } from "@/lib/projects"
import type { SaveStatus } from "@/hooks/use-canvas-autosave"

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
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const saveNowRef = useRef<(() => void) | null>(null)
  const handleRegisterSaveNow = useCallback((fn: () => void) => { saveNowRef.current = fn }, [])
  const handleSaveNow = useCallback(() => { saveNowRef.current?.() }, [])

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
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={projectId}
        initialPresence={{ cursor: null, thinking: false }}
        initialStorage={() => ({
          flow: new LiveObject({
            nodes: new LiveMap(),
            edges: new LiveMap(),
          }),
          "ai-status-feed": new LiveList([]),
          "ai-chat": new LiveList([]),
        })}
      >
        <div className="flex h-screen flex-col overflow-hidden bg-base">
          <EditorNavbar
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
            projectName={projectName}
            saveStatus={saveStatus}
            onSaveNow={handleSaveNow}
            onDismissSaveError={() => setSaveStatus("idle")}
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
            onSelectProject={(project) => {
              setIsSidebarOpen(false)
              router.push(`/editor/${project.id}`)
            }}
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
                projectId={projectId}
                isTemplatesOpen={isTemplatesOpen}
                onTemplatesOpenChange={setIsTemplatesOpen}
                onSaveStatusChange={setSaveStatus}
                onRegisterSaveNow={handleRegisterSaveNow}
              />
            </main>

            <AISidebar
              isOpen={isAISidebarOpen}
              onClose={() => setIsAISidebarOpen(false)}
              projectId={projectId}
            />
          </div>
        </div>
      </RoomProvider>
    </LiveblocksProvider>
  )
}
