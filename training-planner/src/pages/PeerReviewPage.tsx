import { useEffect, useState } from 'react'
import { api, type Player, type SkillCategory } from '../lib/api'

interface Window {
  id: string
  label: string
  starts_at: string
  ends_at: string
  status: string
}

export default function PeerReviewPage() {
  const [window, setWindow] = useState<Window | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [categories, setCategories] = useState<SkillCategory[]>([])
  const [raterId, setRaterId] = useState<string>('')
  const [rateeId, setRateeId] = useState<string>('')
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    Promise.all([
      api.activeReviewWindow(),
      api.listPlayers(),
      api.listSkillCategories(),
    ])
      .then(([w, p, c]) => {
        setWindow(w)
        setPlayers(p)
        setCategories(c)
      })
      .catch(console.error)
  }, [])

  async function submit() {
    if (!raterId || !rateeId) return
    for (const cat of categories) {
      const value = ratings[cat.id]
      if (typeof value !== 'number') continue
      await api.submitReview({
        rater_id: raterId,
        ratee_id: rateeId,
        category_id: cat.id,
        rating: value,
      })
    }
    setSubmitted(true)
    setRatings({})
  }

  if (!window) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Peer-Review</h1>
        <div className="card text-slate-600">
          Aktuell ist kein Bewertungsfenster offen. Peer-Reviews finden alle 6 Monate statt —
          das nächste Fenster wird vom Trainer geöffnet.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Peer-Review: {window.label}</h1>
        <p className="text-sm text-slate-600">
          Bewerte deine Mitspieler ehrlich von 1 bis 10. Bewertungen sind anonym;
          mit mind. 3 Stimmen je Skill bildet sich der neue Wert (Selbstbewertung nicht erlaubt).
        </p>
      </header>

      {submitted && (
        <div className="card border-emerald-300 bg-emerald-50 text-emerald-800">
          Danke! Deine Bewertung wurde gespeichert.
        </div>
      )}

      <div className="card space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="label">Du bist (vertraulich)</label>
            <select className="input" value={raterId} onChange={(e) => setRaterId(e.target.value)}>
              <option value="">— wählen —</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Bewerte</label>
            <select className="input" value={rateeId} onChange={(e) => setRateeId(e.target.value)}>
              <option value="">— wählen —</option>
              {players.filter((p) => p.id !== raterId).map((p) => (
                <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
              ))}
            </select>
          </div>
        </div>

        {raterId && rateeId && (
          <div className="space-y-3">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="w-44 text-sm font-medium">{c.name}</div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.5}
                  value={ratings[c.id] ?? 5}
                  onChange={(e) =>
                    setRatings((prev) => ({ ...prev, [c.id]: Number(e.target.value) }))
                  }
                  className="flex-1"
                />
                <div className="w-10 text-right tabular-nums">
                  {(ratings[c.id] ?? 5).toFixed(1)}
                </div>
              </div>
            ))}
            <button className="btn-primary mt-2" onClick={submit}>
              Bewertung absenden
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
