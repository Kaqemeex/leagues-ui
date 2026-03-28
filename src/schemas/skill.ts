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
export type Skill = z.infer<typeof SkillSchema>
