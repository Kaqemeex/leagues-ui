import { useMemo } from 'react'
import { useFilter } from '../contexts/FilterContext'
import type { Task } from '../schemas/index.js'

export function useFilteredTasks(tasks: Task[]): Task[] {
  const { filters } = useFilter()

  return useMemo(() => {
    const { activeRegions, searchQuery } = filters
    return tasks.filter(task => {
      const passesRegion =
        activeRegions.size === 0 || activeRegions.has(task.region)
      const passesSearch =
        searchQuery === '' ||
        task.name.toLowerCase().includes(searchQuery.toLowerCase())
      return passesRegion && passesSearch
    })
  }, [tasks, filters])
}
