import { auth, currentUser } from "@clerk/nextjs/server";
import { getLiveblocks, getUserColor } from "@/lib/liveblocks";
import { canAccessProject } from "@/lib/project-access";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await currentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let room: string;
  try {
    const body = await request.json();
    room = typeof body?.room === "string" ? body.room : "";
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  if (!room) {
    return new Response("Bad Request", { status: 400 });
  }

  const email = user.primaryEmailAddress?.emailAddress ?? null;
  const hasAccess = await canAccessProject(room, userId, email);
  if (!hasAccess) {
    return new Response("Forbidden", { status: 403 });
  }

  const lb = getLiveblocks();

  await lb.getOrCreateRoom(room, { defaultAccesses: [] });

  const name =
    user.fullName ?? user.firstName ?? user.username ?? email ?? "Anonymous";
  const avatar = user.imageUrl;
  const color = getUserColor(userId);

  const session = lb.prepareSession(userId, {
    userInfo: { name, avatar, color },
  });
  session.allow(room, session.FULL_ACCESS);

  const { status, body } = await session.authorize();
  return new Response(body, { status });
}
