import { z } from 'zod'

export const SkillSchema = z.enum([
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
])

export const DifficultySchema = z.enum(['Easy', 'Medium', 'Hard', 'Elite', 'Master'])

export const PointTierSchema = z.object({
  tier: z.string(),
  pointsRequired: z.number().int().nonnegative(),
})

export const RegionSchema = z.object({
  id: z.string(),
  name: z.string(),
  polygon: z.array(z.tuple([z.number(), z.number()])).optional(),
})

export const TaskSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  region: z.string(),
  difficulty: DifficultySchema,
  skills: z.array(SkillSchema),
  points: z.number().int().positive(),
  relicTier: z.number().int().nonnegative().optional(),
})

export const LeagueSchema = z.object({
  id: z.string(),
  name: z.string(),
  regions: z.array(RegionSchema),
  tasks: z.array(TaskSchema),
  pointTiers: z.array(PointTierSchema),
})

export type Skill = z.infer<typeof SkillSchema>
export type Difficulty = z.infer<typeof DifficultySchema>
export type PointTier = z.infer<typeof PointTierSchema>
export type Region = z.infer<typeof RegionSchema>
export type Task = z.infer<typeof TaskSchema>
export type League = z.infer<typeof LeagueSchema>
