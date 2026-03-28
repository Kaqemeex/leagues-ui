import { z } from 'zod'
import { SkillSchema } from './skill.js'

export const RequirementTypeSchema = z.enum([
  'skill',
  'quest',
  'item',
  'region',
  'combat_level',
  'total_level',
])
export type RequirementType = z.infer<typeof RequirementTypeSchema>

export const SkillRequirementSchema = z.object({
  type: z.literal('skill'),
  skill: SkillSchema,
  level: z.number().int().min(1).max(99),
})
export type SkillRequirement = z.infer<typeof SkillRequirementSchema>

export const QuestRequirementSchema = z.object({
  type: z.literal('quest'),
  questName: z.string(),
})
export type QuestRequirement = z.infer<typeof QuestRequirementSchema>

export const ItemRequirementSchema = z.object({
  type: z.literal('item'),
  itemName: z.string(),
})
export type ItemRequirement = z.infer<typeof ItemRequirementSchema>

export const RegionRequirementSchema = z.object({
  type: z.literal('region'),
  regionId: z.string(),
})
export type RegionRequirement = z.infer<typeof RegionRequirementSchema>

export const CombatLevelRequirementSchema = z.object({
  type: z.literal('combat_level'),
  level: z.number().int().min(3).max(126),
})
export type CombatLevelRequirement = z.infer<typeof CombatLevelRequirementSchema>

export const TotalLevelRequirementSchema = z.object({
  type: z.literal('total_level'),
  level: z.number().int().min(32).max(2277),
})
export type TotalLevelRequirement = z.infer<typeof TotalLevelRequirementSchema>

export const RequirementSchema = z.discriminatedUnion('type', [
  SkillRequirementSchema,
  QuestRequirementSchema,
  ItemRequirementSchema,
  RegionRequirementSchema,
  CombatLevelRequirementSchema,
  TotalLevelRequirementSchema,
])
export type Requirement = z.infer<typeof RequirementSchema>

export const RelicTierSchema = z.number().int().min(1).max(8)
export type RelicTier = z.infer<typeof RelicTierSchema>

export const RelicSchema = z.object({
  id: z.string(),
  name: z.string(),
  tier: RelicTierSchema,
  region: z.string().optional(),
})
export type Relic = z.infer<typeof RelicSchema>
