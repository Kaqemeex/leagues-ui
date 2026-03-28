import { useState } from 'react'

/**
 * Holds the active OSRS map plane (floor level).
 * Plane 0 = surface world, 1 = first floor, 2 = second floor.
 *
 * Note: this hook is component-local to each MapContainer instance —
 * it is NOT a global singleton, so the planner's map panel won't share
 * plane state with the main map.
 */
export function usePlane(initialPlane = 0) {
  const [plane, setPlane] = useState(initialPlane)
  return { plane, setPlane }
}
