import Link from "next/link"
import { Lock } from "lucide-react"

export function AccessDenied() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-base">
      <Lock className="h-8 w-8 text-copy-muted" />
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-lg font-semibold text-copy-primary">
          Access Denied
        </h1>
        <p className="text-sm text-copy-muted">
          This project doesn&apos;t exist or you don&apos;t have permission to view it.
        </p>
      </div>
      <Link
        href="/editor"
        className="text-sm text-brand hover:underline"
      >
        Back to projects
      </Link>
    </div>
  )
}
