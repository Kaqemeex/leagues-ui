# Leagues Planner — Data Design

## Overview

All task data is static and league-scoped. The data model is designed to be
flat enough to filter efficiently in the browser, while rich enough to drive the
map view, route planner, and tracker without additional lookups.

---

## Schema architecture

**Zod is the source of truth for all data shapes.** TypeScript types are
inferred from Zod schemas — never written by hand.

```ts
// src/schemas/task.ts
export const TaskSchema = z.object({ ... });
export type Task = z.infer<typeof TaskSchema>;
```

All schemas live in `src/schemas/` and are imported by both the app and the
data pipeline scripts. This guarantees the pipeline can never write a bundle
the app can't parse.

```
src/schemas/
  core.ts          — Skill, Difficulty, ActivityType enums
  league.ts        — League, Region, PointTier
  task.ts          — Task, TaskLocation, Requirement, Relic
  location.ts      — Location, LocationRef
  teleport.ts      — Teleport
  user-state.ts    — UserState, TaskList, RoutePlan, RouteStop, TeleportProfile
  index.ts         — re-exports everything

scripts/           — pipeline scripts import from src/schemas/
data/              — JSON files validated against src/schemas/ at build time
```

**Directory split**: `src/schemas/` contains Zod schema definitions and inferred types; `src/lib/` contains runtime utilities (storage, map helpers, export functions) that import from schemas but contain no schema definitions.

**Three validation call sites:**
1. `scripts/build-data.ts` — validates the assembled bundle before writing it
2. App startup — `LeagueSchema.parse(leagueJson)` when loading the data bundle
3. localStorage load — `UserStateSchema.safeParse(raw)` on every app init;
   falls back to default state on failure rather than crashing

---

## League Definition

One file per league: `data/leagues/{league-id}.json`

```ts
interface League {
  id: string;              // e.g. "trailblazer-reloaded"
  name: string;            // e.g. "Trailblazer Reloaded League"
  year: number;
  regions: Region[];
  tasks: Task[];
  relics: Relic[];
  tiers: PointTier[];      // trophy tiers with point thresholds
}
```

---

## Region

Regions define both the geographic areas that can be unlocked and the category
tag used to group tasks.

```ts
interface Region {
  id: string;              // e.g. "kourend"
  name: string;            // e.g. "Kourend & Kebos"
  color: string;           // hex — used to tint map overlays and filter pills
  mapBounds?: MapBounds;   // bounding box on the OSRS tile map, optional
  polygon?: [number, number][];  // polygon vertices for map overlay rendering, optional
}
```

---

## Task

The central data type. Each task belongs to exactly one league and zero or one
region (`null` → General / unrestricted).

```ts
interface Task {
  id: string;                  // stable unique ID, e.g. "tbr-1042"
  leagueId: string;
  name: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Elite" | "Master";
  points: number;
  regionId: string | null;     // null = General

  // Where to do it — one task may be completable in multiple spots
  locations: TaskLocation[];

  // What you need first
  requirements: Requirement[];

  // Which skills are exercised (for skill-based filtering)
  skills: Skill[];

  // Optional — which relic (if any) enables or enhances this task
  relicIds: string[];

  // Populated from wiki completion data; 0–1 float
  completionRate?: number;

  // Free-form tags for additional filtering (e.g. "boss", "slayer", "prayer")
  tags: string[];
}
```

### TaskLocation

This drives the map view. Each location is a named zone, not a raw tile
coordinate. Multiple tasks share locations (e.g. "Lumbridge Swamp Mines").

```ts
interface TaskLocation {
  locationId: string;   // foreign key into Location table
  notes?: string;       // e.g. "requires entering the inner ring"
}
```

---

## Location

A named in-game place. Locations are shared across tasks and are the unit
displayed on the map (with a label, not an icon).

```ts
interface Location {
  id: string;
  name: string;         // e.g. "Fossil Island — Mushroom Meadow"
  regionId: string;

  // Tile coordinates on the OSRS world map
  tile: { x: number; y: number; plane: number };

  // Activities you can do here — drives the map label
  activities: ActivityType[];

  // Optional polygon for area highlighting on the map
  polygon?: [number, number][];
}

// A reference to a Location by its id field.
// Used wherever a field references a Location without embedding it.
type LocationRef = string;

type ActivityType =
  | "fishing"
  | "woodcutting"
  | "mining"
  | "farming"
  | "agility"
  | "thieving"
  | "slayer"
  | "combat"
  | "crafting"
  | "cooking"
  | "firemaking"
  | "herblore"
  | "runecraft"
  | "prayer"
  | "quest"
  | "boss"
  | "minigame"
  | "other";
```

