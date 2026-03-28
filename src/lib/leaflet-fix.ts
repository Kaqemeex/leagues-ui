// Fix for Leaflet's default marker icon paths breaking in Vite/webpack builds.
// Leaflet's _getIconUrl uses require() internally which doesn't work in Vite ESM builds.
// We remove that method and instead resolve the icon URLs via Vite's asset pipeline.
import L from 'leaflet'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl

L.Icon.Default.mergeOptions({
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
})
