"use client"

import { useState } from "react"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { DialogKind, ProjectSummary } from "@/hooks/use-project-actions"

interface ProjectDialogsProps {
  dialogKind: DialogKind
  targetProject: ProjectSummary | null
  projectName: string
  slug: string
  roomId: string
  isLoading: boolean
  onClose: () => void
  onProjectNameChange: (name: string) => void
  onSubmit: () => void
}

function UrlPreview({ id }: { id: string }) {
  if (!id) return null
  return (
    <p className="font-mono text-xs text-copy-muted">
      ghostai.app/
      <span className="text-copy-primary">{id}</span>
    </p>
  )
}

export function ProjectDialogs({
  dialogKind,
  targetProject,
  projectName,
  slug,
  roomId,
  isLoading,
  onClose,
  onProjectNameChange,
  onSubmit,
}: ProjectDialogsProps) {
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1)
  const [prevDialogKind, setPrevDialogKind] = useState<DialogKind>(dialogKind)
  if (prevDialogKind !== dialogKind) {
    setPrevDialogKind(dialogKind)
    if (dialogKind !== "delete") setDeleteStep(1)
  }

  function handleClose() {
    setDeleteStep(1)
    onClose()
  }

  function handleFinalDelete() {
    setDeleteStep(1)
    onSubmit()
  }

  return (
    <>
      {/* ── Create ── */}
      <Dialog
        open={dialogKind === "create"}
        onOpenChange={(open) => !open && onClose()}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-copy-primary">
              Create project
            </DialogTitle>
            <DialogDescription>
              Give your architecture workspace a name.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Project name"
              value={projectName}
              onChange={(e) => onProjectNameChange(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !isLoading && projectName.trim() && onSubmit()
              }
              className="text-copy-primary"
              autoFocus
            />
            <UrlPreview id={roomId} />
          </div>
          <DialogFooter showCloseButton>
            <Button
              onClick={onSubmit}
              disabled={!projectName.trim() || isLoading}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Rename ── */}
      <Dialog
        open={dialogKind === "rename"}
        onOpenChange={(open) => !open && onClose()}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-copy-primary">
              Rename project
            </DialogTitle>
            {targetProject && (
              <DialogDescription>
                Renaming{" "}
                <span className="text-copy-primary">{targetProject.name}</span>
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Project name"
              value={projectName}
              onChange={(e) => onProjectNameChange(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !isLoading && projectName.trim() && onSubmit()
              }
              onFocus={(e) => e.target.select()}
              className="text-copy-primary"
              autoFocus
            />
            <UrlPreview id={slug} />
          </div>
          <DialogFooter showCloseButton>
            <Button
              onClick={onSubmit}
              disabled={!projectName.trim() || isLoading}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete step 1 — initial confirmation ── */}
      <Dialog
        open={dialogKind === "delete" && deleteStep === 1}
        onOpenChange={(open) => !open && handleClose()}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-copy-primary">
              Delete project
            </DialogTitle>
            {targetProject && (
              <DialogDescription>
                Are you sure you want to delete{" "}
                <span className="text-copy-primary">{targetProject.name}</span>?
                This action is permanent and cannot be undone.
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" autoFocus />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => setDeleteStep(2)}
              disabled={isLoading}
            >
              Delete project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete step 2 — final confirmation ── */}
      <Dialog
        open={dialogKind === "delete" && deleteStep === 2}
        onOpenChange={(open) => !open && handleClose()}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-copy-primary">
              Are you absolutely sure?
            </DialogTitle>
            {targetProject && (
              <DialogDescription>
                <span className="text-copy-primary">{targetProject.name}</span>{" "}
                will be permanently deleted. There is no way to recover it.
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" autoFocus />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleFinalDelete}
              disabled={isLoading}
            >
              Yes, delete forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
