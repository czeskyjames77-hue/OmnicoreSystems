/**
 * In-Memory Mock-Daten für den Demo-Modus.
 * Aktiviert mit VITE_DEMO_MODE=true. Persistiert in localStorage.
 */
import type {
  AttendanceEntry, Exercise, Player, SkillCategory, SuggestedPlan, Training,
} from './api'

const STORAGE_KEY = 'msv-zossen-demo-v1'

export const SKILL_CATEGORIES: SkillCategory[] = [
  { id: 'passspiel',         name: 'Passspiel',         description: 'Genauigkeit und Vision beim Pass' },
  { id: 'schuss',            name: 'Schuss',            description: 'Abschluss und Schusskraft' },
  { id: 'zweikampf',         name: 'Zweikampf',         description: 'Defensives und offensives Duell' },
  { id: 'kondition',         name: 'Kondition',         description: 'Ausdauer und körperliche Fitness' },
  { id: 'schnelligkeit',     name: 'Schnelligkeit',     description: 'Sprint und Antrittsstärke' },
  { id: 'technik',           name: 'Technik',           description: 'Ballkontrolle und Dribbling' },
  { id: 'kopfball',          name: 'Kopfball',          description: 'Kopfballstärke offensiv und defensiv' },
  { id: 'spielverstaendnis', name: 'Spielverständnis',  description: 'Taktisches Verständnis und Stellungsspiel' },
]

interface DemoState {
  players: Player[]
  trainings: Training[]
  exercises: Exercise[]
  attendance: Record<string, Record<string, AttendanceEntry['status']>>
}

const ALL_SKILL_IDS = SKILL_CATEGORIES.map((s) => s.id)

function rand(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

function makePlayer(first: string, last: string, pos: Player['position'], jersey: number): Player {
  const skills: Record<string, number> = {}
  for (const id of ALL_SKILL_IDS) skills[id] = rand(3.5, 8.0)
  return {
    id: crypto.randomUUID(),
    first_name: first, last_name: last, position: pos, jersey_number: jersey,
    active: true, injured: false, injury_until: null,
    skills,
  }
}

function seed(): DemoState {
  const players = [
    makePlayer('Max', 'Becker', 'GK', 1),
    makePlayer('Tim', 'Krüger', 'DEF', 2),
    makePlayer('Lukas', 'Schmidt', 'DEF', 4),
    makePlayer('Niklas', 'Wagner', 'DEF', 5),
    makePlayer('Jonas', 'Klein', 'DEF', 3),
    makePlayer('Felix', 'Müller', 'MID', 6),
    makePlayer('David', 'Schulz', 'MID', 8),
    makePlayer('Tobias', 'Hoffmann', 'MID', 10),
    makePlayer('Marco', 'Weber', 'ATT', 7),
    makePlayer('Kevin', 'Bauer', 'ATT', 9),
    makePlayer('Patrick', 'Richter', 'ATT', 11),
  ]
  const exercises: Exercise[] = [
    {
      id: crypto.randomUUID(),
      name: 'Rondo 4-gegen-2',
      description: 'Ballbesitz auf engem Raum, schnelle Pässe.',
      min_players: 6, max_players: 8, duration_minutes: 12, intensity: 'mittel',
      skill_tags: ['passspiel', 'technik'],
    },
    {
      id: crypto.randomUUID(),
      name: 'Sprintreihe + Abschluss',
      description: 'Sprint über 20m, Pass annehmen, Torabschluss.',
      min_players: 6, max_players: 16, duration_minutes: 15, intensity: 'intensiv',
      skill_tags: ['schnelligkeit', 'schuss', 'kondition'],
    },
    {
      id: crypto.randomUUID(),
      name: '1-gegen-1 Defensiv',
      description: 'Verteidiger gegen Angreifer im Strafraum, Zweikampfverhalten.',
      min_players: 4, max_players: 14, duration_minutes: 15, intensity: 'mittel',
      skill_tags: ['zweikampf', 'spielverstaendnis'],
    },
    {
      id: crypto.randomUUID(),
      name: 'Spielform 7-gegen-7',
      description: 'Trainingsspiel mit Außenpositionen, Spielaufbau.',
      min_players: 12, max_players: 16, duration_minutes: 25, intensity: 'mittel',
      skill_tags: ['spielverstaendnis', 'passspiel', 'kondition'],
    },
    {
      id: crypto.randomUUID(),
      name: 'Kopfball-Drill mit Flanken',
      description: 'Flanken aus dem Halbraum, Kopfball aufs Tor.',
      min_players: 4, max_players: 12, duration_minutes: 12, intensity: 'mittel',
      skill_tags: ['kopfball', 'schuss'],
    },
  ]
  const trainings: Training[] = [
    {
      id: crypto.randomUUID(),
      scheduled_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
      location: 'Sportplatz Zossen',
      duration_minutes: 90, intensity: 'mittel', applied: false,
    },
  ]
  return { players, trainings, exercises, attendance: {} }
}

function load(): DemoState {
  if (typeof localStorage === 'undefined') return seed()
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const s = seed()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    return s
  }
  try {
    return JSON.parse(raw) as DemoState
  } catch {
    const s = seed()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    return s
  }
}

function save(s: DemoState) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  }
}

