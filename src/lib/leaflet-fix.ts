// Fix for Leaflet's default marker icon paths breaking in Vite/webpack builds.
// Uses new URL() with import.meta.url so Vite resolves the paths correctly
// without needing *.png type declarations.
import L from 'leaflet'

const iconUrl = new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href
const iconRetinaUrl = new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href
const shadowUrl = new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href

// Remove the private method Leaflet uses to find icons (breaks in Vite ESM builds)
delete (L.Icon.Default.prototype as any)._getIconUrl // eslint-disable-line @typescript-eslint/no-explicit-any

L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })
