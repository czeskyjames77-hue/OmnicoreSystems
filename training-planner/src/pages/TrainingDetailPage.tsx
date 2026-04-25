import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Sparkles, CheckCircle2 } from 'lucide-react'
import { api, type AttendanceEntry, type SuggestedPlan } from '../lib/api'

export default function TrainingDetailPage() {
  const { id } = useParams()
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([])
  const [plan, setPlan] = useState<SuggestedPlan | null>(null)
  const [applying, setApplying] = useState(false)
  const [appliedResult, setAppliedResult] = useState<string | null>(null)

  async function loadAttendance() {
    if (!id) return
    setAttendance(await api.getAttendance(id))
  }

  useEffect(() => {
    loadAttendance().catch(console.error)
  }, [id])

  async function setStatus(playerId: string, status: AttendanceEntry['status']) {
    if (!id) return
    await api.setAttendance(id, playerId, status)
    await loadAttendance()
  }

  async function generatePlan() {
    if (!id) return
    setPlan(await api.suggestedPlan(id))
  }

  async function applySkills() {
    if (!id) return
    setApplying(true)
    try {
      const res = await api.applySkills(id)
      setAppliedResult(`${res.status} – ${res.updates ?? 0} Skill-Updates`)
    } finally {
      setApplying(false)
    }
  }

  const counts = {
    zu: attendance.filter((a) => a.status === 'zu').length,
    ab: attendance.filter((a) => a.status === 'ab').length,
    unklar: attendance.filter((a) => a.status === 'unklar').length,
    verletzt: attendance.filter((a) => a.status === 'verletzt').length,
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Training-Details</h1>

      <section className="card">
        <h2 className="font-semibold">Anwesenheit</h2>
        <div className="mt-1 text-xs text-slate-500">
          {counts.zu} zu · {counts.ab} ab · {counts.unklar} unklar · {counts.verletzt} verletzt
        </div>
        <div className="mt-3 space-y-1">
          {attendance.map((a) => (
            <div key={a.player_id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
              <div className="text-sm">
                {a.first_name} {a.last_name}
              </div>
              <div className="flex gap-1 text-xs">
                {(['zu', 'ab', 'verletzt', 'unklar'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(a.player_id, s)}
                    className={`rounded-md px-2 py-1 ${
                      a.status === s
                        ? 'bg-msv text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Vorgeschlagener Trainingsplan</h2>
          <button className="btn-primary" onClick={generatePlan}>
            <Sparkles className="h-4 w-4" /> Plan generieren
          </button>
        </div>
        {plan && (
          <div className="mt-3 space-y-3">
            <div className="text-sm text-slate-600">
              {plan.n_players} Spieler dabei · {plan.total_minutes} min Plan
            </div>
            {plan.weak_skills && plan.weak_skills.length > 0 && (
              <div className="text-sm">
                <span className="font-medium">Schwächste Team-Skills: </span>
                {plan.weak_skills.map((w) => `${w.name} (Ø ${w.avg.toFixed(1)})`).join(', ')}
              </div>
            )}
            <ol className="space-y-2">
              {plan.items.map((it, i) => (
                <li key={it.exercise_id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      {i + 1}. {it.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {it.duration_minutes} min · {it.intensity}
                    </div>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {it.skills.map((s) => (
                      <span
                        key={s}
                        className={`badge ${
                          it.addresses_weakness.includes(s)
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="font-semibold">Skills anwenden (1%-Konzept)</h2>
        <p className="mt-1 text-sm text-slate-600">
          Nach dem Training: anwesende Spieler bekommen Skill-Boost in trainierten Kategorien,
          unentschuldigt fehlende verlieren etwas Wert.
        </p>
        <button className="btn-primary mt-3" onClick={applySkills} disabled={applying}>
          <CheckCircle2 className="h-4 w-4" />
          {applying ? 'Wende an…' : 'Skill-Update auslösen'}
        </button>
        {appliedResult && (
          <div className="mt-2 text-sm text-emerald-700">{appliedResult}</div>
        )}
      </section>
    </div>
  )
}
