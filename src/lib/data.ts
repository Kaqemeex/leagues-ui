import { LeagueSchema, type League } from '../schemas/index.js'

// During dev, import sample.json directly. In future, this will load dynamically.
import sampleData from '../../data/leagues/sample.json' with { type: 'json' }

const leagueCache = new Map<string, League>()

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
