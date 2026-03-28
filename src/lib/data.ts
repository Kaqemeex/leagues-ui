import { LeagueSchema, type League } from '../schemas/index.js'

// During dev, import sample.json directly. In future, this will load dynamically.
import sampleData from '../../data/leagues/sample.json' with { type: 'json' }

const leagueCache = new Map<string, League>()

export interface LeagueInfo { id: string; name: string }

const AVAILABLE_LEAGUES: LeagueInfo[] = [
  { id: 'sample', name: 'Sample League' },
]

export function loadLeagues(): LeagueInfo[] {
  return AVAILABLE_LEAGUES
}

export function loadLeague(leagueId: string): League | null {
  if (leagueCache.has(leagueId)) return leagueCache.get(leagueId)!
  if (leagueId === 'sample') {
    const result = LeagueSchema.safeParse(sampleData)
    if (!result.success) { console.error('Invalid sample data', result.error); return null }
    leagueCache.set(leagueId, result.data)
    return result.data
  }
  return null
}
