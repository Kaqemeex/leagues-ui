/**
 * ID generation and normalization utilities for raw pipeline data.
 *
 * All functions are pure and deterministic: the same input always produces
 * the same output.
 */

import { z } from 'zod'
import { makeTaskId, makeLocationId, makeRegionSlug } from './lib/id.js'

// ---------------------------------------------------------------------------
// Raw schemas (pipeline-internal, not the final app schema)
// ---------------------------------------------------------------------------

const RawTaskSchema = z.object({
  name: z.string(),
  description: z.string(),
  difficulty: z.string(),
  points: z.number(),
  region: z.string(),
  completionPct: z.number(),
  wikiUrl: z.string().optional(),
})

const RawLocationSchema = z.object({
  name: z.string(),
  category: z.string(),
  tile: z.object({
    x: z.number().int(),
    y: z.number().int(),
    plane: z.number().int(),
  }),
  regionHint: z.string().optional(),
  wikiUrl: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Normalized schemas
// ---------------------------------------------------------------------------

export const NormalizedTaskSchema = RawTaskSchema.extend({
  id: z.string(),
  regionSlug: z.string(),
})

export const NormalizedLocationSchema = RawLocationSchema.extend({
  id: z.string(),
})

export type NormalizedTask = z.infer<typeof NormalizedTaskSchema>
export type NormalizedLocation = z.infer<typeof NormalizedLocationSchema>

// ---------------------------------------------------------------------------
// Public normalization functions
// ---------------------------------------------------------------------------

/**
 * Returns `task-{kebab-slug}` for a task name.
 * Deterministic: same input always returns same output.
 */
export function normalizeTaskId(name: string): string {
  return makeTaskId(name)
}

/**
 * Returns `loc-{kebab-slug}` for a location name.
 * Derived from name only (NOT tile coords), so IDs remain stable when
 * coordinates are corrected in re-scrapes.
 */
export function normalizeLocationId(name: string): string {
  return makeLocationId(name)
}

/**
 * Returns a lowercase kebab region slug from a region display name.
 * E.g. "Kourend & Kebos" → "kourend--kebos"
 */
export function normalizeRegionSlug(name: string): string {
  return makeRegionSlug(name)
}

/**
 * Reads raw task objects, assigns stable IDs, normalizes region slugs, and
 * returns a typed array of NormalizedTask.
 *
 * Throws if duplicate IDs are detected.
 */
export function normalizeRawTasks(raw: unknown[]): NormalizedTask[] {
  const results: NormalizedTask[] = []
  const seen = new Set<string>()

  for (const item of raw) {
    const parsed = RawTaskSchema.parse(item)
    const id = normalizeTaskId(parsed.name)
    const regionSlug = normalizeRegionSlug(parsed.region)

    if (seen.has(id)) {
      throw new Error(`Duplicate task ID detected: "${id}" (from name "${parsed.name}")`)
    }
    seen.add(id)

    results.push({ ...parsed, id, regionSlug })
  }

  return results
}

/**
 * Reads raw location objects, assigns stable `loc-` IDs derived from name,
 * deduplicates by (name, tile.x, tile.y, tile.plane), and returns a typed
 * array of NormalizedLocation.
 *
 * Throws if duplicate IDs are detected after deduplication.
 */
export function normalizeRawLocations(raw: unknown[]): NormalizedLocation[] {
  // First deduplicate by name + tile coordinates
  const dedupKey = (loc: { name: string; tile: { x: number; y: number; plane: number } }) =>
    `${loc.name}|${loc.tile.x}|${loc.tile.y}|${loc.tile.plane}`

  const dedupMap = new Map<string, NormalizedLocation>()

  for (const item of raw) {
    const parsed = RawLocationSchema.parse(item)
    const key = dedupKey(parsed)

    if (!dedupMap.has(key)) {
      const id = normalizeLocationId(parsed.name)
      dedupMap.set(key, { ...parsed, id })
    }
  }

  // Verify no duplicate IDs (two different names could produce the same slug)
  const results = Array.from(dedupMap.values())
  const seen = new Set<string>()

  for (const loc of results) {
    if (seen.has(loc.id)) {
      throw new Error(
        `Duplicate location ID detected: "${loc.id}" (from name "${loc.name}"). ` +
          `Consider disambiguating location names.`
      )
    }
    seen.add(loc.id)
  }

  return results
}
