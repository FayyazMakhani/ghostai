"use client"

import { Bot, LayoutTemplate, PanelLeftClose, PanelLeftOpen, Share2 } from "lucide-react"
import { UserButton } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"

interface EditorNavbarProps {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  projectName?: string
  isAISidebarOpen?: boolean
  onToggleAISidebar?: () => void
  onShare?: () => void
  onOpenTemplates?: () => void
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  projectName,
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

      <div className="flex flex-1 items-center justify-center">
        {projectName && (
          <span className="text-sm font-medium text-copy-primary">
            {projectName}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
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
