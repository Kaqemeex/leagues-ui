import L from 'leaflet'

// OSRS tile to Leaflet latLng conversion
// OSRS tile (x, y) → Leaflet (lat, lng)
// The wiki tile server uses zoom levels 0–9, with tile size 256px
// Reference: https://oldschool.runescape.wiki/w/Module:Map
export const OsrsCrs = L.extend({}, L.CRS.Simple, {
  // tile origin at bottom-left, y axis inverted relative to screen coords
  transformation: new L.Transformation(1, 0, -1, 0),
})

/**
 * Convert an OSRS tile coordinate to a Leaflet LatLng.
 * In L.CRS.Simple, "lat" maps to Y and "lng" maps to X.
 */
export function osrsTileToLatLng(x: number, y: number): L.LatLng {
  return L.latLng(y, x)
}

/**
 * Convert a Leaflet LatLng back to an OSRS tile coordinate.
 */
export function latLngToOsrsTile(latlng: L.LatLng): { x: number; y: number } {
  return { x: latlng.lng, y: latlng.lat }
}

// Aliases used in MapPage
export const tileToLatLng = osrsTileToLatLng
export const latLngToTile = latLngToOsrsTile
