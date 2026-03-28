import { useState, useMemo } from 'react'
import { useLeague } from '../contexts/LeagueContext'
import { loadLeague } from '../lib/data'
import { useUserState } from '../hooks/useUserState'
import { useFilter } from '../contexts/FilterContext'
import { TierBar } from '../components/TierBar'
import { downloadFile } from '../lib/exportRoute'
import type { Task } from '../schemas/core'

export function TrackerPage() {
  const { selectedLeagueId } = useLeague()
  const league = loadLeague(selectedLeagueId)
  const { state, toggleTask, markManyComplete, markManyIncomplete } = useUserState()
  const { filters } = useFilter()

  const [showFilter, setShowFilter] = useState<'all' | 'completed' | 'incomplete'>('all')
  const [sortBy, setSortBy] = useState<'default' | 'points-asc' | 'points-desc' | 'name-asc' | 'name-desc' | 'region'>('default')
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())
  const [groupBy, setGroupBy] = useState<'flat' | 'region'>('flat')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

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

  // Bulk selection helpers
  const displayedTaskIds = displayedTasks.map(t => t.id)
  const allDisplayedSelected =
    displayedTaskIds.length > 0 && displayedTaskIds.every(id => selectedTaskIds.has(id))
  const someDisplayedSelected = displayedTaskIds.some(id => selectedTaskIds.has(id))

  function toggleSelectAll() {
    if (allDisplayedSelected) {
      setSelectedTaskIds(prev => {
        const next = new Set(prev)
        for (const id of displayedTaskIds) next.delete(id)
        return next
      })
    } else {
      setSelectedTaskIds(prev => {
        const next = new Set(prev)
        for (const id of displayedTaskIds) next.add(id)
        return next
      })
    }
  }

  function toggleSelectTask(taskId: string) {
    setSelectedTaskIds(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  function markSelectedComplete() {
    markManyComplete(Array.from(selectedTaskIds))
    setSelectedTaskIds(new Set())
  }

  function markSelectedIncomplete() {
    markManyIncomplete(Array.from(selectedTaskIds))
    setSelectedTaskIds(new Set())
  }

  // Group displayed tasks by region for region accordion view
  const regionGroups = useMemo(() => {
    const groups = new Map<string, Task[]>()
    for (const task of displayedTasks) {
      const existing = groups.get(task.region) ?? []
      existing.push(task)
      groups.set(task.region, existing)
    }
    return groups
  }, [displayedTasks])

  function exportCSV() {
    const header = 'Task,Region,Difficulty,Points,Done'
    const rows = displayedTasks.map(t =>
      [
        `"${t.name.replace(/"/g, '""')}"`,
        t.region,
        t.difficulty,
        t.points,
        state.completedTaskIds.has(t.id) ? 'yes' : 'no',
      ].join(',')
    )
    const csv = [header, ...rows].join('\n')
    const date = new Date().toISOString().slice(0, 10)
    downloadFile(csv, `leagues-tasks-${date}.csv`, 'text/csv')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">{league.name} — Tracker</h1>
      <TierBar points={completedPoints} />
      <p className="text-sm text-zinc-400">
        {completedCount} / {totalCount} tasks complete · {completedPoints.toLocaleString()} pts
      </p>

      <div className="flex gap-3 mb-3 flex-wrap items-center justify-between">
        <div className="flex gap-3 flex-wrap items-center">
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

        <button
          onClick={exportCSV}
          className="px-3 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 rounded text-zinc-200"
        >
          Export CSV
        </button>
      </div>

      {selectedTaskIds.size > 0 && (
        <div className="flex gap-2 items-center p-2 bg-zinc-800 rounded mb-2">
          <span className="text-sm text-zinc-400">{selectedTaskIds.size} selected</span>
          <button onClick={markSelectedComplete} className="px-2 py-1 text-xs bg-amber-500 text-black rounded">Mark complete</button>
          <button onClick={markSelectedIncomplete} className="px-2 py-1 text-xs bg-zinc-600 rounded">Mark incomplete</button>
          <button onClick={() => setSelectedTaskIds(new Set())} className="px-2 py-1 text-xs bg-zinc-700 rounded">Clear</button>
        </div>
      )}

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left text-zinc-500">
            <th className="py-2 pr-2 w-6">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={allDisplayedSelected}
                ref={el => { if (el) el.indeterminate = someDisplayedSelected && !allDisplayedSelected }}
                onChange={toggleSelectAll}
                aria-label="Select all"
              />
            </th>
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
            const selected = selectedTaskIds.has(task.id)
            return (
              <tr key={task.id} className={`border-b hover:bg-zinc-800 ${done ? 'opacity-50' : ''} ${selected ? 'bg-zinc-800/60' : ''}`}>
                <td className="py-2 pr-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={selected}
                    onChange={() => toggleSelectTask(task.id)}
                    aria-label={`Select ${task.name}`}
                  />
                </td>
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
            <td colSpan={5} className="py-2 text-zinc-400">Total earned</td>
            <td className="py-2 text-right text-amber-400">{completedPoints.toLocaleString()} pts</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
