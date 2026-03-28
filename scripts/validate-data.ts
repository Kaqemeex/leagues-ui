/**
 * validate-data.ts — Assembly L5 Validation Script
 *
 * Reads a league bundle from data/leagues/<leagueId>.json, parses it with
 * LeagueSchema, runs referential integrity checks, and prints a summary.
 *
 * Usage:
 *   tsx scripts/validate-data.ts [--league <id>]
 *
 * Default league: sample
 *
 * Exit codes:
 *   0 — valid (or file missing — graceful warning)
 *   1 — schema error or referential integrity failure
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { LeagueSchema } from '../src/schemas/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ValidationError {
  check: string
  message: string
}

function readJsonFile(filePath: string): unknown | null {
  if (!fs.existsSync(filePath)) {
    return null
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as unknown
  } catch (err) {
    return null
  }
}

function printResult(label: string, passed: boolean, detail?: string): void {
  const icon = passed ? '✓' : '✗'
  const line = detail ? `  ${icon} ${label}: ${detail}` : `  ${icon} ${label}`
  console.log(line)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  // Parse --league flag; default to 'sample'
  const args = process.argv.slice(2)
  const leagueFlagIdx = args.indexOf('--league')
  const leagueId: string =
    leagueFlagIdx !== -1 ? (args[leagueFlagIdx + 1] ?? 'sample') : 'sample'

  const bundlePath = path.join(ROOT, 'data', 'leagues', `${leagueId}.json`)

  console.log(`\nValidating league bundle: ${bundlePath}`)
  console.log('─'.repeat(60))

  // Graceful missing-file handling
  if (!fs.existsSync(bundlePath)) {
    console.warn(`[WARN] Bundle not found: ${bundlePath}`)
    console.warn(`[WARN] Run 'npm run build-data -- --league ${leagueId}' first.`)
    console.log('\nResult: SKIPPED (no bundle to validate)\n')
    process.exit(0)
  }

  // Load raw JSON
  const raw = readJsonFile(bundlePath)
  if (raw === null) {
    console.error(`[ERROR] Could not read or parse: ${bundlePath}`)
    process.exit(1)
  }

  const errors: ValidationError[] = []

  // ---------------------------------------------------------------------------
  // Check 1: Schema validation
  // ---------------------------------------------------------------------------
  const parsed = LeagueSchema.safeParse(raw)

  if (!parsed.success) {
    printResult('Schema validation', false)
    console.error('\n  Schema errors:')
    for (const issue of parsed.error.issues) {
      console.error(`    - [${issue.path.join('.')}] ${issue.message}`)
    }
    errors.push({ check: 'schema', message: parsed.error.toString() })
    // No point continuing if schema is invalid
    console.log('\nResult: FAIL — schema invalid\n')
    process.exit(1)
  }

  printResult('Schema validation', true)

  const league = parsed.data
  const tasks = league.tasks ?? []
  const locations = league.locations ?? []
  const taskLocations = league.taskLocations ?? []

  // ---------------------------------------------------------------------------
  // Check 2: No duplicate task IDs
  // ---------------------------------------------------------------------------
  const taskIds = tasks.map((t) => t.id)
  const taskIdSet = new Set<string>()
  const duplicateTaskIds: string[] = []

  for (const id of taskIds) {
    if (taskIdSet.has(id)) {
      duplicateTaskIds.push(id)
    } else {
      taskIdSet.add(id)
    }
  }

  const noDupTasks = duplicateTaskIds.length === 0
  printResult(
    'No duplicate task IDs',
    noDupTasks,
    noDupTasks ? `${taskIdSet.size} unique tasks` : `duplicates: ${duplicateTaskIds.join(', ')}`
  )
  if (!noDupTasks) {
    errors.push({
      check: 'duplicate-task-ids',
      message: `Duplicate task IDs: ${duplicateTaskIds.join(', ')}`,
    })
  }

  // ---------------------------------------------------------------------------
  // Check 3: No duplicate location IDs
  // ---------------------------------------------------------------------------
  const locationIds = locations.map((l) => l.id)
  const locationIdSet = new Set<string>()
  const duplicateLocationIds: string[] = []

  for (const id of locationIds) {
    if (locationIdSet.has(id)) {
      duplicateLocationIds.push(id)
    } else {
      locationIdSet.add(id)
    }
  }

  const noDupLocations = duplicateLocationIds.length === 0
  printResult(
    'No duplicate location IDs',
    noDupLocations,
    noDupLocations
      ? `${locationIdSet.size} unique locations`
      : `duplicates: ${duplicateLocationIds.join(', ')}`
  )
  if (!noDupLocations) {
    errors.push({
      check: 'duplicate-location-ids',
      message: `Duplicate location IDs: ${duplicateLocationIds.join(', ')}`,
    })
  }

  // ---------------------------------------------------------------------------
  // Check 4: Every taskLocation.taskId exists in tasks
  // ---------------------------------------------------------------------------
  const badTaskRefs = taskLocations
    .filter((tl) => !taskIdSet.has(tl.taskId))
    .map((tl) => tl.taskId)

  const taskRefsOk = badTaskRefs.length === 0
  printResult(
    'taskLocation.taskId references valid',
    taskRefsOk,
    taskRefsOk
      ? `${taskLocations.length} task-location links`
      : `unknown task IDs: ${[...new Set(badTaskRefs)].join(', ')}`
  )
  if (!taskRefsOk) {
    errors.push({
      check: 'task-id-refs',
      message: `taskLocation entries reference unknown task IDs: ${[...new Set(badTaskRefs)].join(', ')}`,
    })
  }

  // ---------------------------------------------------------------------------
  // Check 5: Every taskLocation.locationId exists in locations
  // ---------------------------------------------------------------------------
  const badLocationRefs = taskLocations
    .filter((tl) => !locationIdSet.has(tl.locationId))
    .map((tl) => tl.locationId)

  const locationRefsOk = badLocationRefs.length === 0
  printResult(
    'taskLocation.locationId references valid',
    locationRefsOk,
    locationRefsOk
      ? 'all location refs resolve'
      : `unknown location IDs: ${[...new Set(badLocationRefs)].join(', ')}`
  )
  if (!locationRefsOk) {
    errors.push({
      check: 'location-id-refs',
      message: `taskLocation entries reference unknown location IDs: ${[...new Set(badLocationRefs)].join(', ')}`,
    })
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log('─'.repeat(60))
  console.log(`League:     ${league.name} (${league.id})`)
  console.log(`Tasks:      ${tasks.length}`)
  console.log(`Locations:  ${locations.length}`)
  console.log(`Links:      ${taskLocations.length}`)
  console.log(`Regions:    ${league.regions.length}`)

  if (errors.length > 0) {
    console.log(`\nResult: FAIL — ${errors.length} check(s) failed\n`)
    process.exit(1)
  }

  console.log('\nResult: PASS\n')
  process.exit(0)
}

main()
