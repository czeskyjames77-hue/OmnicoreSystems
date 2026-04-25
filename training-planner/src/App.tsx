import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import PlayersPage from './pages/PlayersPage'
import TrainingsPage from './pages/TrainingsPage'
import TrainingDetailPage from './pages/TrainingDetailPage'
import ExercisesPage from './pages/ExercisesPage'
import TacticsPage from './pages/TacticsPage'
import PeerReviewPage from './pages/PeerReviewPage'
import AttendancePage from './pages/AttendancePage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="spieler" element={<PlayersPage />} />
        <Route path="trainings" element={<TrainingsPage />} />
        <Route path="trainings/:id" element={<TrainingDetailPage />} />
        <Route path="uebungen" element={<ExercisesPage />} />
        <Route path="taktik" element={<TacticsPage />} />
        <Route path="peer-review" element={<PeerReviewPage />} />
        <Route path="anwesenheit" element={<AttendancePage />} />
      </Route>
    </Routes>
  )
}
