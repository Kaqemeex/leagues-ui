import React, { createContext, useContext, useState, useEffect } from 'react'
import { useLeague } from './LeagueContext'

export interface FilterState {
  activeRegions: Set<string>
  searchQuery: string
}

interface FilterContextValue {
  filters: FilterState
  toggleRegion: (id: string) => void
  setSearch: (q: string) => void
  resetFilters: () => void
}

const FilterContext = createContext<FilterContextValue | null>(null)

function initialState(): FilterState {
  return { activeRegions: new Set<string>(), searchQuery: '' }
}

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const { selectedLeagueId } = useLeague()
  const [filters, setFilters] = useState<FilterState>(initialState)

  // Reset filters when the selected league changes
  useEffect(() => {
    setFilters(initialState())
  }, [selectedLeagueId])

  function toggleRegion(id: string) {
    setFilters(prev => {
      const next = new Set(prev.activeRegions)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return { ...prev, activeRegions: next }
    })
  }

  function setSearch(q: string) {
    setFilters(prev => ({ ...prev, searchQuery: q }))
  }

  function resetFilters() {
    setFilters(initialState())
  }

  return (
    <FilterContext.Provider value={{ filters, toggleRegion, setSearch, resetFilters }}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilter(): FilterContextValue {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilter must be used within FilterProvider')
  return ctx
}
