"use client"

import type { GlyphUI } from "@/lib/services/glyph-service"
import { UserCard } from "@/components/user-card"

interface UserGridProps {
  users: GlyphUI[]
  onUserSelect: (user: GlyphUI) => void
}

export function UserGrid({ users, onUserSelect }: UserGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {users.map((user) => (
        <UserCard key={user.id} user={user} onClick={() => onUserSelect(user)} />
      ))}
    </div>
  )
}
