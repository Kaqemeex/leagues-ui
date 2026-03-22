import { Routes, Route } from 'react-router-dom'
import { LeagueProvider } from './contexts/LeagueContext'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { DashboardPage } from './pages/DashboardPage'
import { TasksPage } from './pages/TasksPage'
import { MapPage } from './pages/MapPage'
import { PlannerPage } from './pages/PlannerPage'
import { TrackerPage } from './pages/TrackerPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  return (
    <LeagueProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-4">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/track" element={<TrackerPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </LeagueProvider>
  )
}
