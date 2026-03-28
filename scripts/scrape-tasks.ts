/**
 * Scrape league task data from the OSRS Wiki.
 *
 * Usage:
 *   tsx scripts/scrape-tasks.ts --league <league-id>
 *
 * Example:
 *   tsx scripts/scrape-tasks.ts --league trailblazer-reloaded
 *
 * Output: data/raw/<league-id>/raw-tasks.json
 *
 * The scraper merges new tasks into any existing file by task name without
 * modifying existing entries.
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

interface RawTask {
  name: string
  description: string
  difficulty: string
  skills: string[]
  points: number
  region: string
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(): { league: string } {
  const args = process.argv.slice(2)
  const leagueIdx = args.indexOf('--league')
  if (leagueIdx === -1 || !args[leagueIdx + 1]) {
    console.error('Usage: tsx scripts/scrape-tasks.ts --league <league-id>')
    process.exit(1)
  }
  const league = args[leagueIdx + 1]!
  return { league }
}

// ---------------------------------------------------------------------------
// League ID → Wiki page title
// ---------------------------------------------------------------------------

/**
 * Convert a kebab-case league ID to a MediaWiki page title.
 *
 * "trailblazer-reloaded"  → "Trailblazer_Reloaded_League/Tasks"
 * "trailblazer"           → "Trailblazer_League/Tasks"
 * "raging-echoes"         → "Raging_Echoes_League/Tasks"
 */
function leagueIdToPageTitle(leagueId: string): string {
  const titleCase = leagueId
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('_')
  return `${titleCase}_League/Tasks`
}

// ---------------------------------------------------------------------------
// Wikitext parsing
// ---------------------------------------------------------------------------

/**
 * Extract skill names referenced in a task template call or description.
 * Returns an empty array when no skills can be determined.
 */
function extractSkills(text: string): string[] {
  const skillNames = [
    'Attack',
    'Strength',
    'Defence',
    'Ranged',
    'Prayer',
    'Magic',
    'Runecraft',
    'Construction',
    'Hitpoints',
    'Agility',
    'Herblore',
    'Thieving',
    'Crafting',
    'Fletching',
    'Slayer',
    'Hunter',
    'Mining',
    'Smithing',
    'Fishing',
    'Cooking',
    'Firemaking',
    'Woodcutting',
    'Farming',
  ]
  const found: string[] = []
  const lower = text.toLowerCase()
  for (const skill of skillNames) {
    if (lower.includes(skill.toLowerCase())) {
      found.push(skill)
    }
  }
  return found
}

/**
 * Parse points from wikitext — handles plain numbers and template calls.
 */
function parsePoints(raw: string): number {
  const trimmed = raw.trim()
  const n = parseInt(trimmed, 10)
  return isNaN(n) ? 0 : n
}

/**
 * Strip wiki markup from a string (links, templates, bold/italic markers).
 */
function stripWikiMarkup(text: string): string {
  return text
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1') // [[link|text]] → text
    .replace(/{{[^}]*}}/g, '')                          // remove templates
    .replace(/'{2,3}/g, '')                             // bold/italic
    .trim()
}

/**
 * Parse tasks from MediaWiki wikitext.
 *
 * The OSRS Wiki task pages use the {{Leagues task}} template:
 *
 *   {{Leagues task
 *   |name=...
 *   |description=...
 *   |difficulty=...
 *   |points=...
 *   |region=...
 *   |skills=...
 *   }}
 *
 * Falls back to basic wiki-table row parsing when templates are absent.
 */
