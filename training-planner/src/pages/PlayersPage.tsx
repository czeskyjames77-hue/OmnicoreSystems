import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { api, type Player, type SkillCategory } from '../lib/api'

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [categories, setCategories] = useState<SkillCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [p, c] = await Promise.all([
        api.get<Player[]>('/api/players'),
        api.get<SkillCategory[]>('/api/skill-categories'),
      ])
      setPlayers(p)
      setCategories(c)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load().catch(console.error)
  }, [])

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Spieler</h1>
          <p className="text-sm text-slate-600">{players.length} aktive Spieler im Kader</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Spieler hinzufügen
        </button>
      </header>

      {showForm && (
        <PlayerForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            load().catch(console.error)
          }}
        />
      )}

      {loading ? (
        <div className="text-slate-500">Lade…</div>
      ) : players.length === 0 ? (
        <div className="card text-center text-slate-500">
          Noch keine Spieler angelegt. Lege den ersten an, um zu starten.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {players.map((p) => (
            <PlayerCard key={p.id} player={p} categories={categories} />
          ))}
        </div>
      )}
    </div>
  )
}

function PlayerCard({ player, categories }: { player: Player; categories: SkillCategory[] }) {
  const overall = avgSkill(player.skills)
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold">
            {player.first_name} {player.last_name}
          </div>
          <div className="text-xs text-slate-500">
            {player.position || '—'} · #{player.jersey_number ?? '—'}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-msv">{overall.toFixed(2)}</div>
          <div className="text-[10px] uppercase text-slate-500">Gesamtwert</div>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        {categories.map((c) => {
          const v = player.skills[c.id] ?? 0
          return (
            <div key={c.id} className="flex items-center gap-2 text-xs">
              <span className="w-32 truncate text-slate-600">{c.name}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-msv"
                  style={{ width: `${(v / 10) * 100}%` }}
                />
              </div>
              <span className="w-8 text-right tabular-nums">{v.toFixed(1)}</span>
            </div>
          )
        })}
      </div>
      {player.injured && (
        <div className="mt-3 badge bg-rose-100 text-rose-700">verletzt</div>
      )}
    </div>
  )
}

function avgSkill(skills: Record<string, number>): number {
  const vals = Object.values(skills)
  if (vals.length === 0) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function PlayerForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [position, setPosition] = useState('MID')
  const [jersey, setJersey] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/api/players', {
        first_name: firstName,
        last_name: lastName,
        position,
        jersey_number: jersey ? Number(jersey) : null,
      })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="label">Vorname</label>
          <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>
        <div>
          <label className="label">Nachname</label>
          <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
        <div>
          <label className="label">Position</label>
          <select className="input" value={position} onChange={(e) => setPosition(e.target.value)}>
            <option value="GK">Torwart</option>
            <option value="DEF">Verteidiger</option>
            <option value="MID">Mittelfeld</option>
            <option value="ATT">Sturm</option>
          </select>
        </div>
        <div>
          <label className="label">Trikotnummer</label>
          <input className="input" type="number" value={jersey} onChange={(e) => setJersey(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onClose}>Abbrechen</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Speichere…' : 'Speichern'}
        </button>
      </div>
    </form>
  )
}
