import { useLeague } from '../contexts/LeagueContext'
import { loadLeague } from '../lib/data'

export function TrackerPage() {
  const { selectedLeagueId } = useLeague()
  const league = loadLeague(selectedLeagueId)

  if (!league) {
    return <p className="text-gray-500">No data available</p>
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{league.name} — Tracker</h1>
      <ul className="space-y-2">
        {league.tasks.map(task => (
          <li key={task.id} className="flex items-center gap-3 border rounded px-3 py-2 hover:bg-gray-50">
            <input
              type="checkbox"
              id={`task-${task.id}`}
              className="w-4 h-4 accent-yellow-600"
              defaultChecked={false}
            />
            <label htmlFor={`task-${task.id}`} className="flex-1 cursor-pointer">
              <span className="font-medium">{task.name}</span>
              <span className="ml-2 text-xs text-gray-400">{task.difficulty} · {task.points} pts</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
