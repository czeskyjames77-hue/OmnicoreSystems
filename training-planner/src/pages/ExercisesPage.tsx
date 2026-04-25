import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { api, type Exercise, type SkillCategory } from '../lib/api'

export default function ExercisesPage() {
  const [items, setItems] = useState<Exercise[]>([])
  const [categories, setCategories] = useState<SkillCategory[]>([])
  const [showForm, setShowForm] = useState(false)

  async function load() {
    const [e, c] = await Promise.all([
      api.get<Exercise[]>('/api/exercises'),
      api.get<SkillCategory[]>('/api/skill-categories'),
    ])
    setItems(e)
    setCategories(c)
  }

  useEffect(() => {
    load().catch(console.error)
  }, [])

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Übungskatalog</h1>
          <p className="text-sm text-slate-600">{items.length} Übungen verfügbar</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Übung hinzufügen
        </button>
      </header>

      {showForm && (
        <ExerciseForm
          categories={categories}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            load().catch(console.error)
          }}
        />
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((ex) => (
          <div key={ex.id} className="card">
            <div className="flex items-start justify-between">
              <div className="font-semibold">{ex.name}</div>
              <div className="text-xs text-slate-500">
                {ex.duration_minutes} min · {ex.intensity}
              </div>
            </div>
            {ex.description && (
              <p className="mt-1 text-sm text-slate-600">{ex.description}</p>
            )}
            <div className="mt-2 text-xs text-slate-500">
              {ex.min_players}–{ex.max_players} Spieler
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {ex.skill_tags.map((t) => (
                <span key={t} className="badge bg-msv/10 text-msv">{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ExerciseForm({
  categories, onClose, onSaved,
}: { categories: SkillCategory[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [minP, setMinP] = useState(4)
  const [maxP, setMaxP] = useState(20)
  const [duration, setDuration] = useState(15)
  const [intensity, setIntensity] = useState<'locker' | 'mittel' | 'intensiv'>('mittel')
  const [tags, setTags] = useState<Record<string, number>>({})

  function toggleTag(id: string) {
    setTags((prev) => {
      const copy = { ...prev }
      if (id in copy) delete copy[id]
      else copy[id] = 1.0
      return copy
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    await api.post('/api/exercises', {
      name, description, min_players: minP, max_players: maxP,
      duration_minutes: duration, intensity,
      skill_tags: Object.entries(tags).map(([category_id, weight]) => ({ category_id, weight })),
    })
    onSaved()
  }

  return (
    <form onSubmit={submit} className="card space-y-3">
      <div>
        <label className="label">Name</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className="label">Beschreibung</label>
        <textarea className="input min-h-20" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <label className="label">Min Spieler</label>
          <input className="input" type="number" value={minP} onChange={(e) => setMinP(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Max Spieler</label>
          <input className="input" type="number" value={maxP} onChange={(e) => setMaxP(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Dauer (min)</label>
          <input className="input" type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Intensität</label>
          <select className="input" value={intensity} onChange={(e) => setIntensity(e.target.value as 'locker' | 'mittel' | 'intensiv')}>
            <option value="locker">locker</option>
            <option value="mittel">mittel</option>
            <option value="intensiv">intensiv</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Trainierte Skills</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => toggleTag(c.id)}
              className={`rounded-full border px-3 py-1 text-xs ${
                c.id in tags
                  ? 'border-msv bg-msv text-white'
                  : 'border-slate-200 text-slate-700'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onClose}>Abbrechen</button>
        <button type="submit" className="btn-primary">Speichern</button>
      </div>
    </form>
  )
}
