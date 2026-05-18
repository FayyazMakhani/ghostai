import { clerkClient } from "@clerk/nextjs/server"

export interface ClerkUserInfo {
  name: string | null
  imageUrl: string | null
}

export async function enrichEmailsWithClerk(
  emails: string[]
): Promise<Map<string, ClerkUserInfo>> {
  if (emails.length === 0) return new Map()

  const client = await clerkClient()
  const PAGE = 100
  let offset = 0
  const allUsers = []

  while (true) {
    const { data: users } = await client.users.getUserList({
      emailAddress: emails,
      limit: PAGE,
      offset,
    })
    allUsers.push(...users)
    if (users.length < PAGE) break
    offset += PAGE
  }

  const result = new Map<string, ClerkUserInfo>()
  for (const user of allUsers) {
    const email = user.primaryEmailAddress?.emailAddress
    if (!email) continue
    result.set(email, {
      name: user.fullName ?? user.firstName ?? null,
      imageUrl: user.imageUrl || null,
    })
  }

  return result
}
