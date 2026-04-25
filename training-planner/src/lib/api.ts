import { mockApi } from './mockData'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

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

export interface Player {
  id: string
  first_name: string
  last_name: string
  position: 'GK' | 'DEF' | 'MID' | 'ATT' | null
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

export const api = {
  async listPlayers(): Promise<Player[]> {
    return DEMO_MODE ? mockApi.listPlayers() : request('/api/players')
  },
  async createPlayer(body: { first_name: string; last_name: string; position?: string | null; jersey_number?: number | null }): Promise<{ id: string }> {
    return DEMO_MODE ? mockApi.createPlayer(body) : request('/api/players', { method: 'POST', body: JSON.stringify(body) })
  },
  async listTrainings(): Promise<Training[]> {
    return DEMO_MODE ? mockApi.listTrainings() : request('/api/trainings')
  },
  async createTraining(body: { scheduled_at: string; location?: string | null; duration_minutes: number; intensity: Training['intensity'] }): Promise<{ id: string }> {
    return DEMO_MODE ? mockApi.createTraining(body) : request('/api/trainings', { method: 'POST', body: JSON.stringify(body) })
  },
  async getAttendance(trainingId: string): Promise<AttendanceEntry[]> {
    return DEMO_MODE ? mockApi.getAttendance(trainingId) : request(`/api/trainings/${trainingId}/attendance`)
  },
  async setAttendance(trainingId: string, playerId: string, status: AttendanceEntry['status']): Promise<{ ok: true }> {
    return DEMO_MODE
      ? mockApi.setAttendance(trainingId, playerId, status)
      : request(`/api/trainings/${trainingId}/attendance`, {
          method: 'POST', body: JSON.stringify({ player_id: playerId, status }),
        })
  },
  async listExercises(): Promise<Exercise[]> {
    return DEMO_MODE ? mockApi.listExercises() : request('/api/exercises')
  },
  async createExercise(body: Exercise): Promise<{ id: string }> {
    return DEMO_MODE ? mockApi.createExercise(body) : request('/api/exercises', { method: 'POST', body: JSON.stringify(body) })
  },
  async listSkillCategories(): Promise<SkillCategory[]> {
    return DEMO_MODE ? mockApi.listSkillCategories() : request('/api/skill-categories')
  },
  async suggestedPlan(trainingId: string, target = 75): Promise<SuggestedPlan> {
    return DEMO_MODE
      ? mockApi.suggestedPlan(trainingId, target)
      : request(`/api/trainings/${trainingId}/suggested-plan?target_minutes=${target}`)
  },
  async applySkills(trainingId: string): Promise<{ status: string; updates?: number }> {
    return DEMO_MODE
      ? mockApi.applySkills(trainingId)
      : request(`/api/trainings/${trainingId}/apply-skills`, { method: 'POST', body: '{}' })
  },
  async activeReviewWindow(): Promise<null | { id: string; label: string; starts_at: string; ends_at: string; status: string }> {
    return DEMO_MODE ? mockApi.activeReviewWindow() : request('/api/peer-reviews/active')
  },
  async submitReview(body: { rater_id: string; ratee_id: string; category_id: string; rating: number }): Promise<{ ok: boolean }> {
    return DEMO_MODE ? mockApi.submitReview() : request('/api/peer-reviews', { method: 'POST', body: JSON.stringify(body) })
  },
  resetDemo() {
    if (DEMO_MODE) mockApi.reset()
  },
}
