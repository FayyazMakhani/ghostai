"use client"

import { useState, useEffect } from "react"
import { Check, Copy, Loader2, Trash2, UserPlus } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Collaborator {
  email: string
  name: string | null
  imageUrl: string | null
}

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  isOwner: boolean
}

export function ShareDialog({
  open,
  onOpenChange,
  projectId,
  isOwner,
}: ShareDialogProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviting, setInviting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/projects/${projectId}/collaborators`, {
          signal: controller.signal,
        })
        if (res.status === 403) {
          setCollaborators([])
          setError("You no longer have access to this project")
          return
        }
        if (!res.ok) throw new Error()
        const data = await res.json()
        setCollaborators(data.collaborators)
      } catch {
        if (controller.signal.aborted) return
        setCollaborators([])
        setError("Could not load collaborators")
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [open, projectId])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = inviteEmail.trim()
    if (!trimmed) return
    setInviting(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to invite")
      }
      const added: Collaborator = await res.json()
      setCollaborators((prev) => [...prev, added])
      setInviteEmail("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite")
    } finally {
      setInviting(false)
    }
  }

  async function handleRemove(email: string) {
    setError(null)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/collaborators/${encodeURIComponent(email)}`,
        { method: "DELETE" }
      )
      if (!res.ok) throw new Error("Failed to remove collaborator")
      setCollaborators((prev) => prev.filter((c) => c.email !== email))
    } catch {
      setError("Failed to remove collaborator")
    }
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/editor/${projectId}`
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {
        setError("Failed to copy link")
      })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-copy-primary">
            Share project
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {isOwner && (
            <form onSubmit={handleInvite} className="flex gap-2">
              <Input
                type="email"
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 text-copy-primary"
                disabled={inviting}
              />
              <Button
                type="submit"
                size="icon"
                disabled={inviting || !inviteEmail.trim()}
                aria-label="Invite collaborator"
              >
                {inviting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            </form>
          )}

          {error && <p className="text-xs text-error">{error}</p>}

          <p className="text-xs font-medium uppercase tracking-wide text-copy-muted">
            Collaborators
          </p>

          <div className="flex flex-col gap-1">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-copy-muted" />
              </div>
            ) : collaborators.length === 0 ? (
              <p className="py-4 text-center text-sm text-copy-muted">
                No collaborators yet
              </p>
            ) : (
              collaborators.map((c) => (
                <div
                  key={c.email}
                  className="flex items-center gap-3 rounded-xl px-1 py-2"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-subtle">
                    {c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.imageUrl}
                        alt={c.name ?? c.email}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium uppercase text-copy-muted">
                        {(c.name ?? c.email)[0]}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    {c.name && (
                      <p className="truncate text-sm font-medium text-copy-primary">
                        {c.name}
                      </p>
                    )}
                    <p
                      className={`truncate ${c.name ? "text-xs text-copy-muted" : "text-sm text-copy-primary"}`}
                    >
                      {c.email}
                    </p>
                  </div>

                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(c.email)}
                      aria-label={`Remove ${c.email}`}
                      className="shrink-0 text-copy-muted hover:text-error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="border-t border-surface-border pt-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-copy-muted hover:text-copy-primary"
              onClick={handleCopyLink}
            >
              {copied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy project link"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
