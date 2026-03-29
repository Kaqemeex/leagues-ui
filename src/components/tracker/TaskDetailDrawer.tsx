import { Link } from 'react-router-dom'
import type { Task } from '../../schemas/index.js'
import type { Requirement } from '../../schemas/index.js'
import type { UserState } from '../../schemas/index.js'

interface TaskDetailDrawerProps {
  task: Task | null
  completedIds: Set<string>
  userState: UserState
  activeTaskListId: string | null
  taskListIds: string[]
  onClose: () => void
  onToggleTask: (id: string) => void
  onAddToList: (taskId: string) => void
  onRemoveFromList: (taskId: string) => void
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'bg-green-700 text-green-100',
  Medium: 'bg-amber-600 text-amber-100',
  Hard: 'bg-orange-600 text-orange-100',
  Elite: 'bg-red-700 text-red-100',
  Master: 'bg-purple-700 text-purple-100',
}

type RequirementMet = boolean | 'manual'

function evaluateRequirement(req: Requirement, userState: UserState): RequirementMet {
  if (req.type === 'skill') {
    const levels = (userState as unknown as Record<string, unknown>).skillLevels
    if (levels && typeof levels === 'object') {
      const lvl = (levels as Record<string, number>)[req.skill]
      if (lvl !== undefined) return lvl >= req.level
    }
    return false
  }
  if (req.type === 'region') {
    const unlocked = (userState as unknown as Record<string, unknown>).unlockedRegionIds
    if (Array.isArray(unlocked)) return unlocked.includes(req.regionId)
    return false
  }
  // quest, item, combat_level, total_level — manual
  return 'manual'
}

function RequirementRow({ req, met }: { req: Requirement; met: RequirementMet }) {
  let label = ''
  if (req.type === 'skill') label = `${req.skill} ${req.level}`
  else if (req.type === 'quest') label = `Quest: ${req.questName}`
  else if (req.type === 'item') label = `Item: ${req.itemName}`
  else if (req.type === 'region') label = `Region: ${req.regionId}`
  else if (req.type === 'combat_level') label = `Combat level ${req.level}`
  else if (req.type === 'total_level') label = `Total level ${req.level}`

  return (
    <li className="flex items-center gap-2 text-sm">
      {met === true && <span className="text-green-400">✓</span>}
      {met === false && <span className="text-red-400">✗</span>}
      {met === 'manual' && <span className="text-zinc-500">?</span>}
      <span className={met === 'manual' ? 'text-zinc-400' : met ? 'text-green-300' : 'text-red-300'}>
        {label}
      </span>
    </li>
  )
}

export function TaskDetailDrawer({
  task,
  completedIds,
  userState,
  activeTaskListId,
  onClose,
  onToggleTask,
  onAddToList,
  onRemoveFromList,
}: TaskDetailDrawerProps) {
  if (!task) return null

  const done = completedIds.has(task.id)
  const activeList = userState.taskLists.find(l => l.id === activeTaskListId)
  const inList = activeList?.taskIds.includes(task.id) ?? false
  const diffColor = DIFFICULTY_COLORS[task.difficulty] ?? 'bg-zinc-700 text-zinc-100'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className="fixed right-0 top-0 h-full w-80 bg-zinc-900 border-l border-zinc-700 z-50 flex flex-col overflow-y-auto shadow-xl"
        role="dialog"
        aria-label={`Task details: ${task.name}`}
      >
        <div className="flex items-start justify-between p-4 border-b border-zinc-700">
          <div className="flex-1 pr-2">
            <h2 className="text-base font-bold text-zinc-100 leading-snug">{task.name}</h2>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold ${diffColor}`}>
              {task.difficulty}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4 flex-1">
          {task.description && (
            <p className="text-sm text-zinc-300">{task.description}</p>
          )}

          <div className="text-sm text-zinc-400 space-y-1">
            <div><span className="text-zinc-500">Region: </span>{task.region}</div>
            <div><span className="text-zinc-500">Points: </span>{task.points}</div>
          </div>

          {task.requirements.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                Requirements
              </h3>
              <ul className="space-y-1">
                {task.requirements.map((req, i) => (
                  <RequirementRow
                    key={i}
                    req={req}
                    met={evaluateRequirement(req, userState)}
                  />
                ))}
              </ul>
            </div>
          )}

          <div>
            <Link
              to={`/map?taskId=${task.id}`}
              className="text-sm text-amber-400 hover:text-amber-300 underline"
            >
              View on map →
            </Link>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-700 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              className="w-4 h-4 accent-amber-500"
              checked={done}
              onChange={() => onToggleTask(task.id)}
            />
            <span className="text-zinc-200">Mark complete</span>
          </label>

          {activeTaskListId && (
            inList ? (
              <button
                onClick={() => onRemoveFromList(task.id)}
                className="w-full px-3 py-1.5 text-xs bg-zinc-700 hover:bg-zinc-600 rounded text-zinc-200"
              >
                Remove from list
              </button>
            ) : (
              <button
                onClick={() => onAddToList(task.id)}
                className="w-full px-3 py-1.5 text-xs bg-amber-600 hover:bg-amber-500 rounded text-zinc-100 font-semibold"
              >
                Add to list
              </button>
            )
          )}
        </div>
      </aside>
    </>
  )
}
