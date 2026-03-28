/**
 * annotation-stats.ts — Assembly L4 Read-only Stats Script
 *
 * Prints a summary table of match statuses in data/matched-draft.json.
 *
 * Usage:
 *   tsx scripts/annotation-stats.ts
 *
 * Reads:  data/matched-draft.json
 *
 * Exits 0 always (graceful empty state when the file doesn't exist).
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')
const DRAFT_PATH = path.join(ROOT, 'data', 'matched-draft.json')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MatchResult {
  status: string
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function padEnd(str: string, width: number): string {
  return str.length >= width ? str : str + ' '.repeat(width - str.length)
}

function padStart(str: string, width: number): string {
  return str.length >= width ? str : ' '.repeat(width - str.length) + str
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  if (!fs.existsSync(DRAFT_PATH)) {
    // Print zeros table when file is missing
    const labelWidth = 14
    const countWidth = 7
    const pctWidth = 6

    const header = padEnd('Status', labelWidth) + padStart('Count', countWidth) + padStart('%', pctWidth)
    const divider =
      '─'.repeat(labelWidth) + '  ' + '─'.repeat(countWidth - 2) + '  ' + '─'.repeat(pctWidth - 2)

    console.log('\n' + header)
    console.log(divider)

    const knownOrder = ['confirmed', 'pending', 'rejected', 'unmatched']
    for (const status of knownOrder) {
      console.log(
        padEnd(status, labelWidth) +
          padStart('0', countWidth) +
          padStart('0%', pctWidth)
      )
    }

    console.log(divider)
    console.log(padEnd('Total', labelWidth) + padStart('0', countWidth) + padStart('100%', pctWidth))
    console.log()
    process.exit(0)
  }

  const raw = fs.readFileSync(DRAFT_PATH, 'utf-8')
  const draft = JSON.parse(raw) as MatchResult[]

  const counts: Record<string, number> = {}
  for (const entry of draft) {
    const s = entry.status ?? 'unknown'
    counts[s] = (counts[s] ?? 0) + 1
  }

  const total = draft.length

  // Canonical display order — unknown statuses appended at end
  const knownOrder = ['confirmed', 'pending', 'rejected', 'unmatched']
  const extraKeys = Object.keys(counts).filter((k) => !knownOrder.includes(k))
  const displayOrder = [...knownOrder, ...extraKeys]

  const labelWidth = 14
  const countWidth = 7
  const pctWidth = 6

  const header = padEnd('Status', labelWidth) + padStart('Count', countWidth) + padStart('%', pctWidth)
  const divider =
    '─'.repeat(labelWidth) + '  ' + '─'.repeat(countWidth - 2) + '  ' + '─'.repeat(pctWidth - 2)

  console.log('\n' + header)
  console.log(divider)

  for (const status of displayOrder) {
    const count = counts[status]
    if (count === undefined) continue
    const pct = Math.round((count / total) * 100)
    console.log(
      padEnd(status, labelWidth) +
        padStart(String(count), countWidth) +
        padStart(pct + '%', pctWidth)
    )
  }

  console.log(divider)
  console.log(padEnd('Total', labelWidth) + padStart(String(total), countWidth) + padStart('100%', pctWidth))
  console.log()
}

main()
