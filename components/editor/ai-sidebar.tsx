"use client"

import { useState, useRef, useEffect, KeyboardEvent } from "react"
import { Bot, X, FileText, Download, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

const STARTER_CHIPS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
]

function AIArchitectTab() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function adjustTextareaHeight() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "72px"
    el.style.height = Math.min(el.scrollHeight, 160) + "px"
  }

  function handleSend() {
    const text = input.trim()
    if (!text) return
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    if (textareaRef.current) textareaRef.current.style.height = "72px"
  }

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
            {messages.map((msg) =>
              msg.role === "user" ? (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl bg-accent-dim border-2 border-brand/50 px-3 py-2 text-sm text-copy-primary whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex justify-start">
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

function SpecsTab() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-3">
      <Button className="w-full bg-brand text-base hover:bg-brand/90">
        <FileText className="h-4 w-4" />
        Generate Spec
      </Button>

      {/* Demo spec card */}
      <div className="rounded-2xl border border-surface-border bg-elevated p-3">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-subtle">
            <FileText className="h-4 w-4 text-ai-text" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-copy-primary truncate">Microservices Architecture</p>
            <p className="mt-0.5 text-xs text-copy-muted line-clamp-2">
              API gateway with auth, user, and order services backed by isolated databases and an async notification layer.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-copy-faint">spec_v1.md</span>
              <button
                disabled
                className="ml-auto flex items-center gap-1 text-xs text-copy-faint cursor-not-allowed opacity-40"
              >
                <Download className="h-3 w-3" />
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface AISidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function AISidebar({ isOpen, onClose }: AISidebarProps) {
  return (
    <aside
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
        </TabsList>

        <TabsContent value="architect" className="flex flex-1 flex-col overflow-hidden m-0 data-[state=inactive]:hidden">
          <AIArchitectTab />
        </TabsContent>

        <TabsContent value="specs" className="flex flex-1 flex-col overflow-hidden m-0 data-[state=inactive]:hidden">
          <SpecsTab />
        </TabsContent>
      </Tabs>
    </aside>
  )
}
