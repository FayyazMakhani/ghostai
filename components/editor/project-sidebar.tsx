"use client"

import { Pencil, Plus, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ProjectSummary } from "@/lib/projects"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  ownedProjects: ProjectSummary[]
  sharedProjects: ProjectSummary[]
  activeProjectId?: string
  onSelectProject: (project: ProjectSummary) => void
  onNewProject: () => void
  onRenameProject: (project: ProjectSummary) => void
  onDeleteProject: (project: ProjectSummary) => void
}

export function ProjectSidebar({
  isOpen,
  onClose,
  ownedProjects,
  sharedProjects,
  activeProjectId,
  onSelectProject,
  onNewProject,
  onRenameProject,
  onDeleteProject,
}: ProjectSidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed bottom-0 left-0 top-12 z-40 flex w-72 flex-col border-r border-surface-border bg-surface transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
          <span className="text-sm font-semibold text-copy-primary">
            Projects
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden px-3 pt-3">
          <Tabs defaultValue="my-projects" className="flex flex-1 flex-col">
            <TabsList className="w-full">
              <TabsTrigger value="my-projects" className="flex-1">
                My Projects
              </TabsTrigger>
              <TabsTrigger value="shared" className="flex-1">
                Shared
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-projects" className="flex-1 overflow-hidden">
              {ownedProjects.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-copy-muted">No projects yet</p>
                </div>
              ) : (
                <ScrollArea className="h-full py-1">
                  {ownedProjects.map((project) => (
                    <div
                      key={project.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectProject(project)}
                      onKeyDown={(e) => e.key === "Enter" && onSelectProject(project)}
                      className={`group flex cursor-pointer items-center gap-1 rounded-xl px-2 py-2 hover:bg-elevated ${
                        project.id === activeProjectId ? "bg-elevated" : ""
                      }`}
                    >
                      <span className={`flex-1 truncate text-sm ${project.id === activeProjectId ? "font-medium text-copy-primary" : "text-copy-primary"}`}>
                        {project.name}
                      </span>
                      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onRenameProject(project)}
                          aria-label={`Rename ${project.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onDeleteProject(project)}
                          aria-label={`Delete ${project.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="shared" className="flex-1 overflow-hidden">
              {sharedProjects.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-copy-muted">No shared projects</p>
                </div>
              ) : (
                <ScrollArea className="h-full py-1">
                  {sharedProjects.map((project) => (
                    <div
                      key={project.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectProject(project)}
                      onKeyDown={(e) => e.key === "Enter" && onSelectProject(project)}
                      className={`flex cursor-pointer items-center gap-1 rounded-xl px-2 py-2 hover:bg-elevated ${
                        project.id === activeProjectId ? "bg-elevated" : ""
                      }`}
                    >
                      <span className={`flex-1 truncate text-sm ${project.id === activeProjectId ? "font-medium text-copy-primary" : "text-copy-primary"}`}>
                        {project.name}
                      </span>
                    </div>
                  ))}
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="border-t border-surface-border p-3">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={onNewProject}
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  )
}
