import { Rectangle, Tooltip } from 'react-leaflet'
import { osrsTileToLatLng } from '../../lib/osrs-crs'
import type { LatLngBoundsExpression } from 'leaflet'

interface RegionDef {
  slug: string
  name: string
  sw: [number, number]
  ne: [number, number]
}

const REGIONS: RegionDef[] = [
  { slug: 'misthalin', name: 'Misthalin', sw: [3072, 3136], ne: [3392, 3392] },
  { slug: 'asgarnia', name: 'Asgarnia', sw: [2944, 3136], ne: [3072, 3392] },
  { slug: 'kandarin', name: 'Kandarin', sw: [2560, 3136], ne: [2944, 3392] },
]

const RECT_PATH_OPTIONS = {
  color: '#f59e0b',
  weight: 1,
  fillOpacity: 0.05,
  fillColor: '#f59e0b',
}

export function RegionOverlay() {
  return (
    <>
      {REGIONS.map(region => {
        const swLatLng = osrsTileToLatLng(region.sw[0], region.sw[1])
        const neLatLng = osrsTileToLatLng(region.ne[0], region.ne[1])
        const bounds: LatLngBoundsExpression = [
          [swLatLng.lat, swLatLng.lng],
          [neLatLng.lat, neLatLng.lng],
        ]

        // Compute center for tooltip placement
        const centerLat = (swLatLng.lat + neLatLng.lat) / 2
        const centerLng = (swLatLng.lng + neLatLng.lng) / 2

        return (
          <Rectangle key={region.slug} bounds={bounds} pathOptions={RECT_PATH_OPTIONS}>
            <Tooltip permanent position={[centerLat, centerLng]}>
              {region.name}
            </Tooltip>
          </Rectangle>
        )
      })}
    </>
  )
}
