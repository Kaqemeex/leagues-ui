import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { TaskListPanel } from '../components/TaskListPanel.js'
import { OsrsCrs, osrsTileToLatLng } from '../lib/osrs-crs.js'
import { useUserState } from '../hooks/useUserState.js'
import { useLeague } from '../contexts/LeagueContext.js'
import { loadLeague } from '../lib/data.js'

function RouteMap() {
  const { state } = useUserState()
  const { selectedLeagueId } = useLeague()
  const league = loadLeague(selectedLeagueId)

  const activeList = state.taskLists.find(l => l.id === state.activeTaskListId)
  const taskLocIndex = new Map(
    (league?.taskLocations ?? []).map(tl => [tl.taskId, tl.locationId])
  )
  const locIndex = new Map(
    (league?.locations ?? []).map(l => [l.id, l])
  )

  // Build ordered waypoints for the active list
  const waypoints = (activeList?.taskIds ?? [])
    .map(taskId => {
      const locId = taskLocIndex.get(taskId)
      return locId ? locIndex.get(locId) : undefined
    })
    .filter((l): l is NonNullable<typeof l> => l !== undefined)

  const positions = waypoints.map(loc => osrsTileToLatLng(loc.tile.x, loc.tile.y))

  return (
    <MapContainer
      center={osrsTileToLatLng(3232, 3232)}
      zoom={7}
      crs={OsrsCrs}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        url="https://maps.runescape.wiki/osrs/0/{z}/{x}/{y}.png"
        minZoom={4}
        maxZoom={11}
        errorTileUrl=""
      />
      {positions.length > 1 && (
        <Polyline positions={positions} pathOptions={{ color: '#f59e0b', weight: 2, dashArray: '4 4' }} />
      )}
      {waypoints.map((loc, i) => (
        <CircleMarker
          key={loc.id}
          center={positions[i]!}
          radius={6}
          pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.9 }}
        >
          <Tooltip>{i + 1}. {loc.name}</Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}

function NextStopOverlay() {
  const { state } = useUserState()
  const { selectedLeagueId } = useLeague()
  const league = loadLeague(selectedLeagueId)

  const activeList = state.taskLists.find(l => l.id === state.activeTaskListId)
  if (!activeList || !league) return null

  const taskLocIndex = new Map((league.taskLocations ?? []).map(tl => [tl.taskId, tl.locationId]))
  const locIndex = new Map((league.locations ?? []).map(l => [l.id, l]))

  let nextLocationName: string | null = null
  for (const taskId of activeList.taskIds) {
    if (!state.completedTaskIds.has(taskId)) {
      const locId = taskLocIndex.get(taskId)
      const loc = locId ? locIndex.get(locId) : undefined
      if (loc) {
        nextLocationName = loc.name
        break
      }
    }
  }

  if (!nextLocationName) return null

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-100 shadow-lg z-[1000] pointer-events-none">
      Next: {nextLocationName}
    </div>
  )
}

export function PlannerPage() {
  return (
    <div className="flex h-[calc(100vh-8rem)]">
      <TaskListPanel />
      <div className="flex-1 relative">
        <RouteMap />
        <NextStopOverlay />
      </div>
    </div>
  )
}
