import { useLeague } from '../contexts/LeagueContext'
import { loadLeague } from '../lib/data'

export function TasksPage() {
  const { selectedLeagueId } = useLeague()
  const league = loadLeague(selectedLeagueId)

  if (!league) {
    return <p className="text-gray-500">No data available</p>
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{league.name} — Tasks</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="px-3 py-2 border">Name</th>
              <th className="px-3 py-2 border">Region</th>
              <th className="px-3 py-2 border">Difficulty</th>
              <th className="px-3 py-2 border text-right">Points</th>
            </tr>
          </thead>
          <tbody>
            {league.tasks.map(task => (
              <tr key={task.id} className="odd:bg-white even:bg-gray-50 hover:bg-yellow-50">
                <td className="px-3 py-2 border font-medium">{task.name}</td>
                <td className="px-3 py-2 border capitalize">{task.region}</td>
                <td className="px-3 py-2 border">{task.difficulty}</td>
                <td className="px-3 py-2 border text-right font-mono">{task.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
