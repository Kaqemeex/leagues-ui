/**
 * name-exact strategy: match normalized task name to normalized location name,
 * exact case-insensitive comparison.
 *
 * Returns confidence 1.0 on match, null on no match.
 */

import type { NormalizedTask, NormalizedLocation } from '../normalize.js'

export function nameExact(
  task: NormalizedTask,
  locations: NormalizedLocation[]
): { locationId: string; locationName: string; confidence: 1.0 } | null {
  const taskNameNorm = task.name.toLowerCase().trim()

  for (const loc of locations) {
    if (loc.name.toLowerCase().trim() === taskNameNorm) {
      return {
        locationId: loc.id,
        locationName: loc.name,
        confidence: 1.0,
      }
    }
  }

  return null
}
