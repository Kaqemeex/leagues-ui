import { TaskListPanel } from '../components/TaskListPanel.js'

export function PlannerPage() {
  return (
    <div className="flex h-[calc(100vh-8rem)]">
      <TaskListPanel />
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        Route map coming in next layer
      </div>
    </div>
  )
}
