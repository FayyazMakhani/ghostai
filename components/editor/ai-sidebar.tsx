"use client"

import { useState, useRef, useEffect, useCallback, useMemo, type KeyboardEvent } from "react"
import { Bot, X, FileText, Download, Send, Loader2, MessageSquare } from "lucide-react"
import { useStorage, useMutation, useOthers, useSelf } from "@liveblocks/react"
import { useRealtimeRun } from "@trigger.dev/react-hooks"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { aiStatusFeedPayloadSchema, chatMessageSchema, type ChatMessage } from "@/types/tasks"
import type { designAgent } from "@/trigger/design-agent"
import type { generateSpec } from "@/trigger/generate-spec"

const STARTER_CHIPS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
]

interface RunTrackerProps {
  runId: string
  publicToken: string
  onComplete: () => void
  onError: (message: string) => void
}

function RunTracker({ runId, publicToken, onComplete, onError }: RunTrackerProps) {
  const doneRef = useRef(false)

  const { error } = useRealtimeRun<typeof designAgent>(runId, {
    accessToken: publicToken,
    onComplete: (completedRun) => {
      if (doneRef.current) return
      doneRef.current = true
      if (completedRun.status === "COMPLETED") {
        onComplete()
      } else {
        onError(`Run ${completedRun.status.toLowerCase().replace(/_/g, " ")}`)
      }
    },
  })

  useEffect(() => {
    if (!error || doneRef.current) return
    doneRef.current = true
    onError((error as Error).message ?? "Connection error")
  }, [error]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

interface AIArchitectTabProps {
  projectId: string
}

function AIArchitectTab({ projectId }: AIArchitectTabProps) {
  const [input, setInput] = useState("")
  const [runId, setRunId] = useState("")
  const [publicToken, setPublicToken] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollEndRef = useRef<HTMLDivElement>(null)
  const prevFeedStatus = useRef("")

  const self = useSelf()

  // Read the latest status from the shared feed
  const rawFeed = useStorage((root) => root["ai-status-feed"])
  const latestFeedItem = rawFeed && rawFeed.length > 0 ? rawFeed[rawFeed.length - 1] : null
  const validatedFeedItem = latestFeedItem
    ? aiStatusFeedPayloadSchema.safeParse(latestFeedItem)
    : null
  const latestStatus = validatedFeedItem?.success ? (validatedFeedItem.data.text ?? "") : ""

  // Subscribe to the shared ai-chat feed for display
  const rawMessages = useStorage((root) => root["ai-chat"])
  const messages = useMemo<ChatMessage[]>(() => {
    if (!rawMessages) return []
    return rawMessages
      .map((m) => chatMessageSchema.safeParse(m))
      .filter((r): r is { success: true; data: ChatMessage } => r.success)
      .map((r) => r.data)
  }, [rawMessages])

  // Detect whether any room participant (including AI agent) has thinking: true
  const anyoneThinking = useOthers((others) => others.some((o) => o.presence.thinking))

  const pushMessage = useMutation(({ storage }, msg: ChatMessage) => {
    storage.get("ai-chat").push(msg)
  }, [])

  const writeFeed = useMutation(({ storage }, text: string) => {
    storage.get("ai-status-feed").push({ text })
  }, [])

  const clearFeed = useMutation(({ storage }) => {
    const feed = storage.get("ai-status-feed")
    while (feed.length > 0) feed.delete(0)
  }, [])

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleComplete = useCallback(() => {
    pushMessage({
      sender: "Ghost AI",
      role: "assistant",
      content: "Design complete! The canvas has been updated with your architecture.",
      timestamp: Date.now(),
    })
    clearFeed()
    setRunId("")
    setPublicToken(null)
  }, [pushMessage, clearFeed])

  const handleError = useCallback((errMsg: string) => {
    pushMessage({
      sender: "Ghost AI",
      role: "assistant",
      content: `Error: ${errMsg}`,
      timestamp: Date.now(),
    })
    clearFeed()
    setRunId("")
    setPublicToken(null)
  }, [pushMessage, clearFeed])

  // Fallback: when publicToken is unavailable, detect completion via ai-status-feed
  useEffect(() => {
    if (!runId || publicToken) return
    if (!latestStatus || latestStatus === prevFeedStatus.current) return
    prevFeedStatus.current = latestStatus
    if (latestStatus === "Design complete!") {
      handleComplete()
    } else if (latestStatus.startsWith("Error:")) {
      handleError(latestStatus.slice(7).trim())
    }
  }, [latestStatus, runId, publicToken, handleComplete, handleError])

  function adjustTextareaHeight() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "72px"
    el.style.height = Math.min(el.scrollHeight, 160) + "px"
  }

  const isRunActive = !!runId || anyoneThinking

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isRunActive) return

    pushMessage({
      sender: self?.info.name ?? "You",
      role: "user",
      content: text,
      timestamp: Date.now(),
    })
    setInput("")
    if (textareaRef.current) textareaRef.current.style.height = "72px"
    prevFeedStatus.current = ""
    clearFeed()
    writeFeed("Starting…")

    try {
      const res = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, roomId: projectId, projectId }),
      })

      const responseText = await res.text()
      console.log("[ai/design] response", res.status, responseText)

      if (!res.ok) {
        let errMsg = `HTTP ${res.status}`
        try {
          const data = JSON.parse(responseText) as { error?: string }
          errMsg = data.error ?? errMsg
        } catch { /* non-JSON body */ }
        clearFeed()
        handleError(errMsg)
        return
      }

      const data = JSON.parse(responseText) as { runId: string; publicToken: string | null }
      setRunId(data.runId)
      setPublicToken(data.publicToken)
    } catch (err) {
      console.error("[ai/design] fetch error:", err)
      clearFeed()
      handleError("Could not reach the AI service. Please try again.")
    }
  }, [input, isRunActive, projectId, self, pushMessage, clearFeed, writeFeed, handleError])

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleChip(chip: string) {
    setInput(chip)
    textareaRef.current?.focus()
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {runId && publicToken && (
        <RunTracker
          runId={runId}
          publicToken={publicToken}
          onComplete={handleComplete}
          onError={handleError}
        />
      )}

      {/* Status strip — only visible when a run is active */}
      {isRunActive && (
        <div className="flex shrink-0 items-center gap-2 border-b border-surface-border bg-subtle px-3 py-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 text-ai-text" />
          <span className="truncate text-xs text-copy-muted">
            {latestStatus || "Working…"}
          </span>
        </div>
      )}

      <ScrollArea className="flex-1 px-3 py-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center gap-4 px-2 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-subtle">
              <Bot className="h-6 w-6 text-ai-text" />
            </div>
            <div>
              <p className="text-sm font-medium text-copy-primary">Ghost AI Architect</p>
              <p className="mt-1 text-xs text-copy-muted">
                Describe your system and I&apos;ll help design the architecture.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-1 w-full">
              {STARTER_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleChip(chip)}
                  className="rounded-full bg-subtle px-3 py-1.5 text-xs text-ai-text transition-colors hover:bg-elevated text-left"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-2">
            {messages.map((msg, i) =>
              msg.role === "user" ? (
                <div key={`${msg.timestamp}-${i}`} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl bg-[#62C073] px-3 py-2 text-sm whitespace-pre-wrap" style={{ color: "#0F2E18" }}>
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div key={`${msg.timestamp}-${i}`} className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl bg-elevated border border-surface-border px-3 py-2 text-sm text-ai-text whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>
              )
            )}
            <div ref={scrollEndRef} />
          </div>
        )}
      </ScrollArea>

      <div className="border-t border-surface-border p-3">
        <div className="flex flex-col gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              adjustTextareaHeight()
            }}
            onKeyDown={handleKeyDown}
            placeholder="Describe your architecture…"
            disabled={isRunActive}
            className="resize-none overflow-hidden border-surface-border bg-elevated text-copy-primary placeholder:text-copy-muted focus-visible:ring-brand/50 text-sm disabled:opacity-60"
            style={{ minHeight: "72px", maxHeight: "160px" }}
            rows={1}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!input.trim() || isRunActive}
              className="bg-[#62C073] text-[#0F2E18] hover:bg-[#62C073]/90 disabled:opacity-40"
            >
              {isRunActive ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              {isRunActive ? "Working…" : "Send"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function ChatTab() {
  const [input, setInput] = useState("")
  const [sendError, setSendError] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollEndRef = useRef<HTMLDivElement>(null)

  const self = useSelf()
  const rawMessages = useStorage((root) => root["ai-chat"])

  const messages = useMemo<ChatMessage[]>(() => {
    if (!rawMessages) return []
    return rawMessages
      .map((m) => chatMessageSchema.safeParse(m))
      .filter((r): r is { success: true; data: ChatMessage } => r.success)
      .map((r) => r.data)
  }, [rawMessages])

  const sendMessage = useMutation(({ storage }, msg: ChatMessage) => {
    storage.get("ai-chat").push(msg)
  }, [])

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text) return
    const sender = self?.info.name ?? "Anonymous"
    setSendError(false)
    try {
      sendMessage({ sender, role: "user", content: text, timestamp: Date.now() })
      setInput("")
      if (textareaRef.current) textareaRef.current.style.height = "72px"
    } catch {
      setSendError(true)
    }
  }, [input, self, sendMessage])

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function adjustTextareaHeight() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "72px"
    el.style.height = Math.min(el.scrollHeight, 160) + "px"
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ScrollArea className="flex-1 px-3 py-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-2 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-subtle">
              <MessageSquare className="h-6 w-6 text-copy-muted" />
            </div>
            <div>
              <p className="text-sm font-medium text-copy-primary">Room Chat</p>
              <p className="mt-1 text-xs text-copy-muted">
                Send messages visible to everyone in this room.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-2">
            {messages.map((msg, i) => (
              <div key={`${msg.timestamp}-${i}`} className="flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium text-copy-primary">{msg.sender}</span>
                  <span className="text-[10px] text-copy-muted">{formatTime(msg.timestamp)}</span>
                </div>
                <p className="rounded-xl bg-elevated border border-surface-border px-3 py-2 text-sm text-copy-primary whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            ))}
            <div ref={scrollEndRef} />
          </div>
        )}
      </ScrollArea>

      <div className="border-t border-surface-border p-3">
        {sendError && (
          <p className="mb-2 text-xs text-error">Failed to send. Please try again.</p>
        )}
        <div className="flex flex-col gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              adjustTextareaHeight()
            }}
            onKeyDown={handleKeyDown}
            placeholder="Send a message…"
            className="resize-none overflow-hidden border-surface-border bg-elevated text-copy-primary placeholder:text-copy-muted focus-visible:ring-brand/50 text-sm"
            style={{ minHeight: "72px", maxHeight: "160px" }}
            rows={1}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-brand text-base hover:bg-brand/90 disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface SpecItem {
  id: string
  createdAt: string
  filename: string
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function downloadSpec(projectId: string, specId: string, filename: string) {
  const a = document.createElement("a")
  a.href = `/api/projects/${projectId}/specs/${specId}/download`
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

interface SpecRunTrackerProps {
  runId: string
  publicToken: string
  onComplete: () => void
  onError: () => void
}

function SpecRunTracker({ runId, publicToken, onComplete, onError }: SpecRunTrackerProps) {
  const doneRef = useRef(false)

  const { error } = useRealtimeRun<typeof generateSpec>(runId, {
    accessToken: publicToken,
    onComplete: (completedRun) => {
      if (doneRef.current) return
      doneRef.current = true
      if (completedRun.status === "COMPLETED") {
        onComplete()
      } else {
        onError()
      }
    },
  })

  useEffect(() => {
    if (!error || doneRef.current) return
    doneRef.current = true
    onError()
  }, [error]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

interface SpecsTabProps {
  projectId: string
}

function SpecsTab({ projectId }: SpecsTabProps) {
  const [specs, setSpecs] = useState<SpecItem[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [genRunId, setGenRunId] = useState("")
  const [genToken, setGenToken] = useState<string | null>(null)
  const [selectedSpec, setSelectedSpec] = useState<SpecItem | null>(null)
  const [modalContent, setModalContent] = useState<string | null>(null)
  const [modalLoading, setModalLoading] = useState(false)

  const rawMessages = useStorage((root) => root["ai-chat"])

  const loadSpecs = useCallback(() => {
    setLoading(true)
    fetch(`/api/projects/${projectId}/specs`)
      .then((r) => r.json())
      .then((data: { specs: SpecItem[] }) => setSpecs(data.specs ?? []))
      .catch(() => setSpecs([]))
      .finally(() => setLoading(false))
  }, [projectId])

  useEffect(() => { loadSpecs() }, [loadSpecs])

  const handleGenerate = useCallback(async () => {
    if (generating) return
    setGenerating(true)
    setGenError(null)

    try {
      // Fetch the latest saved canvas state
      let nodes: unknown[] = []
      let edges: unknown[] = []
      const canvasRes = await fetch(`/api/projects/${projectId}/canvas`)
      if (canvasRes.ok) {
        const canvas = await canvasRes.json() as { nodes?: unknown[]; edges?: unknown[] }
        nodes = canvas.nodes ?? []
        edges = canvas.edges ?? []
      }

      // Build chat history with string timestamps (API expects string)
      const chatHistory = (rawMessages ?? [])
        .map((m) => chatMessageSchema.safeParse(m))
        .filter((r): r is { success: true; data: ChatMessage } => r.success)
        .map((r) => ({ ...r.data, timestamp: String(r.data.timestamp) }))

      const res = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: projectId, chatHistory, nodes, edges }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setGenError(data.error ?? "Failed to generate spec")
        setGenerating(false)
        return
      }

      const data = await res.json() as { runId: string; publicToken: string | null }
      setGenRunId(data.runId)
      setGenToken(data.publicToken)
    } catch {
      setGenError("Could not reach the server. Please try again.")
      setGenerating(false)
    }
  }, [generating, projectId, rawMessages])

  const handleGenComplete = useCallback(() => {
    setGenerating(false)
    setGenRunId("")
    setGenToken(null)
    loadSpecs()
  }, [loadSpecs])

  const handleGenError = useCallback(() => {
    setGenerating(false)
    setGenRunId("")
    setGenToken(null)
    setGenError("Spec generation failed.")
  }, [])

  const openSpec = useCallback(async (spec: SpecItem) => {
    setSelectedSpec(spec)
    setModalContent(null)
    setModalLoading(true)
    try {
      const r = await fetch(`/api/projects/${projectId}/specs/${spec.id}`)
      const data = await r.json() as { content?: string }
      setModalContent(data.content ?? "")
    } catch {
      setModalContent("")
    } finally {
      setModalLoading(false)
    }
  }, [projectId])

  const closeModal = useCallback(() => {
    setSelectedSpec(null)
    setModalContent(null)
  }, [])

  return (
    <>
      {genRunId && genToken && (
        <SpecRunTracker
          runId={genRunId}
          publicToken={genToken}
          onComplete={handleGenComplete}
          onError={handleGenError}
        />
      )}

      <div className="flex shrink-0 flex-col gap-2 p-3">
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full bg-brand text-base hover:bg-brand/90 disabled:opacity-60"
        >
          {generating ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Generating…</>
          ) : (
            <><FileText className="h-4 w-4" />Generate Spec</>
          )}
        </Button>
        {genError && (
          <p className="text-xs text-error">{genError}</p>
        )}
      </div>

      <ScrollArea className="flex-1 border-t border-surface-border">
        <div className="flex flex-col gap-1 p-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-copy-muted" />
            </div>
          ) : specs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-2 py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-subtle">
                <FileText className="h-6 w-6 text-copy-muted" />
              </div>
              <div>
                <p className="text-sm font-medium text-copy-primary">No specs yet</p>
                <p className="mt-1 text-xs text-copy-muted">
                  Click Generate Spec to create one from your canvas.
                </p>
              </div>
            </div>
          ) : (
            specs.map((spec) => (
              <button
                key={spec.id}
                onClick={() => openSpec(spec)}
                className="group flex w-full items-center gap-3 rounded-xl border border-surface-border bg-elevated px-3 py-2.5 text-left transition-colors hover:bg-subtle"
              >
                <FileText className="h-4 w-4 shrink-0 text-ai-text" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-copy-primary">{spec.filename}</p>
                  <p className="text-[10px] text-copy-muted">{formatDate(spec.createdAt)}</p>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    downloadSpec(projectId, spec.id, spec.filename)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      e.stopPropagation()
                      downloadSpec(projectId, spec.id, spec.filename)
                    }
                  }}
                  className="shrink-0 cursor-pointer text-copy-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-copy-primary"
                  aria-label="Download spec"
                >
                  <Download className="h-3.5 w-3.5" />
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      <Dialog open={!!selectedSpec} onOpenChange={(open) => { if (!open) closeModal() }}>
        <DialogContent className="flex max-h-[80vh] w-[90vw] max-w-2xl flex-col gap-0 overflow-hidden border-surface-border bg-surface p-0">
          <DialogHeader className="flex shrink-0 flex-row items-center justify-between border-b border-surface-border px-5 py-4">
            <DialogTitle className="truncate text-sm font-semibold text-copy-primary">
              {selectedSpec?.filename ?? "Spec"}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {selectedSpec && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => downloadSpec(projectId, selectedSpec.id, selectedSpec.filename)}
                  className="h-7 gap-1.5 text-xs text-copy-muted hover:text-copy-primary"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              )}
            </div>
          </DialogHeader>
          <div className="scroll-dark flex-1 min-h-0 overflow-y-auto px-5 py-4">
            {modalLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-copy-muted" />
              </div>
            ) : (
              <div className="prose prose-sm prose-invert max-w-none text-copy-primary [&_h1]:text-copy-primary [&_h2]:text-copy-primary [&_h3]:text-copy-primary [&_p]:text-copy-muted [&_li]:text-copy-muted [&_code]:text-ai-text [&_code]:bg-elevated [&_code]:px-1 [&_code]:rounded [&_pre]:bg-elevated [&_pre]:border [&_pre]:border-surface-border [&_pre]:rounded-xl [&_a]:text-brand [&_strong]:text-copy-primary [&_hr]:border-surface-border">
                <ReactMarkdown>{modalContent ?? ""}</ReactMarkdown>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface AISidebarProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
}

