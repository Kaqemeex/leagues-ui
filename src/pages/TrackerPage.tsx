import { useState, useMemo } from 'react'
import { useLeague } from '../contexts/LeagueContext'
import { loadLeague } from '../lib/data'
import { useUserState } from '../hooks/useUserState'
import { useFilter } from '../contexts/FilterContext'
import { TierBar } from '../components/TierBar'

export function TrackerPage() {
  const { selectedLeagueId } = useLeague()
  const league = loadLeague(selectedLeagueId)
  const { state, toggleTask } = useUserState()
  const { filters } = useFilter()

  const [showFilter, setShowFilter] = useState<'all' | 'completed' | 'incomplete'>('all')
  const [sortBy, setSortBy] = useState<'default' | 'points-asc' | 'points-desc' | 'name-asc' | 'name-desc' | 'region'>('default')

  const displayedTasks = useMemo(() => {
    if (!league) return []
    let tasks = league.tasks

    // completion filter
    if (showFilter === 'completed') tasks = tasks.filter(t => state.completedTaskIds.has(t.id))
    if (showFilter === 'incomplete') tasks = tasks.filter(t => !state.completedTaskIds.has(t.id))

    // region filter from FilterContext
    if (filters.activeRegions.size > 0)
      tasks = tasks.filter(t => filters.activeRegions.has(t.region))

    // search filter from FilterContext
    if (filters.searchQuery)
      tasks = tasks.filter(t => t.name.toLowerCase().includes(filters.searchQuery.toLowerCase()))

    // sort
    const sorted = [...tasks]
    if (sortBy === 'points-asc') sorted.sort((a, b) => a.points - b.points)
    else if (sortBy === 'points-desc') sorted.sort((a, b) => b.points - a.points)
    else if (sortBy === 'name-asc') sorted.sort((a, b) => a.name.localeCompare(b.name))
    else if (sortBy === 'name-desc') sorted.sort((a, b) => b.name.localeCompare(a.name))
    else if (sortBy === 'region') sorted.sort((a, b) => a.region.localeCompare(b.region))
    return sorted
  }, [league, state.completedTaskIds, showFilter, sortBy, filters])

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

      <div className="flex gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-1">
          <label className="text-xs text-zinc-400">Show</label>
          <select
            className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm text-zinc-200"
            value={showFilter}
            onChange={e => setShowFilter(e.target.value as typeof showFilter)}
          >
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="incomplete">Incomplete</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <label className="text-xs text-zinc-400">Sort by</label>
          <select
            className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm text-zinc-200"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
          >
            <option value="default">Default</option>
            <option value="points-asc">Points (low → high)</option>
            <option value="points-desc">Points (high → low)</option>
            <option value="name-asc">Name (A → Z)</option>
            <option value="name-desc">Name (Z → A)</option>
            <option value="region">Region</option>
          </select>
        </div>
      </div>

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
          {displayedTasks.map(task => {
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
