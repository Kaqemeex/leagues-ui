import React, { createContext, useContext, useState } from 'react'

interface LeagueInfo { id: string; name: string }

// Stub — will be replaced by data/leagues/index.json once Assembly L5 is done
const STUB_LEAGUES: LeagueInfo[] = [
  { id: 'sample', name: 'Sample League' },
]

interface LeagueContextValue {
  leagues: LeagueInfo[]
  selectedLeagueId: string
  setSelectedLeagueId: (id: string) => void
}

const LeagueContext = createContext<LeagueContextValue | null>(null)

export function LeagueProvider({ children }: { children: React.ReactNode }) {
  const [selectedLeagueId, setSelectedLeagueId] = useState(STUB_LEAGUES[0]?.id ?? '')
  return (
    <LeagueContext.Provider value={{ leagues: STUB_LEAGUES, selectedLeagueId, setSelectedLeagueId }}>
      {children}
    </LeagueContext.Provider>
  )
}

export function useLeague(): LeagueContextValue {
  const ctx = useContext(LeagueContext)
  if (!ctx) throw new Error('useLeague must be used within LeagueProvider')
  return ctx
}
