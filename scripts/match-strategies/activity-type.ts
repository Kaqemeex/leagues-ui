/**
 * activity-type strategy: match tasks to locations based on activity type
 * keywords in the task name.
 *
 * E.g. "mine" → 'Mining', "fish" → 'Fishing', "cut" → 'Woodcutting'
 *
 * Returns confidence 0.6 on keyword match, null on no match.
 */

import type { NormalizedTask, NormalizedLocation } from '../normalize.js'
import { filterByRegion } from './region-filter.js'

/**
 * Maps task-name keywords (lowercased substrings) to wiki marker category
 * strings (as used in NormalizedLocation.category).
 */
const KEYWORD_TO_CATEGORY: Array<{ keywords: string[]; category: string }> = [
  { keywords: ['mine', 'mining', 'smelt', 'ore', 'coal', 'iron', 'gold', 'mithril', 'adamantite', 'runite'], category: 'Mining' },
  { keywords: ['fish', 'fishing', 'catch', 'harpoon', 'lobster', 'shark', 'trout', 'salmon', 'monkfish', 'anglerfish', 'swordfish', 'tuna', 'shrimp', 'sardine', 'herring', 'pike', 'karambwan'], category: 'Fishing' },
  { keywords: ['chop', 'cut', 'woodcut', 'log', 'teak', 'mahogany', 'magic tree', 'yew', 'maple', 'willow', 'oak'], category: 'Woodcutting' },
  { keywords: ['agility', 'rooftop', 'course', 'obstacle', 'lap'], category: 'Agility' },
  { keywords: ['thieve', 'thief', 'pickpocket', 'stall', 'steal'], category: 'Thieving' },
  { keywords: ['farm', 'farming', 'patch', 'allotment', 'herb patch', 'tree patch'], category: 'Farming' },
  { keywords: ['hunter', 'hunt', 'catch', 'trap', 'chinchompa', 'salamander'], category: 'Hunter' },
  { keywords: ['runecraf', 'altar', 'essence', 'rune crafting'], category: 'Runecraft' },
  { keywords: ['cook', 'cooking', 'bake', 'range', 'fire'], category: 'Cooking' },
  { keywords: ['fletch', 'fletching', 'bow', 'arrow'], category: 'Fletching' },
  { keywords: ['craft', 'crafting', 'spin', 'tan', 'pottery'], category: 'Crafting' },
  { keywords: ['smith', 'smithing', 'anvil', 'bar'], category: 'Smithing' },
  { keywords: ['firemaking', 'light', 'burn'], category: 'Firemaking' },
  { keywords: ['herblore', 'potion', 'grimy', 'clean herb'], category: 'Herblore' },
  { keywords: ['prayer', 'bone', 'bury', 'ashes'], category: 'Prayer' },
  { keywords: ['boss', 'kill', 'defeat', 'slay', 'slayer'], category: 'Slayer' },
]

export function activityType(
  task: NormalizedTask,
  locations: NormalizedLocation[]
): { locationId: string; locationName: string; confidence: 0.6 } | null {
  const taskNameNorm = task.name.toLowerCase()

  // Find the best matching category based on keyword hits
  let matchedCategory: string | null = null

  for (const { keywords, category } of KEYWORD_TO_CATEGORY) {
    for (const kw of keywords) {
      if (taskNameNorm.includes(kw)) {
        matchedCategory = category
        break
      }
    }
    if (matchedCategory) break
  }

  if (!matchedCategory) return null

  // Filter by region first, then by category
  const regionFiltered = filterByRegion(locations, task.regionSlug)
  const categoryFiltered = regionFiltered.filter(
    (loc) => loc.category.toLowerCase() === matchedCategory!.toLowerCase()
  )

  if (categoryFiltered.length === 0) return null

  // Return the first matching location
  const best = categoryFiltered[0]!
  return {
    locationId: best.id,
    locationName: best.name,
    confidence: 0.6,
  }
}
