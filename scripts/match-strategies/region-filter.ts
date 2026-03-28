/**
 * region-filter helper: filter candidate locations to those in the same
 * region slug as the task.
 *
 * Not a standalone matcher — a helper that other strategies can call.
 */

import type { NormalizedLocation } from '../normalize.js'

/**
 * Returns the subset of locations whose regionHint (normalized to a slug)
 * matches the given regionSlug.
 *
 * If no locations have a matching regionHint, the full list is returned
 * unchanged (fail-open: don't discard all candidates just because region
 * data is absent).
 */
export function filterByRegion(
  locations: NormalizedLocation[],
  regionSlug: string
): NormalizedLocation[] {
  const slug = regionSlug.toLowerCase().trim()

  const filtered = locations.filter((loc) => {
    if (!loc.regionHint) return false
    return loc.regionHint.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '') === slug
  })

  // Fail-open: if region filtering yields no results, return the full set
  return filtered.length > 0 ? filtered : locations
}
