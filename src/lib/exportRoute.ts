import { z } from 'zod'
import { TaskListSchema } from '../schemas/userstate.js'
import type { Task, Location } from '../schemas/index.js'

type TaskList = z.infer<typeof TaskListSchema>

export interface RouteStop {
  order: number
  taskName: string
  locationName: string | null
  region: string
  points: number
  completed: boolean
}

export function buildRouteStops(
  list: TaskList,
  tasks: Task[],
  taskLocIndex: Map<string, string>,
  locIndex: Map<string, Location>,
  completedIds: Set<string>
): RouteStop[] {
  const taskById = new Map(tasks.map(t => [t.id, t]))
  return list.taskIds.map((taskId: string, i: number) => {
    const task = taskById.get(taskId)
    const locId = taskLocIndex.get(taskId)
    const loc = locId ? locIndex.get(locId) : undefined
    return {
      order: i + 1,
      taskName: task?.name ?? taskId,
      locationName: loc?.name ?? null,
      region: task?.region ?? '',
      points: task?.points ?? 0,
      completed: completedIds.has(taskId),
    }
  })
}

export function exportToCSV(stops: RouteStop[]): string {
  const header = 'Order,Task,Location,Region,Points,Done'
  const rows = stops.map(s =>
    [s.order, `"${s.taskName}"`, `"${s.locationName ?? ''}"`, s.region, s.points, s.completed ? 'yes' : 'no'].join(',')
  )
  return [header, ...rows].join('\n')
}

export function exportToText(stops: RouteStop[]): string {
  return stops.map(s =>
    `${s.order}. ${s.taskName}${s.locationName ? ` @ ${s.locationName}` : ''} (${s.points} pts)${s.completed ? ' ✓' : ''}`
  ).join('\n')
}

export function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
