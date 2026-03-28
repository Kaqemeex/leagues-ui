import { useLeague } from '../contexts/LeagueContext'
import { loadLeague } from '../lib/data'
import { useUserState } from '../hooks/useUserState'
import { TierBar } from '../components/TierBar'

export function TrackerPage() {
  const { selectedLeagueId } = useLeague()
  const league = loadLeague(selectedLeagueId)
  const { state, toggleTask } = useUserState()

  if (!league) {
    return <p className="text-gray-500">No data available</p>
  }

  const completedCount = league.tasks.filter(t => state.completedTaskIds.has(t.id)).length
  const totalCount = league.tasks.length
  const completedPoints = league.tasks
    .filter(t => state.completedTaskIds.has(t.id))
    .reduce((sum, t) => sum + t.points, 0)

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">{league.name} — Tracker</h1>
      <TierBar points={completedPoints} />
      <p className="text-sm text-zinc-400">
        {completedCount} / {totalCount} tasks complete · {completedPoints.toLocaleString()} pts
      </p>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left text-zinc-500">
            <th className="py-2 pr-3 w-6"></th>
            <th className="py-2 pr-3">Task</th>
            <th className="py-2 pr-3">Difficulty</th>
            <th className="py-2 pr-3">Region</th>
            <th className="py-2 text-right">Points</th>
          </tr>
        </thead>
        <tbody>
          {league.tasks.map(task => {
            const done = state.completedTaskIds.has(task.id)
            return (
              <tr key={task.id} className={`border-b hover:bg-zinc-800 ${done ? 'opacity-50' : ''}`}>
                <td className="py-2 pr-3">
                  <input
                    type="checkbox"
                    id={`task-${task.id}`}
                    className="w-4 h-4 accent-amber-500"
                    checked={done}
                    onChange={() => toggleTask(task.id)}
                  />
                </td>
                <td className="py-2 pr-3">
                  <label htmlFor={`task-${task.id}`} className={`cursor-pointer font-medium ${done ? 'line-through text-zinc-500' : ''}`}>
                    {task.name}
                  </label>
                </td>
                <td className="py-2 pr-3 text-zinc-500">{task.difficulty}</td>
                <td className="py-2 pr-3 text-zinc-500">{task.region}</td>
                <td className="py-2 text-right text-zinc-400">{task.points} pts</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t font-semibold">
            <td colSpan={4} className="py-2 text-zinc-400">Total earned</td>
            <td className="py-2 text-right text-amber-400">{completedPoints.toLocaleString()} pts</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
