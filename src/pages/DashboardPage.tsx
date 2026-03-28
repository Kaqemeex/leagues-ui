import { useLeague } from '../contexts/LeagueContext'
import { loadLeague } from '../lib/data'

export function DashboardPage() {
  const { selectedLeagueId } = useLeague()
  const league = loadLeague(selectedLeagueId)

  const totalPoints = league?.tasks.reduce((sum, t) => sum + t.points, 0) ?? 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{league?.name ?? 'No league selected'}</h1>
        <span className="text-lg font-mono bg-yellow-100 text-yellow-800 px-3 py-1 rounded">
          0 / {totalPoints} pts
        </span>
      </div>

      <section className="border rounded p-4 space-y-2">
        <h2 className="text-lg font-semibold">Tier Progress</h2>
        <p className="text-gray-500 text-sm">No tiers unlocked yet.</p>
      </section>

      <section className="border rounded p-4 space-y-2">
        <h2 className="text-lg font-semibold">Region Unlocks</h2>
        <p className="text-gray-500 text-sm">No regions unlocked yet.</p>
      </section>

      <section className="border rounded p-4 space-y-2">
        <h2 className="text-lg font-semibold">Active List</h2>
        <p className="text-gray-500 text-sm">No tasks in active list.</p>
      </section>
    </div>
  )
}
