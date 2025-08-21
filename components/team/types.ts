// Team component types
export type Personnel = {
  id: number
  name: string
  email: string
  position?: string
  phone?: string
  avatar_url?: string
  created_at?: string
  updated_at?: string
}

export type TeamStats = {
  totalMembers: number
  activeProjects: number
}

export type TeamProps = Record<string, never>
