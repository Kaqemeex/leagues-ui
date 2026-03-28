/**
 * Deterministic ID generation utilities.
 *
 * All functions are pure and produce the same output for the same input.
 */

/**
 * Convert a name to a kebab-case slug.
 * Lowercases, replaces spaces with hyphens, strips non-alphanumeric characters
 * (except hyphens), and collapses consecutive hyphens.
 */
export function toKebabSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Returns `task-{kebab-slug}` for a task name. */
export function makeTaskId(name: string): string {
  return `task-${toKebabSlug(name)}`
}

/** Returns `loc-{kebab-slug}` for a location name. */
export function makeLocationId(name: string): string {
  return `loc-${toKebabSlug(name)}`
}

/** Returns a lowercase kebab region slug from a region display name. */
export function makeRegionSlug(name: string): string {
  return toKebabSlug(name)
}
