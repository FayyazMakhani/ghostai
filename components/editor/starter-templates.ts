import type { CanvasNode, CanvasEdge, NodeShape } from "@/types/canvas"

export interface CanvasTemplate {
  id: string
  name: string
  description: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

function n(
  id: string,
  label: string,
  x: number,
  y: number,
  color: string,
  shape: NodeShape = "rectangle",
  width = 140,
  height = 60,
): CanvasNode {
  return {
    id,
    type: "canvasNode",
    position: { x, y },
    data: { label, color, shape },
    width,
    height,
  }
}

function e(id: string, source: string, target: string, label?: string): CanvasEdge {
  return {
    id,
    source,
    target,
    type: "canvasEdge",
    data: label ? { label } : {},
  }
}

// ── Microservices Architecture ─────────────────────────────────────────────

const microservicesNodes: CanvasNode[] = [
  n("ms-gw",     "API Gateway",            300,   0, "#10233D", "pill",      160, 56),
  n("ms-auth",   "Auth Service",            40, 130, "#2E1938", "rectangle", 140, 60),
  n("ms-user",   "User Service",           240, 130, "#0F2E18", "rectangle", 140, 60),
  n("ms-order",  "Order Service",          440, 130, "#331B00", "rectangle", 140, 60),
  n("ms-notify", "Notification Service",   460, 260, "#3C1618", "rectangle", 160, 60),
  n("ms-db",     "Database",              220, 260, "#062822", "cylinder",  120, 80),
]

const microservicesEdges: CanvasEdge[] = [
  e("me-1", "ms-gw",    "ms-auth"),
  e("me-2", "ms-gw",    "ms-user"),
  e("me-3", "ms-gw",    "ms-order"),
  e("me-4", "ms-user",  "ms-db"),
  e("me-5", "ms-order", "ms-db"),
  e("me-6", "ms-order", "ms-notify"),
]

// ── CI/CD Pipeline ─────────────────────────────────────────────────────────

const cicdNodes: CanvasNode[] = [
  n("ci-repo",    "Source Repo",       0,  40, "#10233D", "cylinder",  120, 80),
  n("ci-build",   "Build",           180,  60, "#0F2E18", "rectangle", 120, 60),
  n("ci-test",    "Test",            360,  60, "#331B00", "rectangle", 120, 60),
  n("ci-staging", "Staging Deploy",  540,  60, "#2E1938", "rectangle", 150, 60),
  n("ci-int",     "Integration Tests", 720, 0, "#3A1726", "rectangle", 155, 60),
  n("ci-prod",    "Production",       900,  0, "#062822", "hexagon",   130, 130),
]

const cicdEdges: CanvasEdge[] = [
  e("ce-1", "ci-repo",    "ci-build"),
  e("ce-2", "ci-build",   "ci-test"),
  e("ce-3", "ci-test",    "ci-staging"),
  e("ce-4", "ci-staging", "ci-int"),
  e("ce-5", "ci-int",     "ci-prod"),
]

// ── Event-Driven System ────────────────────────────────────────────────────

const eventDrivenNodes: CanvasNode[] = [
  n("ev-prod",  "Producer",           0, 110, "#0F2E18", "pill",      140, 56),
  n("ev-bus",   "Event Bus",        220, 100, "#2E1938", "hexagon",   130, 130),
  n("ev-ca",    "Consumer A",       440,  20, "#10233D", "rectangle", 140, 60),
  n("ev-cb",    "Consumer B",       440, 170, "#331B00", "rectangle", 140, 60),
  n("ev-dlq",   "Dead Letter Queue",660,  90, "#3C1618", "cylinder",  160, 80),
]

const eventDrivenEdges: CanvasEdge[] = [
  e("ee-1", "ev-prod", "ev-bus"),
  e("ee-2", "ev-bus",  "ev-ca"),
  e("ee-3", "ev-bus",  "ev-cb"),
  e("ee-4", "ev-ca",   "ev-dlq", "on error"),
  e("ee-5", "ev-cb",   "ev-dlq", "on error"),
]

// ── Exported templates ─────────────────────────────────────────────────────

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices",
    name: "Microservices Architecture",
    description: "API gateway routing to independent services with a shared database layer.",
    nodes: microservicesNodes,
    edges: microservicesEdges,
  },
  {
    id: "cicd",
    name: "CI/CD Pipeline",
    description: "Source to production workflow with build, test, and staged deployment gates.",
    nodes: cicdNodes,
    edges: cicdEdges,
  },
  {
    id: "event-driven",
    name: "Event-Driven System",
    description: "Producer publishing to an event bus with multiple consumers and a dead letter queue.",
    nodes: eventDrivenNodes,
    edges: eventDrivenEdges,
  },
]
