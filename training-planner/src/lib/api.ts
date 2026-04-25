const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
}

// Domain-Typen
export interface Player {
  id: string
  first_name: string
  last_name: string
  position: string | null
  jersey_number: number | null
  active: boolean
  injured: boolean
  injury_until: string | null
  skills: Record<string, number>
}

export interface SkillCategory {
  id: string
  name: string
  description: string | null
}

export interface Training {
  id: string
  scheduled_at: string
  location: string | null
  duration_minutes: number
  intensity: 'locker' | 'mittel' | 'intensiv'
  applied: boolean
}

export interface AttendanceEntry {
  player_id: string
  first_name: string
  last_name: string
  status: 'zu' | 'ab' | 'unklar' | 'verletzt'
}

export interface Exercise {
  id: string
  name: string
  description: string | null
  min_players: number
  max_players: number
  duration_minutes: number
  intensity: 'locker' | 'mittel' | 'intensiv'
  skill_tags: string[]
}

export interface PlanItem {
  exercise_id: string
  name: string
  duration_minutes: number
  intensity: string
  skills: string[]
  addresses_weakness: string[]
}

export interface SuggestedPlan {
  status: string
  training_id?: string
  n_players?: number
  weak_skills?: { id: string; name: string; avg: number }[]
  total_minutes?: number
  items: PlanItem[]
}
