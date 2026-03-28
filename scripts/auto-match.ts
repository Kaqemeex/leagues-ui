/**
 * auto-match.ts — Assembly L3 Auto-Matcher
 *
 * Runs all 5 matching strategies in priority order against normalized tasks
 * and locations, produces a draft match file with confidence scores.
 *
 * Usage:
 *   tsx scripts/auto-match.ts --league <league-id>
 *
 * Reads:
 *   data/normalized/<league-id>/tasks.json
 *   data/normalized/<league-id>/locations.json
 *   data/matched-draft.json  (optional — existing entries are preserved)
 *
 * Writes:
 *   data/matched-draft.json
 *
 * Exits 0 on success, 1 on error.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { NormalizedTaskSchema, NormalizedLocationSchema } from './normalize.js'
import type { NormalizedTask, NormalizedLocation } from './normalize.js'
import { nameExact } from './match-strategies/name-exact.js'
import { nameFuzzy } from './match-strategies/name-fuzzy.js'
import { activityType } from './match-strategies/activity-type.js'
import { itemLocation } from './match-strategies/item-location.js'
import { z } from 'zod'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MatchResult {
  taskId: string
  taskName: string
  locationId: string | null
  locationName: string | null
  confidence: number
  strategy: string
  status: 'confirmed' | 'pending' | 'unmatched'
}

const MatchResultSchema = z.object({
  taskId: z.string(),
  taskName: z.string(),
  locationId: z.string().nullable(),
  locationName: z.string().nullable(),
  confidence: z.number(),
  strategy: z.string(),
  status: z.enum(['confirmed', 'pending', 'unmatched']),
})

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

function parseArgs(): { leagueId: string } {
  const args = process.argv.slice(2)
  const leagueIdx = args.indexOf('--league')
  if (leagueIdx === -1 || !args[leagueIdx + 1]) {
    console.error('Usage: tsx scripts/auto-match.ts --league <league-id>')
    process.exit(1)
  }
  return { leagueId: args[leagueIdx + 1]! }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readJsonFile(filePath: string): unknown {
  if (!fs.existsSync(filePath)) {
    console.error(`Missing input file: ${filePath}`)
    process.exit(1)
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function readJsonFileOptional(filePath: string): unknown {
  if (!fs.existsSync(filePath)) return null
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true })
}

function writeJsonFile(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

/**
 * Determine status from confidence score:
 * - >= 0.8  → confirmed (auto-confirmed)
 * - 0.5–0.79 → pending (needs human review)
 * - 0       → unmatched
 */
function confidenceToStatus(confidence: number): MatchResult['status'] {
  if (confidence >= 0.8) return 'confirmed'
  if (confidence >= 0.5) return 'pending'
  return 'unmatched'
}

/**
 * Run all 5 strategies in priority order. Return the result of the highest-
 * confidence strategy that matches, or an unmatched result.
 */
