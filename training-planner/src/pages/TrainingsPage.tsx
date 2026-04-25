import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, CheckCircle2 } from 'lucide-react'
import { api, type Training } from '../lib/api'

export default function TrainingsPage() {
  const [items, setItems] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setItems(await api.get<Training[]>('/api/trainings'))
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
          <h1 className="text-2xl font-bold">Trainings</h1>
          <p className="text-sm text-slate-600">{items.length} Trainings geplant</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Training planen
        </button>
      </header>

      {showForm && (
        <TrainingForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            load().catch(console.error)
          }}
        />
      )}

      {loading ? (
        <div className="text-slate-500">Lade…</div>
      ) : (
        <div className="space-y-2">
          {items.map((t) => (
            <Link to={`/trainings/${t.id}`} key={t.id} className="card flex items-center justify-between hover:border-msv">
              <div>
                <div className="font-semibold">
                  {new Date(t.scheduled_at).toLocaleString('de-DE', {
                    weekday: 'short', day: '2-digit', month: '2-digit',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </div>
                <div className="text-xs text-slate-500">
                  {t.location || 'Ort offen'} · {t.duration_minutes} min · {t.intensity}
                </div>
              </div>
              {t.applied && (
                <div className="flex items-center gap-1 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Skills angewendet
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function TrainingForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [duration, setDuration] = useState(90)
  const [intensity, setIntensity] = useState<'locker' | 'mittel' | 'intensiv'>('mittel')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    await api.post('/api/trainings', {
      scheduled_at: new Date(date).toISOString(),
      location: location || null,
      duration_minutes: duration,
      intensity,
    })
    onSaved()
  }

  return (
    <form onSubmit={submit} className="card space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="label">Datum + Uhrzeit</label>
          <input className="input" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
          <label className="label">Ort</label>
          <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="z.B. Sportplatz Zossen" />
        </div>
        <div>
          <label className="label">Dauer (min)</label>
          <input className="input" type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Intensität</label>
          <select className="input" value={intensity} onChange={(e) => setIntensity(e.target.value as 'locker' | 'mittel' | 'intensiv')}>
            <option value="locker">locker (+0.5%)</option>
            <option value="mittel">mittel (+1.0%)</option>
            <option value="intensiv">intensiv (+1.5%)</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onClose}>Abbrechen</button>
        <button type="submit" className="btn-primary">Speichern</button>
      </div>
    </form>
  )
}
