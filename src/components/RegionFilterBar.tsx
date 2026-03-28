import { useMemo } from 'react'
import { useFilter } from '../contexts/FilterContext'
import type { Task } from '../schemas/index.js'

interface RegionFilterBarProps {
  tasks: Task[]
}

export function RegionFilterBar({ tasks }: RegionFilterBarProps) {
  const { filters, toggleRegion } = useFilter()

  const regions = useMemo(() => {
    const seen = new Set<string>()
    for (const task of tasks) {
      if (task.region) seen.add(task.region)
    }
    return Array.from(seen).sort()
  }, [tasks])

  if (regions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {regions.map(region => {
        const isActive = filters.activeRegions.has(region)
        return (
          <button
            key={region}
            onClick={() => toggleRegion(region)}
            className={
              `px-3 py-1 rounded-full text-sm font-medium capitalize transition-colors ` +
              (isActive
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600')
            }
          >
            {region}
          </button>
        )
      })}
    </div>
  )
}
