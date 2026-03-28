import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { LatLngBoundsExpression } from 'leaflet'
import { OsrsCrs, osrsTileToLatLng } from '../lib/osrs-crs'
import { usePlane } from '../hooks/usePlane'
import { useLeague } from '../contexts/LeagueContext'
import { loadLeague } from '../lib/data'
import { RegionFilterBar } from '../components/RegionFilterBar'
import { LocationMarker } from '../components/map/LocationMarker'

const TILE_URL =
  (import.meta.env.VITE_TILE_SERVER_URL as string | undefined) ??
  'https://maps.runescape.wiki/osrs/{plane}/{z}/{x}/{y}.png'

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

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      <RegionFilterBar tasks={league?.tasks ?? []} />
      <MapContainer
        center={LUMBRIDGE_CENTER}
        zoom={7}
        crs={OsrsCrs}
        zoomControl={false}
        style={{ flex: 1, background: '#1a1a2e' }}
      >
        <ZoomControl position="topright" />
        <OsrsTileLayer plane={plane} />
        <MapControls plane={plane} />
        {(league?.locations ?? []).map(loc => (
          <LocationMarker key={loc.id} location={loc} />
        ))}
      </MapContainer>
    </div>
  )
}
