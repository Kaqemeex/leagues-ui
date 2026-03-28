/**
 * CLI entry point for the normalization stage.
 *
 * Usage:
 *   tsx scripts/normalize-data.ts --league <league-id>
 *
 * Reads:
 *   data/raw/<league-id>/raw-tasks.json
 *   data/raw/<league-id>/raw-locations.json
 *
 * Writes:
 *   data/normalized/<league-id>/tasks.json
 *   data/normalized/<league-id>/locations.json
 *
 * Exits 0 on success, 1 on missing input files or validation errors.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeRawTasks, normalizeRawLocations } from './normalize.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

// ---------------------------------------------------------------------------
// Parse CLI args
// ---------------------------------------------------------------------------

function parseArgs(): { leagueId: string } {
  const args = process.argv.slice(2)
  const leagueIdx = args.indexOf('--league')
  if (leagueIdx === -1 || !args[leagueIdx + 1]) {
    console.error('Usage: tsx scripts/normalize-data.ts --league <league-id>')
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
  const content = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(content)
}

function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true })
}

function writeJsonFile(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const { leagueId } = parseArgs()

  const rawDir = path.join(ROOT, 'data', 'raw', leagueId)
  const outDir = path.join(ROOT, 'data', 'normalized', leagueId)

  const rawTasksPath = path.join(rawDir, 'raw-tasks.json')
  const rawLocationsPath = path.join(rawDir, 'raw-locations.json')

  // Read inputs (exits 1 if missing)
  const rawTasksData = readJsonFile(rawTasksPath)
  const rawLocationsData = readJsonFile(rawLocationsPath)

  if (!Array.isArray(rawTasksData)) {
    console.error(`Expected array in ${rawTasksPath}`)
    process.exit(1)
  }
  if (!Array.isArray(rawLocationsData)) {
    console.error(`Expected array in ${rawLocationsPath}`)
    process.exit(1)
  }

  // Normalize
  let tasks
  let locations
  try {
    tasks = normalizeRawTasks(rawTasksData)
    locations = normalizeRawLocations(rawLocationsData)
  } catch (err) {
    console.error('Normalization failed:', err instanceof Error ? err.message : err)
    process.exit(1)
  }

  // Check for duplicate IDs (belt-and-suspenders; normalizeRaw* already checks)
  const taskIdSet = new Set(tasks.map((t) => t.id))
  if (taskIdSet.size !== tasks.length) {
    console.error('Duplicate task IDs detected in output.')
    process.exit(1)
  }

  const locationIdSet = new Set(locations.map((l) => l.id))
  if (locationIdSet.size !== locations.length) {
    console.error('Duplicate location IDs detected in output.')
    process.exit(1)
  }

  // Write outputs
  ensureDir(outDir)
  writeJsonFile(path.join(outDir, 'tasks.json'), tasks)
  writeJsonFile(path.join(outDir, 'locations.json'), locations)

  console.log(`Normalized ${tasks.length} tasks → data/normalized/${leagueId}/tasks.json`)
  console.log(`Normalized ${locations.length} locations → data/normalized/${leagueId}/locations.json`)
}

main()
