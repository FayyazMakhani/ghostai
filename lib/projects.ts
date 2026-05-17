import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "./prisma"

export interface ProjectSummary {
  id: string
  name: string
}

export async function getOwnedProjects(): Promise<ProjectSummary[]> {
  const { userId } = await auth()
  if (!userId) return []

  return prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  })
}

export async function getSharedProjects(): Promise<ProjectSummary[]> {
  const user = await currentUser()
  if (!user) return []

  const email = user.primaryEmailAddress?.emailAddress
  if (!email) return []

  const collaborations = await prisma.projectCollaborator.findMany({
    where: { email },
    include: { project: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  })

  return collaborations.map((c) => c.project)
}