---

## Requirement

Requirements gate task eligibility. They inform the planner's ordering logic.

```ts
type Requirement =
  | { type: "skill"; skill: Skill; level: number }
  | { type: "quest"; questId: string; questName: string }
  | { type: "region"; regionId: string }
  | { type: "relic"; relicId: string }
  | { type: "item"; itemId: number; itemName: string };
```

---

## Relic

```ts
interface Relic {
  id: string;
  name: string;
  tier: number;
  description: string;
  // task IDs that are enabled or significantly improved by this relic
  relevantTaskIds: string[];
}
```

---

## PointTier

```ts
interface PointTier {
  name: string;        // e.g. "Adamant Trophy"
  threshold: number;   // points needed
  color: string;       // for display
}
```

---

## Teleport

Teleport data lives in `data/teleports.json` — a static file shared across
leagues, validated against the `Teleport` schema at build time.

```ts
interface Teleport {
  id: string;
  name: string;            // e.g. "Camelot Teleport", "League Bank Teleport"
  origin: LocationRef;     // where you must be to cast/use it (null = anywhere)
  destination: LocationRef;
  castCost: number;        // abstract cost unit (runes, charge, time estimate)
  source:
    | { type: "spell"; spellbook: "standard" | "ancient" | "lunar" | "arceuus" }
    | { type: "item"; itemId: number; itemName: string }
    | { type: "relic"; relicId: string }
    | { type: "league"; description: string };  // leagues-specific (e.g. bank teleport)
  leagueIds: string[];     // which leagues this teleport exists in; [] = all
}
```

Schema lives in `src/schemas/teleport.ts`. The file `data/teleports.json` is
validated against this schema as part of `npm run validate-data`.

---

## User State

Stored in localStorage (key: `leagues-planner-state`). Not part of the static
data bundle.

```ts
interface UserState {
  activeLeagueId: string;
  unlockedRegionIds: string[];
  completedTaskIds: Set<string>;   // serialized as string[]; Zod schema must use z.array(z.string()).transform(arr => new Set(arr)) with a matching .preprocess on parse and a custom serializer on stringify

  // Named unordered task collections — input to route generation
  taskLists: TaskList[];
  activeTaskListId: string | null;

  // Named ordered route plans — generated from a TaskList, then manually tunable
  routePlans: RoutePlan[];
  activeRoutePlanId: string | null;

  // Which teleports the user currently has access to.
  // Simple checklist — user manually toggles as they unlock teleports.
  // Progressive unlock automation (level/relic gating) is deferred.
  enabledTeleportIds: string[];

  // Current skill levels — entered manually in Settings.
  // Used to evaluate skill requirements on tasks (red/green indicators,
  // "meets requirements" filter). Keyed by Skill enum value.
  skillLevels: Partial<Record<Skill, number>>;  // 1–99, omitted = unknown

  preferences: {
    defaultDifficulty: Difficulty[] | null;
    showCompletedOnMap: boolean;
    mapStyle: "osrs" | "high-detail";
  };
}

// Deferred: named teleport profiles, progressive unlock based on skill levels
// or relic tier, automatic detection of accessible teleports.

// An unordered collection of tasks the user wants to do.
// This is the input to route generation.
interface TaskList {
  id: string;
  name: string;
  taskIds: string[];         // unordered
  createdAt: string;         // ISO timestamp
}

// An ordered route derived from a TaskList.
// Created by running auto-sort or by manual ordering.
// Multiple plans can be saved; one is active at a time.
interface RoutePlan {
  id: string;
  name: string;
  sourceTaskListId: string;  // which TaskList this was generated from

  // Ordered stops — each is either a task or a bare location waypoint
  stops: RouteStop[];

  createdAt: string;
  lastModified: string;
}

type RouteStop =
  | { type: "task"; taskId: string }
  | { type: "waypoint"; locationId: string; label?: string };
  // waypoints let the user pin a location (e.g. a bank) with no task attached.
  // Auto-sort starts from the first stop; prepend a waypoint to set a custom start.
```

---

## Data Sources & Build Pipeline

1. **Primary source**: OSRS Wiki task tables (scraped or manually exported to
   JSON for each league).
2. **Location coordinates**: OSRS Wiki map or the community `osrs-map` tile
   datasets.
3. **Teleport data**: `data/teleports.json` — a manually maintained static
   file listing all meaningful OSRS teleports plus league-specific extras.
   Validated against the `Teleport` schema during `npm run validate-data`.