function parseWikitext(wikitext: string): RawTask[] {
  const tasks: RawTask[] = []

  // -------------------------------------------------------------------------
  // Strategy 1: {{Leagues task}} template blocks
  // -------------------------------------------------------------------------
  const templateRegex = /\{\{Leagues[ _]task\s*\n([\s\S]*?)\n\}\}/gi
  let match: RegExpExecArray | null
  while ((match = templateRegex.exec(wikitext)) !== null) {
    const block = match[1] ?? ''
    const get = (key: string): string => {
      const lineMatch = new RegExp(
        `^\\s*\\|\\s*${key}\\s*=\\s*(.*)$`,
        'im',
      ).exec(block)
      return lineMatch ? stripWikiMarkup(lineMatch[1] ?? '') : ''
    }

    const name = get('name')
    if (!name) continue

    const description = get('description')
    const difficulty = get('difficulty') || 'Easy'
    const pointsRaw = get('points')
    const region = get('region') || get('area') || 'Unknown'
    const skillsRaw = get('skills')

    const skills =
      skillsRaw
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0) || extractSkills(description)

    tasks.push({
      name,
      description,
      difficulty,
      skills,
      points: parsePoints(pointsRaw),
      region,
    })
  }

  if (tasks.length > 0) return tasks

  // -------------------------------------------------------------------------
  // Strategy 2: Wiki table rows  |name||description||difficulty||points||...
  // -------------------------------------------------------------------------
  let currentRegion = 'Unknown'
  const lines = wikitext.split('\n')

  for (const line of lines) {
    // Section header (== Region Name ==)
    const sectionMatch = /^==+\s*([^=]+?)\s*==+/.exec(line)
    if (sectionMatch) {
      currentRegion = stripWikiMarkup(sectionMatch[1] ?? '').trim()
      continue
    }

    // Table row starting with |-  (row separator — skip)
    if (/^\s*\|-/.test(line)) continue

    // Table row with pipe-delimited cells
    const cells = line
      .split('||')
      .map((c) => stripWikiMarkup(c.replace(/^\s*\|/, '').trim()))

    if (cells.length >= 3) {
      const [name, description, difficulty, pointsStr] = cells
      if (!name || !description) continue
      // Heuristic: check if first cell looks like a task name (not a header)
      if (/^(task|name|!)/i.test(name)) continue

      tasks.push({
        name,
        description: description ?? '',
        difficulty: difficulty ?? 'Easy',
        skills: extractSkills(description ?? ''),
        points: parsePoints(pointsStr ?? '0'),
        region: currentRegion,
      })
    }
  }

  return tasks
}

// ---------------------------------------------------------------------------
// File I/O helpers
// ---------------------------------------------------------------------------

function readExistingTasks(filePath: string): RawTask[] {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as RawTask[]
  } catch {
    return []
  }
}

function mergeTasks(existing: RawTask[], incoming: RawTask[]): RawTask[] {
  const byName = new Map<string, RawTask>()
  for (const task of existing) {
    byName.set(task.name, task)
  }
  let added = 0
  for (const task of incoming) {
    if (!byName.has(task.name)) {
      byName.set(task.name, task)
      added++
    }
  }
  if (added > 0) {
    console.log(`  Added ${added} new task(s).`)
  } else {
    console.log('  No new tasks — file unchanged.')
  }
  return Array.from(byName.values())
}

// ---------------------------------------------------------------------------
// API response types
// ---------------------------------------------------------------------------

interface ParseResponse {
  parse?: {
    wikitext?: {
      '*'?: string
    }
  }
  error?: {
    code?: string
    info?: string
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { league } = parseArgs()

  const pageTitle = leagueIdToPageTitle(league)
  console.log(`Scraping tasks for league: ${league}`)
  console.log(`Wiki page: ${pageTitle}`)

  let response: ParseResponse
  try {
    response = (await wikiRequest({
      action: 'parse',
      page: pageTitle,
      prop: 'wikitext',
    })) as ParseResponse
  } catch (err) {
    console.error(`HTTP error fetching wiki page: ${String(err)}`)
    process.exit(1)
  }

  // Handle missing page
  if (response.error) {
    const code = response.error.code ?? ''
    if (code === 'missingtitle' || code === 'missing') {
      console.warn(
        `Warning: Wiki page "${pageTitle}" not found (${response.error.info ?? code}).`,
      )
      console.warn('This is expected for leagues not yet documented on the wiki.')
      process.exit(0)
    }
    console.error(`Wiki API error: ${response.error.info ?? code}`)
    process.exit(1)
  }

  const wikitext = response.parse?.wikitext?.['*'] ?? ''
  if (!wikitext) {
    console.warn(`Warning: Wiki page "${pageTitle}" returned empty wikitext.`)
    process.exit(0)
  }

  console.log(`Parsing wikitext (${wikitext.length} chars)…`)
  const incoming = parseWikitext(wikitext)
  console.log(`Found ${incoming.length} task(s) in wikitext.`)

  const outDir = path.resolve(
    __dirname,
    '../data/raw',
    league,
  )
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'raw-tasks.json')

  const existing = readExistingTasks(outPath)
  const merged = mergeTasks(existing, incoming)

  fs.writeFileSync(outPath, JSON.stringify(merged, null, 2), 'utf-8')
  console.log(`Wrote ${merged.length} task(s) to ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
