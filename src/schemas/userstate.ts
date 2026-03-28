import { z } from 'zod'

const CURRENT_VERSION = 1

export const PreferencesSchema = z.object({
  showCompletedOnMap: z.boolean().default(true),
  characterName: z.string().default(''),
})

export const RouteStopSchema = z.object({
  taskId: z.string(),
  locationId: z.string().optional(),
  type: z.enum(['task', 'waypoint']),
})

export const RoutePlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  stops: z.array(RouteStopSchema),
  sourceTaskListId: z.string().optional(),
  lastModified: z.number(), // Unix timestamp ms
})

export const TaskListSchema = z.object({
  id: z.string(),
  name: z.string(),
  taskIds: z.array(z.string()),
  createdAt: z.number(),
  lastModified: z.number(),
})

export const UserStateSchema = z.object({
  version: z.number().int().default(CURRENT_VERSION),
  selectedLeagueId: z.string().default('sample'),
  // completedTaskIds stored as array in JSON, transformed to Set on parse
  completedTaskIds: z
    .array(z.string())
    .transform(arr => new Set(arr))
    .default([]),
  taskLists: z.array(TaskListSchema).default([]),
  activeTaskListId: z.string().optional(),
  routePlans: z.array(RoutePlanSchema).default([]),
  preferences: PreferencesSchema.default({}),
})

// For serialization: convert Set back to array
export type UserState = Omit<z.infer<typeof UserStateSchema>, 'completedTaskIds'> & {
  completedTaskIds: Set<string>
}

export const STORAGE_KEY = 'leagues-ui-userstate'

export function serializeUserState(state: UserState): string {
  return JSON.stringify({
    ...state,
    completedTaskIds: Array.from(state.completedTaskIds),
  })
}

export function deserializeUserState(raw: unknown): UserState {
  const result = UserStateSchema.safeParse(raw)
  if (result.success) return result.data as UserState
  // Migration: unknown version or corrupt data → return defaults
  return UserStateSchema.parse({}) as UserState
}
