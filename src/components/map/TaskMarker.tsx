import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { osrsTileToLatLng } from '../../lib/osrs-crs'
import type { Location } from '../../schemas'
import type { Task } from '../../schemas'

interface Props {
  location: Location
  tasks: Task[]
  completedIds: Set<string>
}

export function TaskMarker({ location, tasks, completedIds }: Props) {
  const position = osrsTileToLatLng(location.tile.x, location.tile.y)
  const allDone = tasks.length > 0 && tasks.every(t => completedIds.has(t.id))
  const anyDone = tasks.some(t => completedIds.has(t.id))

  const icon = L.divIcon({
    className: '',
    html: `<div style="
      width:10px;height:10px;border-radius:50%;
      background:${allDone ? '#22c55e' : anyDone ? '#f59e0b' : '#ef4444'};
      border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.5)
    "></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  })

  return (
    <Marker position={position} icon={icon}>
      <Popup>
        <div style={{ minWidth: 160 }}>
          <strong>{location.name}</strong>
          <ul style={{ marginTop: 4, paddingLeft: 16, fontSize: 12 }}>
            {tasks.map(t => (
              <li key={t.id} style={{ color: completedIds.has(t.id) ? '#22c55e' : 'inherit' }}>
                {completedIds.has(t.id) ? '✓ ' : ''}{t.name} ({t.points} pts)
              </li>
            ))}
            {tasks.length === 0 && <li style={{ color: '#9ca3af' }}>No tasks</li>}
          </ul>
        </div>
      </Popup>
    </Marker>
  )
}
