/**
 * Scrape map marker / location data from the OSRS Wiki for each activity category.
 *
 * Usage:
 *   tsx scripts/scrape-locations.ts --league <league-id>
 *
 * Example:
 *   tsx scripts/scrape-locations.ts --league trailblazer-reloaded
 *
 * Output: data/raw/<league-id>/raw-locations.json
 *
 * Uses the wiki geosearch API and the category-map.json file to enumerate all
 * relevant map marker categories. Results are cached so re-runs make 0 HTTP
 * requests.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { wikiRequest } from './lib/wiki-client.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RawLocation {
  name: string
  category: string
  activityType: string
  tile: { x: number; y: number; plane: number }
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(): { league: string } {
  const args = process.argv.slice(2)
  const leagueIdx = args.indexOf('--league')
  if (leagueIdx === -1 || !args[leagueIdx + 1]) {
    console.error(
      'Usage: tsx scripts/scrape-locations.ts --league <league-id>',
    )
    process.exit(1)
  }
  const league = args[leagueIdx + 1]!
  return { league }
}

// ---------------------------------------------------------------------------
// Category map
// ---------------------------------------------------------------------------

function loadCategoryMap(): Record<string, string> {
  const mapPath = path.resolve(__dirname, '../data/raw/category-map.json')
  const raw = fs.readFileSync(mapPath, 'utf-8')
  return JSON.parse(raw) as Record<string, string>
}

// ---------------------------------------------------------------------------
// API response types
// ---------------------------------------------------------------------------

interface GeoSearchResult {
  pageid?: number
  ns?: number
  title?: string
  lat?: number
  lon?: number
  dist?: number
  primary?: string
}

interface GeoSearchResponse {
  query?: {
    geosearch?: GeoSearchResult[]
  }
  error?: {
    code?: string
    info?: string
  }
  'query-continue'?: unknown
}

/**
 * Fetch all geosearch results for a given wiki category label (the
 * category-map.json key, e.g. "Woodcutting_trees").
 *
 * The wiki's geosearch API returns map marker data. We use `gscoord` with a
 * very large radius to capture the entire game map, and page through results
 * using `gsoffset`.
 *
 * Note: The OSRS wiki geosearch endpoint uses coordinates centred on the
 * OSRS world map. Lumbridge is approximately (3222, 3218) in OSRS tile coords,
 * which maps to roughly (lat=3218, lon=3222) in the wiki's coordinate system.
 * We query from the approximate map centre with a large radius.
 */
async function fetchCategoryLocations(
  categoryLabel: string,
): Promise<GeoSearchResult[]> {
  const results: GeoSearchResult[] = []
  const limit = 500

  // Centre of the OSRS map (approximate world centre tile)
  // We use a radius of 20000 game tiles to capture the full world
  const params: Record<string, string> = {
    action: 'query',
    list: 'geosearch',
    gscoord: '3200|3200',
    gsradius: '20000',
    gslimit: String(limit),
    gsprop: 'type|name|dim|country|region|globe',
    gsglobe: 'Gielinor',
    // Filter by category if supported (wiki uses "type" for map marker category)
    gstype: categoryLabel,
  }

  let response: GeoSearchResponse
  try {
    response = (await wikiRequest(params)) as GeoSearchResponse
  } catch (err) {
    console.warn(
      `  Warning: HTTP error fetching category "${categoryLabel}": ${String(err)}`,
    )
    return results
  }

  if (response.error) {
    // Gracefully skip categories the API doesn't recognise
    console.warn(
      `  Warning: API error for category "${categoryLabel}": ${response.error.info ?? response.error.code ?? 'unknown'}`,
    )
    return results
  }

  const hits = response.query?.geosearch ?? []
  results.push(...hits)
  return results
}

// ---------------------------------------------------------------------------
// Tile coordinate conversion
// ---------------------------------------------------------------------------

/**
 * Convert wiki geosearch coordinates to OSRS tile coords.
 *
 * The OSRS wiki uses (lat=y_tile, lon=x_tile) for the Gielinor globe.
 * Plane is not returned by geosearch and defaults to 0.
 */
function toTile(
  hit: GeoSearchResult,
): { x: number; y: number; plane: number } {
  return {
    x: Math.round(hit.lon ?? 0),
    y: Math.round(hit.lat ?? 0),
    plane: 0,
  }
}

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

function deduplicateLocations(locations: RawLocation[]): RawLocation[] {
  const seen = new Set<string>()
  const unique: RawLocation[] = []
  for (const loc of locations) {
    const key = `${loc.name}|${loc.tile.x}|${loc.tile.y}|${loc.tile.plane}`
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(loc)
    }
  }
  return unique
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { league } = parseArgs()

  console.log(`Scraping locations for league: ${league}`)

  const categoryMap = loadCategoryMap()
  const categories = Object.entries(categoryMap)
  console.log(`Processing ${categories.length} categories from category-map.json…`)

  const allLocations: RawLocation[] = []

  for (const [categoryLabel, activityType] of categories) {
    console.log(`  Fetching: ${categoryLabel} → ${activityType}`)
    const hits = await fetchCategoryLocations(categoryLabel)
    console.log(`    Got ${hits.length} result(s)`)

    for (const hit of hits) {
      if (!hit.title) continue
      allLocations.push({
        name: hit.title,
        category: categoryLabel,
        activityType,
        tile: toTile(hit),
      })
    }
  }

  const deduplicated = deduplicateLocations(allLocations)
  console.log(
    `Total: ${allLocations.length} raw → ${deduplicated.length} after deduplication`,
  )

  const outDir = path.resolve(__dirname, '../data/raw', league)
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'raw-locations.json')

  fs.writeFileSync(outPath, JSON.stringify(deduplicated, null, 2), 'utf-8')
  console.log(`Wrote ${deduplicated.length} location(s) to ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
