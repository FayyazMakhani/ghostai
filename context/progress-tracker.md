# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 07: Wire Editor Home — Complete

## Current Goal

- Define the immediate implementation goal here.

## Completed

- **01-design-system**: shadcn/ui initialized (Nova preset, Tailwind v4), all UI primitives added (Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea), lucide-react installed, `lib/utils.ts` with `cn()` created, `globals.css` updated with dark-only theme and project color tokens.
- **02-editor-chrome**: `components/editor/editor-navbar.tsx` — fixed-height top navbar (h-12, z-50) with left/center/right sections; sidebar toggle uses `PanelLeftOpen`/`PanelLeftClose` icons driven by `isSidebarOpen` prop. `components/editor/project-sidebar.tsx` — fixed overlay sidebar (w-72, z-40, top-12) that slides in from the left without pushing content; `isOpen`/`onClose` props; Projects header with close button; Tabs (My Projects, Shared) with empty placeholder states; full-width New Project button with Plus icon. Dialog pattern is satisfied by the existing shadcn Dialog component which already uses project color tokens via CSS variable mappings in `globals.css`.
- **03-auth**: Clerk wired into the app. `proxy.ts` at project root uses `clerkMiddleware` + `createRouteMatcher` to protect all routes except `/sign-in` and `/sign-up` (defined via `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL` env vars). `ClerkProvider` wraps root layout with `dark` theme from `@clerk/ui/themes` and CSS variable overrides — no hardcoded colors. `app/sign-in/[[...sign-in]]/page.tsx` and `app/sign-up/[[...sign-up]]/page.tsx` use a two-panel layout (left: logo + tagline + feature list on lg+; right: Clerk form) with no gradients or hero sections. `app/page.tsx` redirects authenticated users to `/editor` and unauthenticated users to `/sign-in`. `app/editor/page.tsx` created as the editor workspace shell. `UserButton` added to the editor navbar right section.
- **04-project-dialogs**: `hooks/use-project-dialogs.ts` manages dialog kind (`create` | `rename` | `delete` | null), target project, form input, slug derivation, and mock project list (add/rename/delete in local state). `components/editor/project-dialogs.tsx` renders four controlled dialogs — Create (name input + live `ghostai.app/{slug}` URL preview, Enter submits), Rename (pre-filled input, `onFocus` selects all text for overtype, Enter submits, live URL preview), Delete step 1 (first confirmation: Cancel auto-focused so Enter never deletes, Delete project button advances to step 2), Delete step 2 (final confirmation: "Are you absolutely sure?", Cancel auto-focused, "Yes, delete forever" executes deletion; both close paths reset `deleteStep` to 1). All dialog titles use `text-lg font-semibold text-copy-primary`; inputs use explicit `text-copy-primary`. `components/editor/project-sidebar.tsx` updated with project list rendering: owned projects show rename/delete action buttons on hover; shared projects show no actions; mobile backdrop scrim (hidden on md+) closes sidebar on tap. `app/editor/page.tsx` updated with centered editor home (heading + description + New Project button) wired to Create dialog; all sidebar actions wired through the hook.
- **05-prisma**: `prisma/models/project.prisma` — `ProjectStatus` enum (`DRAFT`, `ARCHIVED`); `Project` model with ownerId (Clerk user), name, optional description, status, optional canvasJsonPath, timestamps, indexes on ownerId and createdAt; `ProjectCollaborator` model with composite PK `[projectId, email]` (enforces unique constraint), cascade-delete relation to Project, email, createdAt, indexes on email and `[projectId, createdAt]`. `lib/prisma.ts` — cached singleton using `globalThis`; branches on `DATABASE_URL`: `prisma+postgres://` → `new PrismaClient({ accelerateUrl })`, otherwise → `PrismaPg({ connectionString })` adapter. Migration `20260517075135_init` applied; client generated to `app/generated/prisma/`. Imports use `@/app/generated/prisma/client` (Prisma 7 custom output path).
- **06-project-apis**: `app/api/projects/route.ts` — `GET` returns all projects owned by the authenticated user ordered by `createdAt` desc; `POST` creates a project with name defaulting to `"Untitled Project"` if absent. `app/api/projects/[projectId]/route.ts` — `PATCH` renames project (requires non-empty `name` body field); `DELETE` removes project; both verify ownership and return `403` for non-owners. All four handlers return `401` for unauthenticated requests. Auth via `auth()` from `@clerk/nextjs/server`.
- **07-wire-editor-home**: `lib/projects.ts` — `getOwnedProjects()` fetches by `ownerId`; `getSharedProjects()` fetches via `ProjectCollaborator` by primary email using `currentUser()`. `POST /api/projects` updated to accept optional custom `id` (validated `[a-z0-9-]+`, max 100 chars). `hooks/use-project-actions.ts` — manages create/rename/delete dialog state; create slugifies name + generates 5-char random suffix as `roomId`, POSTs with custom `id`, navigates to `/editor/[id]`; rename PATCHes and refreshes; delete DELETEs and redirects to `/editor` if deleting active workspace or refreshes otherwise. `app/editor/page.tsx` — converted to server component; fetches owned and shared projects in parallel and passes to `EditorHome`. `components/editor/editor-home.tsx` — new client shell with sidebar state and dialog wiring. `components/editor/project-sidebar.tsx` and `project-dialogs.tsx` — updated to use `ProjectSummary` from `lib/projects`; sidebar receives separate `ownedProjects`/`sharedProjects` arrays; create dialog shows full `roomId` preview; rename dialog shows slug preview.

## In Progress

- None yet.

## Next Up

- Add the next planned feature unit here.


## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Prisma 7 uses `prisma.config.ts` (not schema-embedded `url`) for datasource config; `prisma/` directory is the multi-file schema root.
- Prisma 7 generates client to `app/generated/prisma/`; import as `@/app/generated/prisma/client`, not `@prisma/client`.
- `PrismaClientOptions` in Prisma 7: `{ adapter }` for direct PG, `{ accelerateUrl }` for Accelerate — mutually exclusive union.
- shadcn/ui on Tailwind v4 — CSS variables defined in `globals.css` via `@theme inline`; no `tailwind.config.js` needed.
- Dark-only theme: project custom properties (`--bg-base`, `--text-primary`, etc.) defined once in `:root` with no `.dark` override. shadcn semantic variables (`--background`, `--foreground`, etc.) are mapped to project variables.
- Tailwind utilities for project tokens: `bg-base`, `bg-surface`, `bg-elevated`, `bg-subtle`, `text-copy-primary`, `text-copy-muted`, `border-surface-border`, `text-brand`, `bg-accent-dim`, `text-ai`, `text-ai-text`, `text-error`, `text-success`, `text-warning`.
- Auth uses `proxy.ts` (Next.js 16's renamed middleware convention) — not `middleware.ts`. Export name is `proxy`, not `middleware`.
- Clerk appearance: `dark` theme from `@clerk/ui/themes` passed as `theme` key in `appearance`; CSS variables used for all color overrides via `variables` key.

## Session Notes

- Project uses Next.js 16.2.6, React 19, Tailwind v4 (`@import "tailwindcss"`), TypeScript strict mode.
- Path alias `@/*` maps to project root.
- `components/ui/*` files are generated by shadcn — do not modify them directly.
- shadcn component library: `base-nova` style (uses `@base-ui/react` primitives + Lucide icons).
- Next.js 16 renames `middleware.ts` to `proxy.ts` and the exported function from `middleware` to `proxy`.
- `@clerk/ui` installed; provides `dark`, `neobrutalism`, `shadcn`, `shadesOfPurple` themes.
