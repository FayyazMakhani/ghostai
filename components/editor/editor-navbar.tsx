"use client"

import { Bot, LayoutTemplate, Loader2, PanelLeftClose, PanelLeftOpen, Save, Share2, X } from "lucide-react"
import { UserButton } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"
import type { SaveStatus } from "@/hooks/use-canvas-autosave"

interface EditorNavbarProps {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  projectName?: string
  saveStatus?: SaveStatus
  onSaveNow?: () => void
  onDismissSaveError?: () => void
  isAISidebarOpen?: boolean
  onToggleAISidebar?: () => void
  onShare?: () => void
  onOpenTemplates?: () => void
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  projectName,
  saveStatus,
  onSaveNow,
  onDismissSaveError,
  isAISidebarOpen,
  onToggleAISidebar,
  onShare,
  onOpenTemplates,
}: EditorNavbarProps) {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 flex h-12 items-center border-b border-surface-border bg-surface px-3">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
        </Button>
      </div>

      <div className="flex flex-1 items-center justify-center gap-2">
        {projectName && (
          <span className="text-sm font-medium text-copy-primary">
            {projectName}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {onSaveNow && (
          <>
            {saveStatus === "error" && (
              <button
                onClick={onDismissSaveError}
                className="flex items-center gap-1 text-xs text-error hover:opacity-70"
                aria-label="Dismiss save error"
              >
                <X className="h-3 w-3" />
                Error saving
              </button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onSaveNow}
              disabled={saveStatus === "saving"}
              aria-label="Save"
            >
              {saveStatus === "saving" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
            </Button>
          </>
        )}
        {onOpenTemplates && (
          <Button variant="ghost" size="icon" onClick={onOpenTemplates} aria-label="Starter templates">
            <LayoutTemplate className="h-5 w-5" />
          </Button>
        )}
        {onShare && (
          <Button variant="ghost" size="icon" onClick={onShare} aria-label="Share">
            <Share2 className="h-5 w-5" />
          </Button>
        )}
        {onToggleAISidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleAISidebar}
            aria-label="Toggle AI sidebar"
            data-active={isAISidebarOpen}
            className="data-[active=true]:text-ai-text"
          >
            <Bot className="h-5 w-5" />
          </Button>
        )}
        <UserButton />
      </div>
    </nav>
  )
}
