import { Link } from 'react-router-dom'
import { Calendar, ClipboardCheck, Dumbbell, Layout, Star, Users } from 'lucide-react'

const TILES = [
  { to: '/spieler', label: 'Spieler', icon: Users, hint: 'Kader und Skills verwalten' },
  { to: '/trainings', label: 'Trainings', icon: Calendar, hint: 'Trainings planen und Plan generieren' },
  { to: '/anwesenheit', label: 'Anwesenheit', icon: ClipboardCheck, hint: 'Wer ist beim nächsten Training dabei?' },
  { to: '/uebungen', label: 'Übungskatalog', icon: Dumbbell, hint: 'Übungen mit Skill-Tags' },
  { to: '/taktik', label: 'Taktik-Board', icon: Layout, hint: 'Laufwege und Spieleröffnungen' },
  { to: '/peer-review', label: 'Peer-Review', icon: Star, hint: 'Halbjährliche Team-Bewertung' },
]

export default function HomePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Willkommen bei MSV Zossen Trainer</h1>
        <p className="mt-1 text-slate-600">
          Trainings die sich an Anwesenheit und Team-Schwächen anpassen — mit dem 1%-Konzept,
          das jeden Spieler pro Training individuell weiterbringt.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map(({ to, label, icon: Icon, hint }) => (
          <Link key={to} to={to} className="card group transition hover:border-msv hover:shadow-md">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-msv/10 p-2 text-msv group-hover:bg-msv group-hover:text-white">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold">{label}</div>
                <div className="text-sm text-slate-500">{hint}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
