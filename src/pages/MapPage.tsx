import { useState } from 'react'
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { LatLngBoundsExpression } from 'leaflet'
import { OsrsCrs, osrsTileToLatLng } from '../lib/osrs-crs'
import { usePlane } from '../hooks/usePlane'
import { useLeague } from '../contexts/LeagueContext'
import { loadLeague } from '../lib/data'
import { RegionFilterBar } from '../components/RegionFilterBar'
import { TaskMarker } from '../components/map/TaskMarker'
import { TaskDetailPanel } from '../components/map/TaskDetailPanel'
import { RegionOverlay } from '../components/map/RegionOverlay'
import { useUserState } from '../hooks/useUserState'
import { useFilter } from '../contexts/FilterContext'
import type { Location, Task } from '../schemas'

const TILE_URL =
  (import.meta.env.VITE_TILE_SERVER_URL as string | undefined) ??
  'https://maps.runescape.wiki/osrs/{plane}/{z}/{x}/{-y}.png'

const LUMBRIDGE_CENTER = osrsTileToLatLng(3232, 3232)

const OSRS_WORLD_BOUNDS: LatLngBoundsExpression = [
  [2496, 1024],
  [4160, 3904],
]

function OsrsTileLayer({ plane }: { plane: number }) {
  const url = TILE_URL.replace('{plane}', String(plane))
  return (
    <TileLayer
      url={url}
      attribution='Tiles &copy; <a href="https://oldschool.runescape.wiki">OSRS Wiki</a>'
      minZoom={4}
      maxZoom={11}
      errorTileUrl=""
    />
  )
}

function MapControls({ plane }: { plane: number }) {
  const map = useMap()
  return (
    <div className="leaflet-top leaflet-right" style={{ marginTop: 90 }}>
      <div className="leaflet-control leaflet-bar">
        <button
          onClick={() => map.fitBounds(OSRS_WORLD_BOUNDS)}
          title="Reset view"
          style={{ display: 'block', width: 30, height: 30, lineHeight: '30px', textAlign: 'center', fontSize: 14, background: 'white', cursor: 'pointer', border: 'none' }}
        >⌂</button>
      </div>
      <div className="leaflet-control leaflet-bar" style={{ marginTop: 4 }} title={`Active plane: ${plane}`}>
        <span style={{ display: 'block', padding: '0 6px', lineHeight: '30px', fontSize: 11, background: 'white', whiteSpace: 'nowrap' }}>P{plane}</span>
      </div>
    </div>
  )
}

export function MapPage() {
  const { plane } = usePlane(0)
  const { selectedLeagueId } = useLeague()
  const league = loadLeague(selectedLeagueId)
  const { state, toggleTask, addTaskToList } = useUserState()
  const { filters } = useFilter()
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)

  // Build a map from locationId -> Task[] using the taskLocations join table
  const tasksByLocation = new Map<string, Task[]>()
  const taskIndex = new Map<string, Task>()
  for (const task of (league?.tasks ?? [])) {
    taskIndex.set(task.id, task)
  }
  for (const tl of (league?.taskLocations ?? [])) {
    const task = taskIndex.get(tl.taskId)
    if (!task) continue
    if (!tasksByLocation.has(tl.locationId)) tasksByLocation.set(tl.locationId, [])
    tasksByLocation.get(tl.locationId)!.push(task)
  }

  // Filter locations based on activeRegions and searchQuery
  const allLocations = league?.locations ?? []
  const searchLower = filters.searchQuery.toLowerCase()
  const visibleLocations = allLocations.filter(loc => {
    // Region filter: if any regions are active, only show matching ones
    if (filters.activeRegions.size > 0 && !filters.activeRegions.has(loc.regionId)) {
      return false
    }
    // Search filter: only show locations with at least one task matching the query
    if (searchLower) {
      const tasks = tasksByLocation.get(loc.id) ?? []
      const hasMatch = tasks.some(t => t.name.toLowerCase().includes(searchLower))
      if (!hasMatch) return false
    }
    return true
  })

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      <RegionFilterBar tasks={league?.tasks ?? []} />
      <div className="relative flex-1">
        <MapContainer
          center={LUMBRIDGE_CENTER}
          zoom={7}
          crs={OsrsCrs}
          zoomControl={false}
          style={{ height: '100%', background: '#1a1a2e' }}
        >
          <ZoomControl position="topright" />
          <OsrsTileLayer plane={plane} />
          <MapControls plane={plane} />
          <RegionOverlay />
          {visibleLocations.map(loc => (
            <TaskMarker
              key={loc.id}
              location={loc}
              tasks={tasksByLocation.get(loc.id) ?? []}
              completedIds={state.completedTaskIds}
              onClick={loc => setSelectedLocation(loc)}
            />
          ))}
        </MapContainer>
        <TaskDetailPanel
          location={selectedLocation}
          tasks={tasksByLocation.get(selectedLocation?.id ?? '') ?? []}
          completedIds={state.completedTaskIds}
          onClose={() => setSelectedLocation(null)}
          onToggleTask={toggleTask}
          onAddToList={taskId => { if (state.activeTaskListId) addTaskToList(state.activeTaskListId, taskId) }}
        />
      </div>
    </div>
  )
}