4. **Build step**: a Node script validates and merges the raw inputs into the
   final `League` JSON bundle. Validation catches missing `locationId`
   references, unknown skills, etc.
5. **Versioning**: each league file is immutable after the league ends. In-
   progress leagues may be updated during the season.

---

## Skill Enum

```ts
type Skill =
  | "Attack" | "Strength" | "Defence" | "Ranged" | "Prayer" | "Magic"
  | "Runecraft" | "Construction" | "Hitpoints" | "Agility" | "Herblore"
  | "Thieving" | "Crafting" | "Fletching" | "Slayer" | "Hunter"
  | "Mining" | "Smithing" | "Fishing" | "Cooking" | "Firemaking"
  | "Woodcutting" | "Farming";
```

---

# Implementation Layers

## Layer 1 — Core Task Schema

**Goal**: Establish the foundational TypeScript types and a minimal sample dataset sufficient to type-check the entire task domain.

**Builds on**: Nothing — this is the starting point for all other layers.

**Deliverables**:
- `src/schemas/core.ts` — exports `LeagueSchema`, `RegionSchema`, `TaskSchema`, `SkillSchema`, `DifficultySchema`, `PointTierSchema` Zod schemas and their inferred types (`League`, `Region`, `Task`, `Skill`, `Difficulty`, `PointTier`) exactly as specified in this document
- `data/leagues/sample.json` — a valid `League` JSON file containing exactly 10 tasks across at least 2 regions, covering all 5 difficulty levels and multiple skill values
- `src/schemas/index.ts` — re-exports all schemas and inferred types from `core.ts` as the package's public schema surface
- TypeScript `tsconfig.json` configured with `strict: true` and `noUncheckedIndexedAccess: true`

**Acceptance criteria**:
- `tsc --noEmit` exits 0 with no type errors
- `sample.json` is parseable as `League` without casting (`JSON.parse` result satisfies the interface when typed)
- Every field defined on `Task` is present on at least one task in `sample.json`
- All 5 `Difficulty` variants appear in `sample.json`
- All 23 `Skill` values are representable in the union without TypeScript error

**Out of scope**: `Location`, `TaskLocation`, `Requirement`, `Relic`, `UserState`, `RoutePlan`, build/validation scripts, any UI code.

---

## Layer 2 — Spatial Schema

**Goal**: Extend the type system and sample data with location and spatial types so that every task can be placed on a map.

**Builds on**: Layer 1 (Core Task Schema).

**Deliverables**:
- `src/schemas/location.ts` — exports `LocationSchema`, `TaskLocationSchema`, `ActivityTypeSchema`, and `MapBoundsSchema` Zod schemas and their inferred types as specified in this document
- `src/schemas/core.ts` updated — `Region.mapBounds` typed as `MapBounds`; `Task.locations` typed as `TaskLocation[]`
- `src/schemas/index.ts` updated — re-exports all spatial schemas and inferred types
- `data/leagues/sample.json` updated — includes a top-level `"locations"` array with at least 5 `Location` entries, each with valid `tile` coordinates; every task in the sample references at least one `locationId` that exists in the `locations` array
- `data/locations/shared.json` — placeholder file for locations shared across multiple leagues (may be empty array `[]` at this layer)

**Acceptance criteria**:
- `tsc --noEmit` exits 0 after adding spatial types
- Every `locationId` referenced in `sample.json` tasks resolves to a `Location` entry in the same file (no dangling references)
- All 18 `ActivityType` variants are present in the union without TypeScript error
- At least one `Location` in `sample.json` includes a non-null `polygon` array
- `MapBounds` is used on at least one `Region` in `sample.json`

**Out of scope**: `Requirement`, `Relic`, `UserState`, map rendering, any UI code, the Node validation script.

---

## Layer 3 — Prerequisite Schema

**Goal**: Add requirement and relic types so the planner has everything it needs to model task dependencies and gating conditions.

**Builds on**: Layer 2 (Spatial Schema).

**Deliverables**:
- `src/schemas/prerequisites.ts` — exports `RequirementSchema` (discriminated union) and `RelicSchema` Zod schemas and their inferred types as specified in this document
- `src/schemas/index.ts` updated — re-exports all prerequisite schemas and inferred types
- `data/leagues/sample.json` updated — at least 5 tasks have non-empty `requirements` arrays covering all 5 `Requirement` type variants (`skill`, `quest`, `region`, `relic`, `item`); the `relics` array contains at least 3 `Relic` entries with non-empty `relevantTaskIds`
- `src/schemas/__tests__/prerequisites.test.ts` — a compile-time exhaustiveness test: a `switch` over `Requirement["type"]` that TypeScript rejects if any variant is unhandled (using `never` assertion in the default branch)

