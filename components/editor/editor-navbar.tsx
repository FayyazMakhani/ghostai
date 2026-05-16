"use client"

import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

import { Button } from "@/components/ui/button"

/** Props for {@link EditorNavbar}. */
interface EditorNavbarProps {
  /** Whether the project sidebar is currently open. */
  isSidebarOpen: boolean
  /** Called when the user clicks the sidebar toggle button. */
  onToggleSidebar: () => void
}

/** Fixed top navigation bar for the editor workspace. */
export function EditorNavbar({ isSidebarOpen, onToggleSidebar }: EditorNavbarProps) {
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
      <div className="flex flex-1 items-center justify-center" />
      <div className="flex items-center" />
    </nav>
  )
}
