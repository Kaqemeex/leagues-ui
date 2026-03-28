import { CircleMarker, Tooltip } from 'react-leaflet'
import { osrsTileToLatLng } from '../../lib/osrs-crs'
import type { Location } from '../../schemas'

interface Props {
  location: Location
}

export function LocationMarker({ location }: Props) {
  const position = osrsTileToLatLng(location.tile.x, location.tile.y)
  return (
    <CircleMarker center={position} radius={6} pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.8 }}>
      <Tooltip>{location.name}</Tooltip>
    </CircleMarker>
  )
}
