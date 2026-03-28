import type { Location, Task } from '../../schemas'

interface Props {
  location: Location | null
  tasks: Task[]
  completedIds: Set<string>
  onClose: () => void
  onToggleTask: (id: string) => void
  onAddToList: (taskId: string) => void
}

export function TaskDetailPanel({ location, tasks, completedIds, onClose, onToggleTask, onAddToList }: Props) {
  if (!location) return null
  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-zinc-900 border-l border-zinc-700 z-[1000] overflow-y-auto p-4 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <h2 className="font-bold text-lg">{location.name}</h2>
        <button onClick={onClose} className="text-zinc-400 hover:text-white text-xl leading-none">×</button>
      </div>
      <p className="text-xs text-zinc-500">{location.regionId} · plane {location.tile.plane ?? 0}</p>
      <ul className="space-y-2">
        {tasks.map(t => (
          <li key={t.id} className="flex items-start gap-2">
            <input type="checkbox" checked={completedIds.has(t.id)} onChange={() => onToggleTask(t.id)} className="mt-1 accent-amber-500" />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${completedIds.has(t.id) ? 'line-through text-zinc-500' : ''}`}>{t.name}</p>
              <p className="text-xs text-zinc-500">{t.points} pts · {t.difficulty}</p>
            </div>
            <button onClick={() => onAddToList(t.id)} title="Add to active list" className="text-xs text-amber-500 hover:text-amber-300 shrink-0">+list</button>
          </li>
        ))}
        {tasks.length === 0 && <li className="text-sm text-zinc-500">No tasks at this location</li>}
      </ul>
    </div>
  )
}
