/**
 * item-location strategy: match tasks that mention an item name (e.g. "coal",
 * "iron ore") to locations where that activity occurs.
 *
 * Returns confidence 0.5 on match, null on no match.
 */

import type { NormalizedTask, NormalizedLocation } from '../normalize.js'
import { filterByRegion } from './region-filter.js'

/**
 * Maps item name keywords (lowercased) to wiki marker category strings.
 * When a task mentions one of these items, we look for locations in the
 * corresponding category.
 */
const ITEM_TO_CATEGORY: Array<{ items: string[]; category: string }> = [
  // Mining items
  { items: ['coal', 'iron ore', 'gold ore', 'mithril ore', 'adamantite ore', 'runite ore', 'copper ore', 'tin ore', 'silver ore', 'amethyst', 'granite', 'sandstone'], category: 'Mining' },
  // Fishing items
  { items: ['raw shrimp', 'raw sardine', 'raw herring', 'raw trout', 'raw salmon', 'raw tuna', 'raw lobster', 'raw swordfish', 'raw shark', 'raw monkfish', 'raw anglerfish', 'raw karambwan', 'raw cave eel', 'raw manta ray', 'raw sea turtle'], category: 'Fishing' },
  // Woodcutting items
  { items: ['logs', 'oak logs', 'willow logs', 'maple logs', 'yew logs', 'magic logs', 'teak logs', 'mahogany logs', 'redwood logs', 'achey tree logs'], category: 'Woodcutting' },
  // Farming produce
  { items: ['potato', 'onion', 'cabbage', 'tomato', 'sweetcorn', 'strawberry', 'watermelon', 'snape grass', 'guam', 'marrentill', 'tarromin', 'harralander', 'ranarr', 'toadflax', 'irit', 'avantoe', 'kwuarm', 'snapdragon', 'cadantine', 'lantadyme', 'dwarf weed', 'torstol'], category: 'Farming' },
  // Crafting items
  { items: ['leather', 'green dragonhide', 'blue dragonhide', 'red dragonhide', 'black dragonhide', 'gold bar', 'silver bar', 'molten glass', 'battlestaff', 'ruby', 'diamond', 'emerald', 'sapphire'], category: 'Crafting' },
  // Smithing items
  { items: ['bronze bar', 'iron bar', 'steel bar', 'mithril bar', 'adamant bar', 'rune bar', 'dart tip', 'arrowtip', 'sword', 'platebody', 'platelegs', 'chainbody', 'kiteshield', 'med helm', 'full helm', 'sq shield'], category: 'Smithing' },
  // Cooking items
  { items: ['cooked shrimp', 'cooked sardine', 'cooked herring', 'cooked trout', 'cooked salmon', 'cooked tuna', 'cooked lobster', 'cooked swordfish', 'cooked shark', 'bread', 'cake', 'pie', 'stew'], category: 'Cooking' },
  // Herblore items
  { items: ['attack potion', 'strength potion', 'defence potion', 'prayer potion', 'super attack', 'super strength', 'super defence', 'ranging potion', 'magic potion', 'antipoison', 'antidote', 'energy potion', 'stamina potion', 'super restore', 'saradomin brew', 'zamorak brew'], category: 'Herblore' },
]

export function itemLocation(
  task: NormalizedTask,
  locations: NormalizedLocation[]
): { locationId: string; locationName: string; confidence: 0.5 } | null {
  const taskNameNorm = task.name.toLowerCase()

  let matchedCategory: string | null = null

  outer: for (const { items, category } of ITEM_TO_CATEGORY) {
    for (const item of items) {
      if (taskNameNorm.includes(item)) {
        matchedCategory = category
        break outer
      }
    }
  }

  if (!matchedCategory) return null

  // Filter by region first, then by category
  const regionFiltered = filterByRegion(locations, task.regionSlug)
  const categoryFiltered = regionFiltered.filter(
    (loc) => loc.category.toLowerCase() === matchedCategory!.toLowerCase()
  )

  if (categoryFiltered.length === 0) return null

  const best = categoryFiltered[0]!
  return {
    locationId: best.id,
    locationName: best.name,
    confidence: 0.5,
  }
}
