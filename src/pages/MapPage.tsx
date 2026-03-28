import { useLeague } from '../contexts/LeagueContext'
import { loadLeague } from '../lib/data'
import { RegionFilterBar } from '../components/RegionFilterBar'

export function MapPage() {
  const { selectedLeagueId } = useLeague()
  const league = loadLeague(selectedLeagueId)

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      <RegionFilterBar tasks={league?.tasks ?? []} />
      <div className="flex flex-1 items-center justify-center">
        <p className="text-2xl text-gray-400 font-medium">Map coming soon</p>
      </div>
    </div>
  )
}
