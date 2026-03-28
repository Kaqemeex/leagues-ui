/**
 * build-data.ts — Data L5 Build Pipeline
 *
 * Assembles normalized + matched data into final League JSON bundles.
 *
 * Usage:
 *   tsx scripts/build-data.ts [--league <league-id>]
 *
 * Default league: sample
 *
 * Reads:
 *   data/leagues-config.json            — league id → display name mapping
 *   data/normalized/<leagueId>/tasks.json
 *   data/normalized/<leagueId>/locations.json
 *   data/matched-draft.json             — only 'confirmed' entries are used
 *
 * Writes:
 *   data/leagues/<leagueId>.json
 *
 * Exits 0 on success (graceful warning if input files are missing).
 * Exits 1 on schema validation failure or unrecoverable error.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { LeagueSchema } from '../src/schemas/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

// ---------------------------------------------------------------------------
// Config schema
// ---------------------------------------------------------------------------

const LeagueConfigEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
})

const LeaguesConfigSchema = z.object({
  leagues: z.array(LeagueConfigEntrySchema),
})

// ---------------------------------------------------------------------------
// Match result schema
// ---------------------------------------------------------------------------

const MatchResultSchema = z.object({
  taskId: z.string(),
  taskName: z.string(),
  locationId: z.string().nullable(),
  locationName: z.string().nullable(),
  confidence: z.number(),
  strategy: z.string(),
  status: z.enum(['confirmed', 'pending', 'unmatched']),
})

type MatchResult = z.infer<typeof MatchResultSchema>

// ---------------------------------------------------------------------------
// Normalized data schemas (pipeline-internal shapes)
// ---------------------------------------------------------------------------

const NormalizedTaskSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  difficulty: z.string(),
  points: z.number(),
  region: z.string(),
  regionSlug: z.string(),
  completionPct: z.number(),
  wikiUrl: z.string().optional(),
})

const NormalizedLocationSchema = z.object({
  id: z.string(),
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

type NormalizedTask = z.infer<typeof NormalizedTaskSchema>
type NormalizedLocation = z.infer<typeof NormalizedLocationSchema>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readJsonFile(filePath: string): unknown | null {
  if (!fs.existsSync(filePath)) {
    return null
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as unknown
}

function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true })
}

function writeJsonFile(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
}

// ---------------------------------------------------------------------------
// Main build logic
// ---------------------------------------------------------------------------

function main(): void {
  // Parse --league flag; default to 'sample'
  const args = process.argv.slice(2)
  const leagueFlagIdx = args.indexOf('--league')
  const leagueId: string =
    leagueFlagIdx !== -1 ? (args[leagueFlagIdx + 1] ?? 'sample') : 'sample'

  // Load leagues config (optional — fall back to leagueId as name)
  const configPath = path.join(ROOT, 'data', 'leagues-config.json')
  let leagueName = leagueId

  const rawConfig = readJsonFile(configPath)
  if (rawConfig !== null) {
    const config = LeaguesConfigSchema.safeParse(rawConfig)
    if (config.success) {
      const entry = config.data.leagues.find((l) => l.id === leagueId)
      if (entry) {
        leagueName = entry.name
      }
    }
  }

  const normalizedDir = path.join(ROOT, 'data', 'normalized', leagueId)

  // Read normalized tasks
  const tasksPath = path.join(normalizedDir, 'tasks.json')
  const rawTasks = readJsonFile(tasksPath)
  if (rawTasks === null) {
    console.warn(`[WARN] Missing normalized tasks: ${tasksPath}`)
    console.warn(`[WARN] Run normalize first. Exiting.`)
    process.exit(0)
  }
  if (!Array.isArray(rawTasks)) {
    console.warn(`[WARN] Expected array in ${tasksPath}. Exiting.`)
    process.exit(0)
  }

  const normalizedTasks: NormalizedTask[] = rawTasks.map((item) =>
    NormalizedTaskSchema.parse(item)
  )

  // Read normalized locations
  const locationsPath = path.join(normalizedDir, 'locations.json')
  const rawLocations = readJsonFile(locationsPath)
  if (rawLocations === null) {
    console.warn(`[WARN] Missing normalized locations: ${locationsPath}`)
    console.warn(`[WARN] Run normalize first. Exiting.`)
    process.exit(0)
  }
  if (!Array.isArray(rawLocations)) {
    console.warn(`[WARN] Expected array in ${locationsPath}. Exiting.`)
    process.exit(0)
  }

  const normalizedLocations: NormalizedLocation[] = rawLocations.map((item) =>
    NormalizedLocationSchema.parse(item)
  )

  // Read matched-draft.json — only confirmed entries
  const matchedDraftPath = path.join(ROOT, 'data', 'matched-draft.json')
  const rawMatchedDraft = readJsonFile(matchedDraftPath)
  let confirmedMatches: Array<MatchResult & { locationId: string }> = []

  if (rawMatchedDraft === null) {
    console.warn(`[WARN] No matched-draft.json at ${matchedDraftPath} — task-location links will be empty.`)
  } else if (Array.isArray(rawMatchedDraft)) {
    const taskIdSet = new Set(normalizedTasks.map((t) => t.id))
    confirmedMatches = rawMatchedDraft
      .map((item) => MatchResultSchema.safeParse(item))
      .filter((r) => r.success)
      .map((r) => r.data)
      .filter(
        (m): m is MatchResult & { locationId: string } =>
          m.status === 'confirmed' && m.locationId !== null && taskIdSet.has(m.taskId)
      )
  }

  // Assemble League object
  const difficultyMap: Record<string, 'Easy' | 'Medium' | 'Hard' | 'Elite' | 'Master'> = {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    elite: 'Elite',
    master: 'Master',
  }

  const tasks = normalizedTasks.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    region: t.regionSlug,
    difficulty: difficultyMap[t.difficulty.toLowerCase()] ?? ('Easy' as const),
    skills: [] as string[],
    points: t.points,
    requirements: [] as unknown[],
  }))

  const locations = normalizedLocations.map((l) => ({
    id: l.id,
    name: l.name,
    activityTypes: [l.category] as string[],
    tile: l.tile,
    regionId: l.regionHint ?? 'unknown',
  }))

  const taskLocations = confirmedMatches.map((m) => ({
    taskId: m.taskId,
    locationId: m.locationId,
    isPrimary: true,
  }))

  const regionSlugs = Array.from(new Set(normalizedTasks.map((t) => t.regionSlug)))
  const regions = regionSlugs.map((slug) => ({ id: slug, name: slug }))

  const league = {
    id: leagueId,
    name: leagueName,
    regions,
    tasks,
    pointTiers: [],
    locations,
    taskLocations,
  }

  // Validate with LeagueSchema
  const parsed = LeagueSchema.safeParse(league)
  if (!parsed.success) {
    console.error('[ERROR] Schema validation failed:')
    console.error(parsed.error.toString())
    process.exit(1)
  }

  // Write output
  const outDir = path.join(ROOT, 'data', 'leagues')
  ensureDir(outDir)
  const outPath = path.join(outDir, `${leagueId}.json`)
  writeJsonFile(outPath, parsed.data)

  console.log(
    `Built '${leagueName}': ${tasks.length} tasks, ${locations.length} locations, ${taskLocations.length} task-location links`
  )
}

main()
