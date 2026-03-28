import { z } from 'zod'
import { LocationSchema, TaskLocationSchema } from './location.js'
import { SkillSchema } from './skill.js'
import { RequirementSchema } from './prerequisite.js'

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
  requirements: z.array(RequirementSchema).default([]),
})

export const LeagueSchema = z.object({
  id: z.string(),
  name: z.string(),
  regions: z.array(RegionSchema),
  tasks: z.array(TaskSchema),
  pointTiers: z.array(PointTierSchema),
  locations: z.array(LocationSchema).optional(),
  taskLocations: z.array(TaskLocationSchema).optional(),
})

export type Difficulty = z.infer<typeof DifficultySchema>
export type PointTier = z.infer<typeof PointTierSchema>
export type Region = z.infer<typeof RegionSchema>
export type Task = z.infer<typeof TaskSchema>
export type League = z.infer<typeof LeagueSchema>
