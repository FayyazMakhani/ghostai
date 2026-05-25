import type { NodeShape } from "@/types/canvas"

interface SvgShapeProps {
  bg: string
  border: string
}

export function DiamondSVG({ bg, border }: SvgShapeProps) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0"
      overflow="visible"
    >
      <polygon
        points="50,0 100,50 50,100 0,50"
        fill={bg}
        stroke={border}
        strokeWidth="1.5"
      />
    </svg>
  )
}

export function HexagonSVG({ bg, border }: SvgShapeProps) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0"
      overflow="visible"
    >
      <polygon
        points="25,0 75,0 100,50 75,100 25,100 0,50"
        fill={bg}
        stroke={border}
        strokeWidth="1.5"
      />
    </svg>
  )
}

export function CylinderSVG({ bg, border }: SvgShapeProps) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0"
    >
      <rect x="1" y="10" width="98" height="80" fill={bg} stroke="none" />
      <line x1="1" y1="10" x2="1" y2="90" stroke={border} strokeWidth="1.5" />
      <line x1="99" y1="10" x2="99" y2="90" stroke={border} strokeWidth="1.5" />
      <ellipse cx="50" cy="90" rx="49" ry="10" fill={bg} stroke={border} strokeWidth="1.5" />
      <ellipse cx="50" cy="10" rx="49" ry="10" fill={bg} stroke={border} strokeWidth="1.5" />
    </svg>
  )
}

interface ShapeRendererProps {
  shape: NodeShape
  bg: string
  border: string
}

export function ShapeRenderer({ shape, bg, border }: ShapeRendererProps) {
  if (shape === "rectangle") {
    return (
      <div
        className="h-full w-full rounded-xl"
        style={{ background: bg, border: `1.5px solid ${border}` }}
      />
    )
  }
  if (shape === "pill" || shape === "circle") {
    return (
      <div
        className="h-full w-full rounded-full"
        style={{ background: bg, border: `1.5px solid ${border}` }}
      />
    )
  }
  return (
    <div className="relative h-full w-full">
      {shape === "diamond" && <DiamondSVG bg={bg} border={border} />}
      {shape === "hexagon" && <HexagonSVG bg={bg} border={border} />}
      {shape === "cylinder" && <CylinderSVG bg={bg} border={border} />}
    </div>
  )
}
