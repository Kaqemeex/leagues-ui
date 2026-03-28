import type { Location } from '../schemas/index.js'

function distanceTiles(a: Location, b: Location): number {
  const dx = a.tile.x - b.tile.x
  const dy = a.tile.y - b.tile.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function autoSortLocations(locations: Location[]): Location[] {
  if (locations.length <= 1) return [...locations]
  const remaining = [...locations]
  const sorted: Location[] = [remaining.splice(0, 1)[0]!]
  while (remaining.length > 0) {
    const last = sorted[sorted.length - 1]!
    let nearestIdx = 0
    let nearestDist = Infinity
    for (let i = 0; i < remaining.length; i++) {
      const d = distanceTiles(last, remaining[i]!)
      if (d < nearestDist) { nearestDist = d; nearestIdx = i }
    }
    sorted.push(remaining.splice(nearestIdx, 1)[0]!)
  }
  return sorted
}

export function autoSortTaskIds(
  taskIds: string[],
  taskLocIndex: Map<string, string>,   // taskId → locationId
  locIndex: Map<string, Location>      // locationId → Location
): string[] {
  // Group taskIds by location, preserving tasks with no location at the end
  const withLoc = taskIds.filter(id => locIndex.has(taskLocIndex.get(id) ?? ''))
  const withoutLoc = taskIds.filter(id => !locIndex.has(taskLocIndex.get(id) ?? ''))

  // Get unique locations in original order
  const seen = new Set<string>()
  const uniqueLocs: Location[] = []
  for (const id of withLoc) {
    const locId = taskLocIndex.get(id)!
    if (!seen.has(locId)) { seen.add(locId); uniqueLocs.push(locIndex.get(locId)!) }
  }

  const sortedLocs = autoSortLocations(uniqueLocs)
  const locOrder = new Map(sortedLocs.map((l, i) => [l.id, i]))

  const sortedWithLoc = [...withLoc].sort((a, b) => {
    const aOrder = locOrder.get(taskLocIndex.get(a)!) ?? 0
    const bOrder = locOrder.get(taskLocIndex.get(b)!) ?? 0
    return aOrder - bOrder
  })

  return [...sortedWithLoc, ...withoutLoc]
}
