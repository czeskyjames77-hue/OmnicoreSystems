import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Training } from '../lib/api'

export default function AttendancePage() {
  const [next, setNext] = useState<Training | null>(null)

  useEffect(() => {
    api
      .listTrainings()
      .then((list) => {
        const upcoming = list
          .filter((t) => new Date(t.scheduled_at) >= new Date(Date.now() - 1000 * 60 * 60 * 4))
          .sort((a, b) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at))[0]
        setNext(upcoming || null)
      })
      .catch(console.error)
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Anwesenheit</h1>
      {next ? (
        <Link to={`/trainings/${next.id}`} className="card block hover:border-msv">
          <div className="text-xs uppercase text-slate-500">Nächstes Training</div>
          <div className="mt-1 text-lg font-semibold">
            {new Date(next.scheduled_at).toLocaleString('de-DE', {
              weekday: 'long', day: '2-digit', month: '2-digit',
              hour: '2-digit', minute: '2-digit',
            })}
          </div>
          <div className="text-sm text-slate-600">
            {next.location || 'Ort offen'} · {next.duration_minutes} min · {next.intensity}
          </div>
          <div className="mt-3 text-sm text-msv">→ Anwesenheit verwalten</div>
        </Link>
      ) : (
        <div className="card text-slate-500">
          Keine kommenden Trainings. Lege eines unter Trainings → „Training planen" an.
        </div>
      )}
    </div>
  )
}
