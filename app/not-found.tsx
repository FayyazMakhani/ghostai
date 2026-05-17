import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-base">
      <p className="font-mono text-4xl font-semibold text-copy-primary">404</p>
      <p className="text-sm text-copy-muted">This page could not be found.</p>
      <Link href="/editor" className="text-sm text-brand hover:underline">
        Go to editor
      </Link>
    </div>
  )
}
