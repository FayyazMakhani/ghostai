import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <main className="flex min-h-screen bg-base">
      {/* Left panel — large screens only */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 bg-surface border-r border-surface-border">
        <div className="max-w-sm">
          <p className="text-2xl font-bold text-copy-primary tracking-tight mb-2">
            Ghost AI
          </p>
          <p className="text-sm text-copy-muted mb-8 leading-relaxed">
            Collaborative system design, powered by AI.
          </p>
          <ul className="space-y-3 text-sm text-copy-secondary leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />
              Describe your system in plain English
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />
              AI maps it onto a shared canvas
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />
              Collaborate in real time with your team
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />
              Generate a technical spec from the final graph
            </li>
          </ul>
        </div>
      </div>

      {/* Right panel — Clerk form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <SignIn forceRedirectUrl="/editor" />
      </div>
    </main>
  )
}
