import { useUserState } from '../hooks/useUserState'
import { loadLeague } from '../lib/data'
import { useLeague } from '../contexts/LeagueContext'

export function PointsChip() {
  const { state } = useUserState()
  const { selectedLeagueId } = useLeague()
  const league = loadLeague(selectedLeagueId)
  const total = league?.tasks
    .filter(t => state.completedTaskIds.has(t.id))
    .reduce((sum, t) => sum + t.points, 0) ?? 0
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500 text-black text-sm font-bold">
      {total.toLocaleString()} pts
    </span>
  )
}
