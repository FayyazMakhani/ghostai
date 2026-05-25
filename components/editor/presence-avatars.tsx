"use client"

import { useOthers } from "@liveblocks/react/suspense"
import { useUser } from "@clerk/nextjs"
import * as Tooltip from "@radix-ui/react-tooltip"

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

interface CollaboratorAvatarProps {
  name: string
  avatar: string
  color: string
  overlap: boolean
}

function CollaboratorAvatar({ name, avatar, color, overlap }: CollaboratorAvatarProps) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div
            className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full flex items-center justify-center text-[10px] font-semibold select-none cursor-default"
            style={{
              marginLeft: overlap ? "-6px" : undefined,
              boxShadow: `0 0 0 2px var(--bg-base), 0 0 0 3.5px ${color}`,
              background: avatar ? undefined : color + "33",
              color: color,
            }}
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt={name} className="h-full w-full object-cover" />
            ) : (
              getInitials(name)
            )}
          </div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            sideOffset={6}
            className="z-50 rounded-xl bg-elevated border border-surface-border px-2.5 py-1 text-xs font-medium text-copy-primary shadow-md animate-in fade-in-0 zoom-in-95"
          >
            {name}
            <Tooltip.Arrow className="fill-elevated" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}

export function PresenceAvatars() {
  const { user } = useUser()
  const others = useOthers()

  // Guard until Clerk loads — if user is null, user?.id is undefined and the
  // filter passes everything, which could flash the current user's own avatar
  // (e.g. when they have multiple tabs open and the old connection is briefly
  // still visible as "other" before the new one is established).
  const collaborators = user
    ? others.filter((other) => other.id !== user.id)
    : []
  const visible = collaborators.slice(0, 5)
  const overflow = collaborators.length - 5

  if (collaborators.length === 0) return null

  return (
    <div className="flex items-center rounded-xl border border-surface-border bg-surface/80 px-2 py-1 backdrop-blur-sm">
      <div className="flex items-center">
        {visible.map((other, index) => (
          <CollaboratorAvatar
            key={other.connectionId}
            name={other.info.name}
            avatar={other.info.avatar}
            color={other.info.color}
            overlap={index > 0}
          />
        ))}
        {overflow > 0 && (
          <div
            className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-elevated text-[10px] font-medium text-copy-muted"
            style={{
              marginLeft: "-6px",
              boxShadow: "0 0 0 2px var(--bg-base)",
            }}
          >
            +{overflow}
          </div>
        )}
      </div>
    </div>
  )
}
