import { useMemo } from 'react'
import type { Task } from '../schemas/index.js'

export interface RegionSummary {
  regionId: string
  name: string
  completedCount: number
  totalCount: number
  earnedPoints: number
  totalPoints: number
}

export function useRegionSummaries(
  tasks: Task[],
  completedTaskIds: Set<string>
): RegionSummary[] {
  return useMemo(() => {
    const map = new Map<string, RegionSummary>()
    for (const task of tasks) {
      const key = task.region
      if (!map.has(key))
        map.set(key, {
          regionId: key,
          name: key,
          completedCount: 0,
          totalCount: 0,
          earnedPoints: 0,
          totalPoints: 0,
        })
      const s = map.get(key)!
      s.totalCount++
      s.totalPoints += task.points
      if (completedTaskIds.has(task.id)) {
        s.completedCount++
        s.earnedPoints += task.points
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [tasks, completedTaskIds])
}
