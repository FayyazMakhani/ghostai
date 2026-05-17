import { prisma } from "@/lib/prisma"
import { getCurrentIdentity } from "@/lib/project-access"
import { enrichEmailsWithClerk } from "@/lib/clerk-users"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const identity = await getCurrentIdentity()
  if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId } = await params

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { collaborators: { orderBy: { createdAt: "asc" } } },
  })

  if (!project) return Response.json({ error: "Not found" }, { status: 404 })

  const isOwner = project.ownerId === identity.userId
  const isCollaborator = identity.email
    ? project.collaborators.some((c) => c.email === identity.email)
    : false

  if (!isOwner && !isCollaborator) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const emails = project.collaborators.map((c) => c.email)
  const clerkData = await enrichEmailsWithClerk(emails)

  const collaborators = project.collaborators.map((c) => ({
    email: c.email,
    name: clerkData.get(c.email)?.name ?? null,
    imageUrl: clerkData.get(c.email)?.imageUrl ?? null,
  }))

  return Response.json({ collaborators, isOwner })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const identity = await getCurrentIdentity()
  if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId } = await params
  const body = await request.json().catch(() => ({}))

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  if (!email || !email.includes("@")) {
    return Response.json({ error: "Valid email required" }, { status: 400 })
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  })

  if (!project) return Response.json({ error: "Not found" }, { status: 404 })
  if (project.ownerId !== identity.userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  if (identity.email && email === identity.email) {
    return Response.json({ error: "Cannot add yourself as collaborator" }, { status: 400 })
  }

  try {
    await prisma.projectCollaborator.create({ data: { projectId, email } })
  } catch {
    return Response.json({ error: "Already a collaborator" }, { status: 409 })
  }

  const clerkData = await enrichEmailsWithClerk([email])

  return Response.json(
    {
      email,
      name: clerkData.get(email)?.name ?? null,
      imageUrl: clerkData.get(email)?.imageUrl ?? null,
    },
    { status: 201 }
  )
}
