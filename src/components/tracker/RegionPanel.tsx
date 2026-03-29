import { useState } from 'react'
import type { Task } from '../../schemas/index.js'
import type { RegionSummary } from '../../hooks/useRegionSummaries.js'

interface RegionPanelProps {
  summary: RegionSummary
  tasks: Task[]
  completedIds: Set<string>
  selectedIds: Set<string>
  onToggleTask: (id: string) => void
  onToggleSelect: (id: string) => void
  onTaskClick: (task: Task) => void
}

export function RegionPanel({
  summary,
  tasks,
  completedIds,
  selectedIds,
  onToggleTask,
  onToggleSelect,
  onTaskClick,
}: RegionPanelProps) {
  const [open, setOpen] = useState(false)

  const pct =
    summary.totalCount > 0 ? (summary.completedCount / summary.totalCount) * 100 : 0

  return (
    <div className="border border-zinc-700 rounded mb-2">
      <button
        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-zinc-800 rounded"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="text-zinc-400 text-xs">{open ? '▼' : '▶'}</span>
        <span className="font-semibold text-zinc-200 flex-1">{summary.name}</span>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-zinc-700 rounded overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-zinc-400">
            {summary.completedCount}/{summary.totalCount}
          </span>
          <span className="text-xs text-zinc-500">
            {summary.earnedPoints.toLocaleString()}/{summary.totalPoints.toLocaleString()} pts
          </span>
        </div>
      </button>

      {open && (
        <div className="px-3 pb-2">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-zinc-500">
                <th className="py-1 pr-2 w-6"></th>
                <th className="py-1 pr-3 w-6"></th>
                <th className="py-1 pr-3">Task</th>
                <th className="py-1 pr-3">Region</th>
                <th className="py-1 pr-3">Difficulty</th>
                <th className="py-1 text-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => {
                const done = completedIds.has(task.id)
                const selected = selectedIds.has(task.id)
                return (
                  <tr
                    key={task.id}
                    className={`border-b hover:bg-zinc-800 ${done ? 'opacity-50' : ''} ${selected ? 'bg-zinc-800/60' : ''}`}
                  >
                    <td className="py-1 pr-2">
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={selected}
                        onChange={() => onToggleSelect(task.id)}
                        aria-label={`Select ${task.name}`}
                      />
                    </td>
                    <td className="py-1 pr-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-amber-500"
                        checked={done}
                        onChange={() => onToggleTask(task.id)}
                        aria-label={`Complete ${task.name}`}
                      />
                    </td>
                    <td className="py-1 pr-3">
                      <span
                        className={`cursor-pointer font-medium hover:text-amber-400 ${done ? 'line-through text-zinc-500' : ''}`}
                        onClick={() => onTaskClick(task)}
                      >
                        {task.name}
                      </span>
                    </td>
                    <td className="py-1 pr-3 text-zinc-500">{task.region}</td>
                    <td className="py-1 pr-3 text-zinc-500">{task.difficulty}</td>
                    <td className="py-1 text-right text-zinc-400">{task.points} pts</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