const state = load()

export const mockApi = {
  async listPlayers(): Promise<Player[]> { return state.players },
  async createPlayer(body: { first_name: string; last_name: string; position?: string | null; jersey_number?: number | null }): Promise<{ id: string }> {
    const skills: Record<string, number> = {}
    for (const id of ALL_SKILL_IDS) skills[id] = 5.0
    const p: Player = {
      id: crypto.randomUUID(),
      first_name: body.first_name, last_name: body.last_name,
      position: (body.position as Player['position']) ?? null,
      jersey_number: body.jersey_number ?? null,
      active: true, injured: false, injury_until: null, skills,
    }
    state.players.push(p)
    save(state)
    return { id: p.id }
  },
  async listTrainings(): Promise<Training[]> {
    return [...state.trainings].sort((a, b) => +new Date(b.scheduled_at) - +new Date(a.scheduled_at))
  },
  async createTraining(body: { scheduled_at: string; location?: string | null; duration_minutes: number; intensity: Training['intensity'] }): Promise<{ id: string }> {
    const t: Training = {
      id: crypto.randomUUID(),
      scheduled_at: body.scheduled_at,
      location: body.location ?? null,
      duration_minutes: body.duration_minutes,
      intensity: body.intensity,
      applied: false,
    }
    state.trainings.push(t)
    save(state)
    return { id: t.id }
  },
  async getAttendance(trainingId: string): Promise<AttendanceEntry[]> {
    const map = state.attendance[trainingId] || {}
    return state.players.map((p) => ({
      player_id: p.id, first_name: p.first_name, last_name: p.last_name,
      status: map[p.id] || 'unklar',
    }))
  },
  async setAttendance(trainingId: string, playerId: string, status: AttendanceEntry['status']): Promise<{ ok: true }> {
    state.attendance[trainingId] ??= {}
    state.attendance[trainingId][playerId] = status
    save(state)
    return { ok: true }
  },
  async listExercises(): Promise<Exercise[]> { return state.exercises },
  async createExercise(body: Exercise): Promise<{ id: string }> {
    const ex: Exercise = { ...body, id: crypto.randomUUID() }
    state.exercises.push(ex)
    save(state)
    return { id: ex.id }
  },
  async listSkillCategories(): Promise<SkillCategory[]> { return SKILL_CATEGORIES },
  async suggestedPlan(trainingId: string, target = 75): Promise<SuggestedPlan> {
    const att = state.attendance[trainingId] || {}
    const present = state.players.filter((p) => att[p.id] === 'zu')
    if (present.length === 0) return { status: 'no_attendees', items: [] }
    const skillAvg: Record<string, number> = {}
    for (const id of ALL_SKILL_IDS) {
      const vals = present.map((p) => p.skills[id] ?? 5)
      skillAvg[id] = vals.reduce((a, b) => a + b, 0) / vals.length
    }
    const weakIds = Object.entries(skillAvg)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3)
      .map(([id]) => id)
    const candidates = state.exercises
      .filter((e) => e.min_players <= present.length && e.max_players >= present.length)
      .filter((e) => e.skill_tags.some((t) => weakIds.includes(t)))
    const chosen = []
    let total = 0
    const used = new Set<string>()
    for (const c of candidates) {
      if (total >= target) break
      const newSkills = c.skill_tags.filter((t) => weakIds.includes(t) && !used.has(t))
      chosen.push({
        exercise_id: c.id, name: c.name,
        duration_minutes: c.duration_minutes, intensity: c.intensity,
        skills: c.skill_tags, addresses_weakness: newSkills,
      })
      total += c.duration_minutes
      c.skill_tags.forEach((t) => used.add(t))
    }
    return {
      status: 'ok', training_id: trainingId, n_players: present.length,
      total_minutes: total,
      weak_skills: weakIds.map((id) => ({
        id, name: SKILL_CATEGORIES.find((s) => s.id === id)!.name, avg: skillAvg[id],
      })),
      items: chosen,
    }
  },
  async applySkills(trainingId: string): Promise<{ status: string; updates: number }> {
    const training = state.trainings.find((t) => t.id === trainingId)
    if (!training) return { status: 'not_found', updates: 0 }
    if (training.applied) return { status: 'already_applied', updates: 0 }
    const att = state.attendance[trainingId] || {}
    const base = { locker: 0.005, mittel: 0.01, intensiv: 0.015 }[training.intensity]
    let updates = 0
    for (const p of state.players) {
      const status = att[p.id] || 'unklar'
      if (status === 'zu') {
        for (const id of ALL_SKILL_IDS) {
          const cur = p.skills[id] ?? 5
          p.skills[id] = Math.min(10, Math.round(cur * (1 + base) * 100) / 100)
          updates++
        }
      } else if (status === 'ab') {
        for (const id of ALL_SKILL_IDS) {
          const cur = p.skills[id] ?? 5
          p.skills[id] = Math.max(1, Math.round(cur * 0.997 * 100) / 100)
          updates++
        }
      }
    }
    training.applied = true
    save(state)
    return { status: 'ok', updates }
  },
  async activeReviewWindow() {
    return null
  },
  async submitReview() { return { ok: true } },
  reset() {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY)
    location.reload()
  },
}
