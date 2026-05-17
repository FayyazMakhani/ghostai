import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"
import { getCurrentIdentity, canAccessProject } from "@/lib/project-access"
import { getOwnedProjects, getSharedProjects } from "@/lib/projects"
import { AccessDenied } from "@/components/editor/access-denied"
import { WorkspaceShell } from "@/components/editor/workspace-shell"

export default async function EditorRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>
}) {
  const { roomId } = await params

  const identity = await getCurrentIdentity()
  if (!identity) {
    redirect("/sign-in")
  }

  const [project, hasAccess, ownedProjects, sharedProjects] = await Promise.all([
    prisma.project.findUnique({
      where: { id: roomId },
      select: { id: true, name: true, ownerId: true },
    }),
    canAccessProject(roomId, identity.userId, identity.email),
    getOwnedProjects(),
    getSharedProjects(),
  ])

  if (!project || !hasAccess) {
    return <AccessDenied />
  }

  return (
    <WorkspaceShell
      projectId={project.id}
      projectName={project.name}
      isOwner={project.ownerId === identity.userId}
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    />
  )
}
