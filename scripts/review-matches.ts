/**
 * review-matches.ts — Assembly L4 Annotation / Review CLI
 *
 * Interactive CLI for reviewing and confirming pending auto-match results.
 *
 * Usage:
 *   tsx scripts/review-matches.ts
 *
 * Reads:  data/matched-draft.json
 * Writes: data/matched-draft.json (updated in place after each decision)
 *
 * Exits 0 on success or graceful empty state.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import * as readline from 'node:readline'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')
const DRAFT_PATH = path.join(ROOT, 'data', 'matched-draft.json')

// ---------------------------------------------------------------------------
// Types (must match auto-match.ts MatchResult)
// ---------------------------------------------------------------------------

interface MatchResult {
  taskId: string
  taskName: string
  locationId: string | null
  locationName: string | null
  confidence: number
  strategy: string
  status: 'confirmed' | 'pending' | 'rejected' | 'unmatched'
}

// ---------------------------------------------------------------------------
// File I/O
// ---------------------------------------------------------------------------

function readDraft(): MatchResult[] {
  if (!fs.existsSync(DRAFT_PATH)) return []
  const raw = fs.readFileSync(DRAFT_PATH, 'utf-8')
  return JSON.parse(raw) as MatchResult[]
}

function writeDraft(draft: MatchResult[]): void {
  fs.writeFileSync(DRAFT_PATH, JSON.stringify(draft, null, 2) + '\n', 'utf-8')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const draft = readDraft()

  if (draft.length === 0) {
    console.log('No matched-draft.json found')
    process.exit(0)
  }

  const pendingIndices = draft
    .map((entry, i) => ({ entry, i }))
    .filter(({ entry }) => entry.status === 'pending')
    .map(({ i }) => i)

  const total = pendingIndices.length

  if (total === 0) {
    console.log('No pending matches to review')
    process.exit(0)
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const askLine = (prompt: string): Promise<string> =>
    new Promise((resolve) => rl.question(prompt, resolve))

  let confirmed = 0
  let rejected = 0
  let skipped = 0
  let position = 0

  for (const idx of pendingIndices) {
    position++
    const entry = draft[idx]!

    const confidence = entry.confidence.toFixed(2)
    const locationDisplay =
      entry.locationName && entry.locationId
        ? `"${entry.locationName}" (${entry.locationId})`
        : '(no location)'

    console.log(
      `[${position}/${total}] Task: "${entry.taskName}" (${entry.taskId})\n` +
        `      Match: ${locationDisplay}\n` +
        `      Confidence: ${confidence} — strategy: ${entry.strategy}`
    )

    let decided = false
    while (!decided) {
      const answer = await askLine('Accept? [y/n/s=skip/q=quit]: ')
      const key = answer.trim().toLowerCase()

      switch (key) {
        case 'y':
          entry.status = 'confirmed'
          confirmed++
          writeDraft(draft)
          decided = true
          break

        case 'n':
          entry.status = 'rejected'
          entry.locationId = null
          entry.locationName = null
          rejected++
          writeDraft(draft)
          decided = true
          break

        case 's':
          skipped++
          decided = true
          break

        case 'q':
          rl.close()
          writeDraft(draft)
          printSummary(position - 1, confirmed, rejected, skipped)
          process.exit(0)
          break

        default:
          // Ignore unrecognised input — prompt again
          break
      }
    }
  }

  rl.close()
  writeDraft(draft)
  printSummary(total, confirmed, rejected, skipped)
}

function printSummary(reviewed: number, confirmed: number, rejected: number, skipped: number): void {
  console.log(
    `Reviewed ${reviewed}: ${confirmed} confirmed, ${rejected} rejected, ${skipped} skipped`
  )
}

main().catch((err: unknown) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
