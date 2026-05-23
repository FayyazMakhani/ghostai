"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { CANVAS_TEMPLATES, type CanvasTemplate } from "./starter-templates"
import type { CanvasNode, CanvasEdge } from "@/types/canvas"

// ── Diagram preview ────────────────────────────────────────────────────────

const PREVIEW_W = 260
const PREVIEW_H = 130
const PREVIEW_PAD = 10

function TemplatePreview({ nodes, edges }: { nodes: CanvasNode[]; edges: CanvasEdge[] }) {
  if (nodes.length === 0) return null

  // Compute bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const node of nodes) {
    const w = node.width ?? 120
    const h = node.height ?? 60
    minX = Math.min(minX, node.position.x)
    minY = Math.min(minY, node.position.y)
    maxX = Math.max(maxX, node.position.x + w)
    maxY = Math.max(maxY, node.position.y + h)
  }

  const bw = maxX - minX || 1
  const bh = maxY - minY || 1
  const inner = { w: PREVIEW_W - PREVIEW_PAD * 2, h: PREVIEW_H - PREVIEW_PAD * 2 }
  const scale = Math.min(inner.w / bw, inner.h / bh)
  const scaledW = bw * scale
  const scaledH = bh * scale
  const offX = PREVIEW_PAD + (inner.w - scaledW) / 2 - minX * scale
  const offY = PREVIEW_PAD + (inner.h - scaledH) / 2 - minY * scale

  function toSvg(x: number, y: number) {
    return { x: x * scale + offX, y: y * scale + offY }
  }

  // Compute node centers for edge drawing
  const centers: Record<string, { x: number; y: number }> = {}
  for (const node of nodes) {
    const w = node.width ?? 120
    const h = node.height ?? 60
    const c = toSvg(node.position.x + w / 2, node.position.y + h / 2)
    centers[node.id] = c
  }

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${PREVIEW_W} ${PREVIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block" }}
    >
      {edges.map((edge) => {
        const s = centers[edge.source]
        const t = centers[edge.target]
        if (!s || !t) return null
        return (
          <line
            key={edge.id}
            x1={s.x} y1={s.y}
            x2={t.x} y2={t.y}
            stroke="rgba(248,250,252,0.25)"
            strokeWidth={1}
          />
        )
      })}

      {nodes.map((node) => {
        const w = (node.width ?? 120) * scale
        const h = (node.height ?? 60) * scale
        const pos = toSvg(node.position.x, node.position.y)
        const cx = pos.x + w / 2
        const cy = pos.y + h / 2
        const fill = node.data.color ?? "#1F1F1F"
        const stroke = "#3a3a42"
        const sw = 0.5
        const shape = node.data.shape ?? "rectangle"

        if (shape === "circle") {
          const r = Math.min(w, h) / 2
          return <circle key={node.id} cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={sw} />
        }

        if (shape === "diamond") {
          const pts = `${cx},${pos.y} ${pos.x + w},${cy} ${cx},${pos.y + h} ${pos.x},${cy}`
          return <polygon key={node.id} points={pts} fill={fill} stroke={stroke} strokeWidth={sw} />
        }

        if (shape === "hexagon") {
          const rx = w / 2, ry = h / 2
          const pts = [
            `${cx},${cy - ry}`,
            `${cx + rx},${cy - ry / 2}`,
            `${cx + rx},${cy + ry / 2}`,
            `${cx},${cy + ry}`,
            `${cx - rx},${cy + ry / 2}`,
            `${cx - rx},${cy - ry / 2}`,
          ].join(" ")
          return <polygon key={node.id} points={pts} fill={fill} stroke={stroke} strokeWidth={sw} />
        }

        if (shape === "cylinder") {
          const ery = h * 0.2
          return (
            <g key={node.id}>
              <rect x={pos.x} y={pos.y + ery} width={w} height={h - 2 * ery} fill={fill} stroke={stroke} strokeWidth={sw} />
              <ellipse cx={cx} cy={pos.y + h - ery} rx={w / 2} ry={ery} fill={fill} stroke={stroke} strokeWidth={sw} />
              <ellipse cx={cx} cy={pos.y + ery} rx={w / 2} ry={ery} fill={fill} stroke={stroke} strokeWidth={sw} />
            </g>
          )
        }

        const rx = shape === "pill" ? Math.min(h / 2, 999) : 2
        return (
          <rect
            key={node.id}
            x={pos.x} y={pos.y}
            width={w} height={h}
            rx={rx} ry={rx}
            fill={fill} stroke={stroke} strokeWidth={sw}
          />
        )
      })}
    </svg>
  )
}

// ── Modal ──────────────────────────────────────────────────────────────────

interface StarterTemplatesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (template: CanvasTemplate) => void
}

export function StarterTemplatesModal({
  open,
  onOpenChange,
  onImport,
}: StarterTemplatesModalProps) {
  function handleImport(template: CanvasTemplate) {
    onImport(template)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-5xl sm:max-w-5xl rounded-3xl border-surface-border bg-surface p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-surface-border">
          <DialogTitle className="text-lg font-semibold text-copy-primary">
            Starter Templates
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
            {CANVAS_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="flex flex-col rounded-2xl border border-surface-border bg-elevated overflow-hidden"
              >
                <div className="bg-base p-3">
                  <div className="w-full" style={{ aspectRatio: `${PREVIEW_W}/${PREVIEW_H}` }}>
                    <TemplatePreview nodes={template.nodes} edges={template.edges} />
                  </div>
                </div>

                <div className="flex flex-col gap-3 p-4">
                  <div>
                    <p className="text-sm font-medium text-copy-primary">{template.name}</p>
                    <p className="mt-1 text-xs text-copy-muted leading-relaxed">
                      {template.description}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleImport(template)}
                  >
                    Import
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
