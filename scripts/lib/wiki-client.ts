/**
 * Rate-limited OSRS Wiki API client with disk cache.
 *
 * - Base URL: https://oldschool.runescape.wiki/api.php
 * - Rate limit: 1 req/s
 * - Disk cache: data/raw/.cache/{sha256-of-params}.json
 * - User-Agent per wiki bot policy
 */

import * as crypto from 'node:crypto'
import * as fs from 'node:fs'
import * as https from 'node:https'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const WIKI_BASE_URL = 'https://oldschool.runescape.wiki/api.php'
const USER_AGENT =
  'leagues-planner-scraper/1.0 (contact: github.com/Kaqemeex/leagues-ui)'
const CACHE_DIR = path.resolve(__dirname, '../../data/raw/.cache')

/** Milliseconds between requests to stay within 1 req/s */
const MIN_INTERVAL_MS = 1000

let lastRequestAt = 0

function getCachePath(params: Record<string, string>): string {
  const canonical = JSON.stringify(
    Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .reduce<Record<string, string>>((acc, [k, v]) => {
        acc[k] = v
        return acc
      }, {}),
  )
  const hash = crypto.createHash('sha256').update(canonical).digest('hex')
  return path.join(CACHE_DIR, `${hash}.json`)
}

function readCache(cachePath: string): unknown | null {
  try {
    const raw = fs.readFileSync(cachePath, 'utf-8')
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

function writeCache(cachePath: string, data: unknown): void {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
  fs.writeFileSync(cachePath, JSON.stringify(data, null, 2), 'utf-8')
}

function buildUrl(params: Record<string, string>): string {
  const allParams: Record<string, string> = { ...params, format: 'json' }
  const qs = Object.entries(allParams)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')
  return `${WIKI_BASE_URL}?${qs}`
}

function httpGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      headers: { 'User-Agent': USER_AGENT },
    }
    const req = https.get(url, options, (res) => {
      if (res.statusCode !== 200) {
        reject(
          new Error(
            `HTTP error: ${res.statusCode} ${res.statusMessage ?? ''} for ${url}`,
          ),
        )
        res.resume()
        return
      }
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
      res.on('error', reject)
    })
    req.on('error', reject)
    req.end()
  })
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Make a request to the OSRS Wiki API, returning the parsed JSON response.
 *
 * Responses are cached to disk by SHA-256 of the parameter set. A cached
 * hit returns immediately without making any HTTP request.
 *
 * Uncached requests are rate-limited to 1 req/s.
 *
 * @throws Error if the HTTP response status is not 200.
 */
export async function wikiRequest(
  params: Record<string, string>,
): Promise<unknown> {
  const cachePath = getCachePath(params)

  const cached = readCache(cachePath)
  if (cached !== null) {
    return cached
  }

  // Rate limiting: ensure at least MIN_INTERVAL_MS between requests
  const now = Date.now()
  const elapsed = now - lastRequestAt
  if (elapsed < MIN_INTERVAL_MS) {
    await sleep(MIN_INTERVAL_MS - elapsed)
  }
  lastRequestAt = Date.now()

  const url = buildUrl(params)
  const raw = await httpGet(url)
  const data: unknown = JSON.parse(raw)

  writeCache(cachePath, data)
  return data
}