export function AISidebar({ isOpen, onClose, projectId }: AISidebarProps) {
  return (
    <aside
      aria-hidden={!isOpen}
      inert={!isOpen || undefined}
      className={`fixed bottom-0 right-0 top-12 z-40 flex w-80 flex-col border-l border-surface-border bg-surface/95 shadow-xl transition-transform duration-200 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="flex shrink-0 items-start justify-between border-b border-surface-border px-4 py-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-subtle">
            <Bot className="h-4 w-4 text-ai-text" />
          </div>
          <div>
            <p className="text-sm font-semibold text-copy-primary">AI Workspace</p>
            <p className="text-xs text-copy-muted">Collaborate with Ghost AI</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close AI sidebar"
          className="h-7 w-7 shrink-0 text-copy-muted hover:text-copy-primary"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="architect" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="h-9 shrink-0 rounded-none border-b border-surface-border bg-transparent px-3 gap-1 justify-start">
          <TabsTrigger
            value="architect"
            className="rounded-lg px-3 py-1 text-xs text-copy-muted data-[state=active]:bg-subtle data-[state=active]:text-brand data-[state=active]:shadow-none"
          >
            AI Architect
          </TabsTrigger>
          <TabsTrigger
            value="specs"
            className="rounded-lg px-3 py-1 text-xs text-copy-muted data-[state=active]:bg-subtle data-[state=active]:text-brand data-[state=active]:shadow-none"
          >
            Specs
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="rounded-lg px-3 py-1 text-xs text-copy-muted data-[state=active]:bg-subtle data-[state=active]:text-brand data-[state=active]:shadow-none"
          >
            Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="architect" className="flex flex-1 flex-col overflow-hidden m-0 data-[state=inactive]:hidden">
          <AIArchitectTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="specs" className="flex flex-1 flex-col overflow-hidden m-0 data-[state=inactive]:hidden">
          <SpecsTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="chat" className="flex flex-1 flex-col overflow-hidden m-0 data-[state=inactive]:hidden">
          <ChatTab />
        </TabsContent>
      </Tabs>
    </aside>
  )
}
