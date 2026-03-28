/**
 * name-fuzzy strategy: match using substring containment both ways.
 * The task name contains the location name, or the location name contains
 * the task name (case-insensitive).
 *
 * Returns confidence 0.7 on match, null on no match.
 */

import type { NormalizedTask, NormalizedLocation } from '../normalize.js'

export function nameFuzzy(
  task: NormalizedTask,
  locations: NormalizedLocation[]
): { locationId: string; locationName: string; confidence: 0.7 } | null {
  const taskNameNorm = task.name.toLowerCase().trim()

  for (const loc of locations) {
    const locNameNorm = loc.name.toLowerCase().trim()

    if (taskNameNorm.includes(locNameNorm) || locNameNorm.includes(taskNameNorm)) {
      return {
        locationId: loc.id,
        locationName: loc.name,
        confidence: 0.7,
      }
    }
  }

  return null
}
