import { NavLink, Outlet } from 'react-router-dom'
import {
  Calendar,
  ClipboardCheck,
  Dumbbell,
  Home,
  Layout as LayoutIcon,
  Star,
  Users,
} from 'lucide-react'

const NAV = [
  { to: '/', label: 'Übersicht', icon: Home },
  { to: '/spieler', label: 'Spieler', icon: Users },
  { to: '/trainings', label: 'Trainings', icon: Calendar },
  { to: '/uebungen', label: 'Übungen', icon: Dumbbell },
  { to: '/taktik', label: 'Taktik', icon: LayoutIcon },
  { to: '/peer-review', label: 'Peer-Review', icon: Star },
  { to: '/anwesenheit', label: 'Anwesenheit', icon: ClipboardCheck },
]

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-slate-200 bg-white md:w-60 md:border-b-0 md:border-r">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-msv text-white font-bold">
            MSV
          </div>
          <div>
            <div className="font-semibold leading-tight">MSV Zossen</div>
            <div className="text-xs text-slate-500">Trainer-App</div>
          </div>
        </div>
        <nav className="flex flex-row overflow-x-auto px-2 pb-3 md:flex-col md:overflow-visible md:px-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-msv text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
