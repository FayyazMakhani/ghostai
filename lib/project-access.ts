import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "./prisma"

export interface Identity {
  userId: string
  email: string | null
}

export async function getCurrentIdentity(): Promise<Identity | null> {
  const user = await currentUser()
  if (!user) return null
  return {
    userId: user.id,
    email: user.primaryEmailAddress?.emailAddress ?? null,
  }
}

export async function canAccessProject(
  projectId: string,
  userId: string,
  email: string | null
): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  })
  if (!project) return false
  if (project.ownerId === userId) return true
  if (!email) return false

  const collaboration = await prisma.projectCollaborator.findFirst({
    where: { projectId, email },
  })
  return collaboration !== null
}