function matchTask(task: NormalizedTask, locations: NormalizedLocation[]): MatchResult {
  // Strategy 1: name-exact (confidence 1.0)
  const exactResult = nameExact(task, locations)
  if (exactResult) {
    return {
      taskId: task.id,
      taskName: task.name,
      locationId: exactResult.locationId,
      locationName: exactResult.locationName,
      confidence: exactResult.confidence,
      strategy: 'name-exact',
      status: confidenceToStatus(exactResult.confidence),
    }
  }

  // Strategy 2: name-fuzzy (confidence 0.7)
  const fuzzyResult = nameFuzzy(task, locations)
  if (fuzzyResult) {
    return {
      taskId: task.id,
      taskName: task.name,
      locationId: fuzzyResult.locationId,
      locationName: fuzzyResult.locationName,
      confidence: fuzzyResult.confidence,
      strategy: 'name-fuzzy',
      status: confidenceToStatus(fuzzyResult.confidence),
    }
  }

  // Strategy 3: activity-type (confidence 0.6)
  const activityResult = activityType(task, locations)
  if (activityResult) {
    return {
      taskId: task.id,
      taskName: task.name,
      locationId: activityResult.locationId,
      locationName: activityResult.locationName,
      confidence: activityResult.confidence,
      strategy: 'activity-type',
      status: confidenceToStatus(activityResult.confidence),
    }
  }

  // Strategy 4: item-location (confidence 0.5)
  const itemResult = itemLocation(task, locations)
  if (itemResult) {
    return {
      taskId: task.id,
      taskName: task.name,
      locationId: itemResult.locationId,
      locationName: itemResult.locationName,
      confidence: itemResult.confidence,
      strategy: 'item-location',
      status: confidenceToStatus(itemResult.confidence),
    }
  }

  // No match
  return {
    taskId: task.id,
    taskName: task.name,
    locationId: null,
    locationName: null,
    confidence: 0,
    strategy: 'none',
    status: 'unmatched',
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const { leagueId } = parseArgs()

  const normalizedDir = path.join(ROOT, 'data', 'normalized', leagueId)
  const tasksPath = path.join(normalizedDir, 'tasks.json')
  const locationsPath = path.join(normalizedDir, 'locations.json')
  const draftPath = path.join(ROOT, 'data', 'matched-draft.json')

  // Read inputs
  const rawTasks = readJsonFile(tasksPath)
  const rawLocations = readJsonFile(locationsPath)

  if (!Array.isArray(rawTasks)) {
    console.error(`Expected array in ${tasksPath}`)
    process.exit(1)
  }
  if (!Array.isArray(rawLocations)) {
    console.error(`Expected array in ${locationsPath}`)
    process.exit(1)
  }

  // Parse and validate
  const tasks: NormalizedTask[] = rawTasks.map((t, i) => {
    const result = NormalizedTaskSchema.safeParse(t)
    if (!result.success) {
      console.error(`Invalid task at index ${i}:`, result.error.message)
      process.exit(1)
    }
    return result.data
  })

  const locations: NormalizedLocation[] = rawLocations.map((l, i) => {
    const result = NormalizedLocationSchema.safeParse(l)
    if (!result.success) {
      console.error(`Invalid location at index ${i}:`, result.error.message)
      process.exit(1)
    }
    return result.data
  })

  // Load existing draft — confirmed entries must not be modified
  const existingDraftRaw = readJsonFileOptional(draftPath)
  const existingDraft: Map<string, MatchResult> = new Map()

  if (existingDraftRaw !== null) {
    if (!Array.isArray(existingDraftRaw)) {
      console.error(`Expected array in ${draftPath}`)
      process.exit(1)
    }
    for (const entry of existingDraftRaw) {
      const result = MatchResultSchema.safeParse(entry)
      if (result.success) {
        existingDraft.set(result.data.taskId, result.data)
      }
    }
  }

  // Run auto-matcher: skip tasks that already have confirmed entries
  let autoConfirmed = 0
  let pending = 0
  let unmatched = 0
  let skipped = 0

  const newResults: MatchResult[] = []

  for (const task of tasks) {
    const existing = existingDraft.get(task.id)

    // Never modify existing confirmed entries
    if (existing && existing.status === 'confirmed') {
      skipped++
      continue
    }

    const result = matchTask(task, locations)
    newResults.push(result)

    if (result.status === 'confirmed') autoConfirmed++
    else if (result.status === 'pending') pending++
    else unmatched++
  }

  // Merge: existing confirmed entries + new results (existing non-confirmed
  // are replaced by new matches for the same task)
  const confirmedExisting = Array.from(existingDraft.values()).filter(
    (e) => e.status === 'confirmed'
  )

  // Build set of IDs covered by new results
  const newResultIds = new Set(newResults.map((r) => r.taskId))

  // Keep confirmed existing entries that are NOT being replaced
  const preservedConfirmed = confirmedExisting.filter((e) => !newResultIds.has(e.taskId))

  const finalDraft: MatchResult[] = [...preservedConfirmed, ...newResults]

  // Sort by taskId for stable, deterministic output
  finalDraft.sort((a, b) => a.taskId.localeCompare(b.taskId))

  // Write output
  ensureDir(path.dirname(draftPath))
  writeJsonFile(draftPath, finalDraft)

  // Stats report
  const total = tasks.length
  console.log(`\nAuto-match complete for league: ${leagueId}`)
  console.log(`  Total tasks:        ${total}`)
  console.log(`  Auto-confirmed:     ${autoConfirmed + skipped} (≥0.8 confidence)`)
  console.log(`    Skipped (already confirmed): ${skipped}`)
  console.log(`    Newly confirmed:  ${autoConfirmed}`)
  console.log(`  Pending review:     ${pending} (0.5–0.79 confidence)`)
  console.log(`  Unmatched:          ${unmatched} (no match found)`)
  console.log(`\nOutput written to: data/matched-draft.json`)
}

main()