**Acceptance criteria**:
- `tsc --noEmit` exits 0
- The exhaustiveness test file compiles without errors, confirming all `Requirement` type variants are handled
- Adding a hypothetical new variant to the `Requirement` union causes the exhaustiveness test to produce a TypeScript error (verified manually or via a separate `.ts` fixture)
- Every `relicId` referenced in task `relicIds` arrays resolves to a `Relic` entry in `sample.json`
- Every `regionId` in `Requirement` entries resolves to a `Region` in `sample.json`

**Out of scope**: `UserState`, `RoutePlan`, localStorage serialization, the Node build/validation script, any UI code.

---

## Layer 4 — User State Schema

**Goal**: Define the client-side state shape and implement round-trip localStorage serialization with a migration hook so the app can persist and restore user progress.

**Builds on**: Layer 3 (Prerequisite Schema).

**Deliverables**:
- `src/schemas/user-state.ts` — exports `UserStateSchema`, `TaskListSchema`, `RoutePlanSchema`, `RouteStopSchema`, and `PreferencesSchema` Zod schemas and their inferred types; `RoutePlan` and `RouteStop` are implemented with the full shape as defined in the User State schema section above (including `stops: RouteStop[]`, `sourceTaskListId`, and `lastModified`)
- `src/schemas/index.ts` updated — re-exports all user-state schemas and inferred types
- `src/lib/storage.ts` — exports `loadUserState(): UserState`, `saveUserState(state: UserState): void`, and `migrateUserState(raw: unknown): UserState`; uses localStorage key `leagues-planner-state`; `completedTaskIds` is serialized as `string[]` and deserialized back to `Set<string>`
- `src/lib/__tests__/storage.test.ts` — unit tests covering: (a) round-trip serialization, (b) unknown keys in stored JSON are preserved on reload, (c) missing top-level keys in stored JSON are filled with defaults by `migrateUserState`

**Acceptance criteria**:
- `tsc --noEmit` exits 0
- Round-trip test passes: `loadUserState(saveUserState(state))` produces a value deeply equal to the original `state`, including `completedTaskIds` as a `Set`
- Unknown-key preservation test passes: a stored JSON blob with an extra field `"_futureFlag": true` survives `migrateUserState` with that key intact
- Migration test passes: a stored JSON blob missing `preferences` causes `migrateUserState` to return an object with `preferences` populated with defaults rather than throwing
- `saveUserState` does not throw when `completedTaskIds` contains 1000 entries

**Out of scope**: The Node validation script, UI components that read/write state, any data migration for actual production state.

---

## Layer 5 — Build Pipeline

**Goal**: Deliver a runnable Node script that validates raw source data against the full schema and produces the final merged league JSON bundles, so data correctness is enforced at build time rather than at runtime.

**Builds on**: Layer 4 (User State Schema).

**Deliverables**:
- `scripts/validate-data.ts` — Node script (run via `tsx` or compiled) that: loads every file matching `data/leagues/*.json`; validates each against the `League` schema; checks all `locationId` references resolve; checks all `relicId` references resolve; checks all `regionId` references resolve; reports all errors with file name, path, and a human-readable message; exits 0 on success, non-zero on any error
- `scripts/build-data.ts` — merges `data/locations/shared.json` into each league file, writes output to `dist/data/leagues/{league-id}.json`
- `package.json` scripts: `"validate-data": "tsx scripts/validate-data.ts"` and `"build-data": "tsx scripts/build-data.ts"`
- `data/leagues/sample.json` — confirmed valid: `npm run validate-data` exits 0 against it
- `data/leagues/sample-invalid.json` — intentionally broken fixture (one dangling `locationId`) used in CI to assert that the script exits non-zero
- `scripts/__tests__/validate-data.test.ts` — unit tests: (a) valid fixture exits 0, (b) `sample-invalid.json` exits non-zero and error output names the offending `locationId`

**Acceptance criteria**:
- `npm run validate-data` exits 0 when run against `data/leagues/sample.json`
- `npm run validate-data` exits non-zero when run against `sample-invalid.json`, and stdout/stderr contains the string matching the dangling `locationId` value
- `npm run build-data` produces `dist/data/leagues/sample.json` that is parseable as `League`
- Adding a task to `sample.json` that references a non-existent `locationId` causes `validate-data` to exit non-zero without modification to the script
- `tsc --noEmit` still exits 0 after all script files are added

**Out of scope**: CI/CD pipeline configuration, scraping or fetching live wiki data, full Trailblazer Reloaded dataset population, any UI integration.
