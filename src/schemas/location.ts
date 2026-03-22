import { z } from 'zod'

export const ActivityTypeSchema = z.enum([
  'agility', 'mining', 'fishing', 'slayer', 'farming',
  'woodcutting', 'runecraft', 'smithing', 'cooking',
  'firemaking', 'thieving', 'herblore', 'crafting',
  'fletching', 'hunter', 'construction', 'prayer',
  'magic', 'combat', 'quest', 'other'
])
export type ActivityType = z.infer<typeof ActivityTypeSchema>

export const TileSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
  plane: z.number().int().min(0).max(3).default(0),
})
export type Tile = z.infer<typeof TileSchema>

// LocationRef is a string alias — the id field of a Location
export type LocationRef = string

export const LocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  activityTypes: z.array(ActivityTypeSchema),
  tile: TileSchema,
  regionId: z.string(),
  notes: z.string().optional(),
})
export type Location = z.infer<typeof LocationSchema>

export const TaskLocationSchema = z.object({
  taskId: z.string(),
  locationId: z.string(), // LocationRef
  isPrimary: z.boolean().default(true),
})
export type TaskLocation = z.infer<typeof TaskLocationSchema>
