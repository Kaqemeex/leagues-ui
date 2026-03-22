# Leagues Planner — Full Technical Specification
_Version 1.0 | 2026-03-22_

---

## Table of Contents

- [§1 Project Overview](#1-project-overview)
  - [§1.1 Purpose](#11-purpose)
  - [§1.2 Core User Flows](#12-core-user-flows)
  - [§1.3 Design Principles](#13-design-principles)
  - [§1.4 Non-Goals](#14-non-goals)
- [§2 Tech Stack & Constraints](#2-tech-stack--constraints)
  - [§2.1 Framework & Tooling](#21-framework--tooling)
  - [§2.2 Runtime Constraints](#22-runtime-constraints)
- [§3 Data Architecture](#3-data-architecture)
  - [§3.1 Schema Design Philosophy](#31-schema-design-philosophy)
  - [§3.2 Schema File Layout](#32-schema-file-layout)
  - [§3.3 Validation Call Sites](#33-validation-call-sites)
  - [§3.4 League Definition](#34-league-definition)
  - [§3.5 Region](#35-region)
  - [§3.6 Task](#36-task)
  - [§3.7 TaskLocation](#37-tasklocation)
  - [§3.8 Location](#38-location)
  - [§3.9 Requirement](#39-requirement)
  - [§3.10 Relic](#310-relic)
  - [§3.11 PointTier](#311-pointtier)
  - [§3.12 Teleport](#312-teleport)
  - [§3.13 Skill Enum](#313-skill-enum)
  - [§3.14 User State](#314-user-state)
  - [§3.15 TaskList](#315-tasklist)
  - [§3.16 RoutePlan and RouteStop](#316-routeplan-and-routestop)
  - [§3.17 localStorage Persistence Model](#317-localstorage-persistence-model)
  - [§3.18 Data Sources & Build Pipeline Overview](#318-data-sources--build-pipeline-overview)
- [§4 Application Structure](#4-application-structure)
  - [§4.1 Routes](#41-routes)
  - [§4.2 Navigation](#42-navigation)
  - [§4.3 Global UI Elements](#43-global-ui-elements)
  - [§4.4 Global State — FilterContext](#44-global-state--filtercontext)
  - [§4.5 Global State — useUserState](#45-global-state--useuserstate)
  - [§4.6 Points Chip](#46-points-chip)
  - [§4.7 Settings Page](#47-settings-page)
  - [§4.8 PWA & Offline](#48-pwa--offline)
  - [§4.9 URL State Serialization](#49-url-state-serialization)
  - [§4.10 Site Implementation Layers](#410-site-implementation-layers)
- [§5 Interactive Map](#5-interactive-map)
  - [§5.1 Leaflet Setup](#51-leaflet-setup)
  - [§5.2 OSRS Projection (OsrsCrs)](#52-osrs-projection-osrscrs)
  - [§5.3 Location Markers & Labeled Zone Cards](#53-location-markers--labeled-zone-cards)
  - [§5.4 Zoom Tiers](#54-zoom-tiers)
  - [§5.5 Region Overlays](#55-region-overlays)
  - [§5.6 Map Filters](#56-map-filters)
  - [§5.7 "My List" Overlay](#57-my-list-overlay)
  - [§5.8 Map Controls](#58-map-controls)
  - [§5.9 Location Detail Panel](#59-location-detail-panel)
  - [§5.10 Mobile Layout](#510-mobile-layout)
  - [§5.11 Map Implementation Layers](#511-map-implementation-layers)
- [§6 Route Planner](#6-route-planner)
  - [§6.1 Concepts](#61-concepts)
  - [§6.2 Page Layout](#62-page-layout)
  - [§6.3 Task List Management](#63-task-list-management)
  - [§6.4 Auto-Sort Algorithm](#64-auto-sort-algorithm)
  - [§6.5 Teleport-Aware Routing](#65-teleport-aware-routing)
  - [§6.6 Manual Reordering](#66-manual-reordering)
  - [§6.7 Route Map Overlay](#67-route-map-overlay)
  - [§6.8 Task Card in the Planner](#68-task-card-in-the-planner)
  - [§6.9 Export & Share](#69-export--share)
  - [§6.10 Session Progress](#610-session-progress)
  - [§6.11 Route Planner Implementation Layers](#611-route-planner-implementation-layers)
- [§7 Task Tracker](#7-task-tracker)
  - [§7.1 Tracker Page Layout](#71-tracker-page-layout)
  - [§7.2 Points & Tier Progress](#72-points--tier-progress)
  - [§7.3 Task List in the Tracker](#73-task-list-in-the-tracker)
  - [§7.4 Filters — useTrackerFilteredTasks](#74-filters--usetrackerfiltertedtasks)
  - [§7.5 Region Progress Panels](#75-region-progress-panels)
  - [§7.6 Task Detail Drawer](#76-task-detail-drawer)
  - [§7.7 Bulk Actions](#77-bulk-actions)
  - [§7.8 Export / Import / Share-Progress URL](#78-export--import--share-progress-url)
  - [§7.9 Milestone Notifications](#79-milestone-notifications)
  - [§7.10 Tracker Implementation Layers](#710-tracker-implementation-layers)
- [§8 Data Assembly Pipeline](#8-data-assembly-pipeline)
  - [§8.1 Problem Statement](#81-problem-statement)
  - [§8.2 Task Sourcing & Incrementalism](#82-task-sourcing--incrementalism)
  - [§8.3 Data Sources](#83-data-sources)
  - [§8.4 Pipeline Stages Overview](#84-pipeline-stages-overview)
  - [§8.5 Stage 1 — Scrape Tasks](#85-stage-1--scrape-tasks)
  - [§8.6 Stage 2 — Scrape Locations](#86-stage-2--scrape-locations)
  - [§8.7 Stage 3 — Manual Seed / Annotation File](#87-stage-3--manual-seed--annotation-file)
  - [§8.8 Stage 4 — Auto-Match (Heuristic Linker)](#88-stage-4--auto-match-heuristic-linker)
  - [§8.9 Stage 5 — Human Review UI (Annotation Tool)](#89-stage-5--human-review-ui-annotation-tool)
  - [§8.10 Stage 6 — Validate & Bundle](#810-stage-6--validate--bundle)
  - [§8.11 Incremental Update Flow](#811-incremental-update-flow)
  - [§8.12 Data Assembly Implementation Layers](#812-data-assembly-implementation-layers)
- [§9 Implementation Layers](#9-implementation-layers)
  - [§9.1 Layer Numbering Convention](#91-layer-numbering-convention)
  - [§9.2 Per-Feature Layer Tables](#92-per-feature-layer-tables)
  - [§9.3 Cross-File Dependency Graph](#93-cross-file-dependency-graph)
  - [§9.4 MVP Definition](#94-mvp-definition)

---

## §1 Project Overview

### §1.1 Purpose

A planning and routing tool for OSRS Leagues players. The primary gap this fills versus the wiki is **personalized list-making, rich filtering, and spatial task awareness** — knowing not just what tasks exist, but where to do them, in what order, and whether you've done them.

### §1.2 Core User Flows

1. **Browse & filter tasks** — slice the task list by region, skill, difficulty, relic dependency, completion status, or any combination.
2. **Build a task list** — select tasks from browse results and add them to a personal "run list" for a session or goal.
3. **Plan a route** — given a task list, find an efficient geographic ordering that minimizes travel.
4. **View on the map** — see task locations on an interactive OSRS map; labels show what activities are available at each spot rather than generic icons.
5. **Track completion** — mark tasks done, see point totals and tier progress, and know what's left.

### §1.3 Design Principles

- **Filter-first** — every list is filterable; no page dumps a wall of tasks without controls.
- **Spatial awareness** — tasks should always be linkable to locations; the Map is a first-class view, not an afterthought.
- **Offline-capable** — task data is bundled or cached locally; the app should work without a live network once loaded.
- **League-agnostic data model** — supporting a new league means adding a new data file, not changing application logic.
- **No account required** — state is stored in localStorage by default; optional export/import for backup.

### §1.4 Non-Goals

- Cross-device sync or user accounts.
- Server-side persistence.
- Pre-wiki task entry (tasks are only added once they appear on the wiki).
- Automated polling or scheduled data refresh.

---

## §2 Tech Stack & Constraints

### §2.1 Framework & Tooling

| Concern | Choice |
|---|---|
| Framework | React + TypeScript, bundled with Vite |
| Routing | React Router (client-side, no SSR) |
| Styling | Tailwind CSS |
| Map | Leaflet.js via react-leaflet, custom OSRS CRS shim, wiki tile server |
| State | Zustand, persisted to localStorage. No backend, no sync |
| Data | Static JSON files per league, bundled at build time |
| Validation | Zod — schemas are the source of truth for all data shapes |
| Testing | Playwright — tests drive the locally-running dev server |
| Hosting | Local dev server (`vite dev`) during development. Deployment TBD |

### §2.2 Runtime Constraints

Zod is used at four call sites:
1. Parsing league JSON bundles at app startup (`LeagueSchema.parse(leagueJson)`).
2. Validating localStorage state on load (`UserStateSchema.safeParse(raw)`) — falls back to default state on failure rather than crashing.
3. Parsing URL query params.
4. Validating pipeline output in `scripts/build-data.ts` (replaces bespoke validator logic).

TypeScript `tsconfig.json` must be configured with `strict: true` and `noUncheckedIndexedAccess: true`.

**Directory split**: `src/schemas/` contains Zod schema definitions and inferred types; `src/lib/` contains runtime utilities (storage, map helpers, export functions) that import from schemas but contain no schema definitions.

---

## §3 Data Architecture

### §3.1 Schema Design Philosophy

**Zod is the source of truth for all data shapes.** TypeScript types are inferred from Zod schemas — never written by hand.

```ts
// src/schemas/task.ts
export const TaskSchema = z.object({ ... });
export type Task = z.infer<typeof TaskSchema>;
```

All schemas live in `src/schemas/` and are imported by both the app and the data pipeline scripts. This guarantees the pipeline can never write a bundle the app can't parse.

### §3.2 Schema File Layout

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

### §3.3 Validation Call Sites

**Three validation call sites in the app:**

1. `scripts/build-data.ts` — validates the assembled bundle before writing it.
2. App startup — `LeagueSchema.parse(leagueJson)` when loading the data bundle.
3. localStorage load — `UserStateSchema.safeParse(raw)` on every app init; falls back to default state on failure rather than crashing.

### §3.4 League Definition

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

### §3.5 Region

Regions define both the geographic areas that can be unlocked and the category tag used to group tasks.

```ts
interface Region {
  id: string;              // e.g. "kourend"
  name: string;            // e.g. "Kourend & Kebos"
  color: string;           // hex — used to tint map overlays and filter pills
  mapBounds?: MapBounds;   // bounding box on the OSRS tile map, optional
  polygon?: [number, number][];  // polygon vertices for map overlay rendering, optional
}
```

### §3.6 Task

The central data type. Each task belongs to exactly one league and zero or one region (`null` = General / unrestricted).

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

### §3.7 TaskLocation

This drives the map view. Each location is a named zone, not a raw tile coordinate. Multiple tasks share locations (e.g. "Lumbridge Swamp Mines").

```ts
interface TaskLocation {
  locationId: string;   // foreign key into Location table
  notes?: string;       // e.g. "requires entering the inner ring"
}
```

### §3.8 Location

A named in-game place. Locations are shared across tasks and are the unit displayed on the map (with a label, not an icon).

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

### §3.9 Requirement

Requirements gate task eligibility. They inform the planner's ordering logic.

```ts
type Requirement =
  | { type: "skill"; skill: Skill; level: number }
  | { type: "quest"; questId: string; questName: string }
  | { type: "region"; regionId: string }
  | { type: "relic"; relicId: string }
  | { type: "item"; itemId: number; itemName: string };
```

A compile-time exhaustiveness test is required: `src/schemas/__tests__/prerequisites.test.ts` must contain a `switch` over `Requirement["type"]` that TypeScript rejects if any variant is unhandled (using `never` assertion in the default branch).

### §3.10 Relic

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

### §3.11 PointTier

```ts
interface PointTier {
  name: string;        // e.g. "Adamant Trophy"
  threshold: number;   // points needed
  color: string;       // for display
}
```

### §3.12 Teleport

Teleport data lives in `data/teleports.json` — a static file shared across leagues, validated against the `Teleport` schema at build time (`npm run validate-data`). Schema lives in `src/schemas/teleport.ts`.

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

(`LocationRef` is the `string` type alias in `src/schemas/location.ts` referencing a `Location.id`.)

### §3.13 Skill Enum

```ts
type Skill =
  | "Attack" | "Strength" | "Defence" | "Ranged" | "Prayer" | "Magic"
  | "Runecraft" | "Construction" | "Hitpoints" | "Agility" | "Herblore"
  | "Thieving" | "Crafting" | "Fletching" | "Slayer" | "Hunter"
  | "Mining" | "Smithing" | "Fishing" | "Cooking" | "Firemaking"
  | "Woodcutting" | "Farming";
```

### §3.14 User State

Stored in localStorage (key: `leagues-planner-state`). Not part of the static data bundle.

```ts
interface UserState {
  activeLeagueId: string;
  unlockedRegionIds: string[];
  completedTaskIds: Set<string>;
  // serialized as string[]; Zod schema must use:
  //   z.array(z.string()).transform(arr => new Set(arr))
  // with a matching .preprocess on parse and a custom serializer on stringify

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
```

Deferred: named teleport profiles, progressive unlock based on skill levels or relic tier, automatic detection of accessible teleports.

### §3.15 TaskList

```ts
// An unordered collection of tasks the user wants to do.
// This is the input to route generation.
interface TaskList {
  id: string;
  name: string;
  taskIds: string[];         // unordered
  createdAt: string;         // ISO timestamp
}
```

### §3.16 RoutePlan and RouteStop

```ts
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

### §3.17 localStorage Persistence Model

- **Key**: `leagues-planner-state`
- **Serialization**: `src/lib/storage.ts` exports `loadUserState(): UserState`, `saveUserState(state: UserState): void`, and `migrateUserState(raw: unknown): UserState`.
- `completedTaskIds` is serialized as `string[]` and deserialized back to `Set<string>`.
- On load failure (`safeParse` returns error), reset to defaults without throwing.
- Migration: if localStorage schema version is missing or mismatched, reset to defaults. Unknown keys in stored JSON are preserved on reload (`_futureFlag` pattern).
- State is per-league (scoped by `leagueId`).

### §3.18 Data Sources & Build Pipeline Overview

1. **Primary source**: OSRS Wiki task tables (scraped or manually exported to JSON for each league).
2. **Location coordinates**: OSRS Wiki map or the community `osrs-map` tile datasets.
3. **Teleport data**: `data/teleports.json` — a manually maintained static file listing all meaningful OSRS teleports plus league-specific extras. Validated against the `Teleport` schema during `npm run validate-data`.
4. **Build step**: `scripts/build-data.ts` validates and merges the raw inputs into the final `League` JSON bundle. Validates missing `locationId` references, unknown skills, etc.
5. **Versioning**: each league file includes a `dataVersion` integer that increments on every rebuild. The app detects a version bump on load and refreshes its cached data. Historical league files are immutable after the league ends; in-progress leagues may be updated during the season.

See §8 for the full data assembly pipeline specification.

---

## §4 Application Structure

### §4.1 Routes

| Route | Name | Description |
|---|---|---|
| `/` | Dashboard | League summary: current points, tier progress, region unlocks, quick links to active list and recent activity. |
| `/tasks` | Task Browser | Filterable, sortable table/list of all tasks for the selected league. |
| `/map` | Task Map | Interactive map with labeled activity zones rather than raw interaction-spot icons. |
| `/planner` | Route Planner | Ordered task list with travel-path overlay on the map. |
| `/track` | Tracker | Completion state — checked-off tasks, points earned, tier milestones. |
| `/settings` | Settings | Active league selection, character name (for optional wiki sync), display preferences. |

All routing is client-side (React Router). No SSR.

### §4.2 Navigation

```
Header
  Logo / title
  League selector
  Search bar
  Points chip
  Nav links: Tasks | Map | Planner | Tracker | Settings

Main content area (route-driven)

Footer
  Data source attribution (OSRS Wiki)
  GitHub link
```

`LeagueContext` reads available league names from `data/leagues/index.json` (produced by Assembly Layer 5) and exposes the currently selected league ID to all descendants. During development before assembly is complete, a hardcoded stub list is acceptable. Switching the league selector updates the context value; filter state resets to "all regions, empty search" on league change.

### §4.3 Global UI Elements

- **League selector** — dropdown in the nav; all data is scoped to the chosen league (e.g. Trailblazer Reloaded, Raging Echoes). Defaults to the most recent league.
- **Search bar** — fuzzy search across task names and descriptions, always visible in the header. Wired to `FilterContext.searchQuery`.
- **Points summary chip** — compact display of `earned / total` points and current trophy tier, visible on every page. See §4.6.
- **Region filter pills** — quick-toggle region filters persistent across the Task Browser and Map views, so unlocking two regions narrows everything to those regions automatically.

### §4.4 Global State — FilterContext

`FilterContext` (or equivalent Zustand store) holds:

```ts
interface FilterState extends BaseFilterState {
  activeRegions: Set<RegionId>;
  searchQuery: string;
  // reset action
}

// Shared base type (see §4.9 for URL param keys)
interface BaseFilterState {
  regions: string[];
  searchQuery: string;
}
```

- Region filter pill bar renders one pill per region in the active league. Clicking a pill toggles its region in `FilterContext`.
- `useFilteredTasks(tasks: Task[]): Task[]` hook returns only tasks matching all active region filters AND the search query substring against task name (case-insensitive).
- The same `FilterContext` instance drives both `/tasks` and `/map`.
- Filter state resets to "all regions, empty search" when the active league changes.

### §4.5 Global State — useUserState

`useUserState` is a Zustand store accessed directly — **not** wrapped in a React context. It loads from `localStorage` on mount and writes back on every mutation.

- Initial state: empty `completedTaskIds` set and default preferences.
- Exposes `toggleTask(taskId)`, `markAllFiltered(filteredTaskIds: string[])`, `unmarkAll()`, `importUserState(state: UserState)`, and preference setters.
- `taskListStore` and `routePlanStore` are also imported directly (not wrapped in React contexts). See §6.3 and §6.4.

### §4.6 Points Chip

The points chip component lives in `Header`. It:
- Reads `completedTaskIds` from `useUserState()`.
- Sums point values of completed tasks for the active league.
- Displays `earned / total pts` plus the current trophy tier label.
- Trophy tier is derived from earned points using the league's `PointTier` thresholds and updates reactively.
- Resets to the new league's totals when the league selector changes.

### §4.7 Settings Page

`/settings` contains:
- A working league selector (synced to `LeagueContext`).
- A "Character name" text input.
- At minimum one display preference toggle: `showCompletedOnMap: boolean` from `UserState.preferences`.
- A teleport checklist for toggling `enabledTeleportIds` (grouped by source type: Spells / Items / League / Relic).
- Skill level inputs populating `UserState.skillLevels` (1–99 per skill).
- All values saved via `useUserState()` on change and survive hard page reload.

### §4.8 PWA & Offline

Implemented in Site Layer 5:
- Service worker registered via Vite PWA plugin (e.g. `vite-plugin-pwa`) with a precache manifest covering all static assets and league JSON files bundled at build time.
- `manifest.json` with app name, icons at 192×192 and 512×512, `display: standalone`, and appropriate `start_url`.
- `npm run build` produces a `dist/` directory with a valid service worker and precache manifest; no uncached network requests are required for core app functionality after first load.
- Offline indicator: when `navigator.onLine` is false, a banner or chip variant signals offline mode; the app remains fully usable for browsing, filtering, and toggling tasks.

### §4.9 URL State Serialization

`BaseFilterState` type with shared dimensions: `{ regions: string[]; searchQuery: string }`. Both `FilterState` (used by `FilterContext`) and the tracker's `TrackerFilters` extend this base.

**Canonical URL param keys** used consistently by both `/tasks` and `/track`:
- `region` — comma-separated region IDs.
- `q` — search query string.

Utilities:
- `filtersToParams(filters: FilterState): URLSearchParams` — encodes `regions` as a comma-separated value under key `region`; `searchQuery` as key `q`.
- `paramsToFilters(params: URLSearchParams): Partial<FilterState>` — decodes the above.
- `paramsToFilters(filtersToParams(f))` must round-trip correctly for any valid `FilterState`.

`FilterContext` reads initial state from the current URL query string on mount, then pushes URL updates via `history.replaceState` (not `pushState`) on every filter change.

Example: navigating to `/tasks?regions=Misthalin,Karamja&q=mine` restores those exact region pills as active and populates the search input with "mine".

### §4.10 Site Implementation Layers

#### Site Layer 1 — App Scaffold

**Goal**: Stand up a runnable project with routing, a nav shell, and a working league selector that exposes league names to the rest of the app via context.

**Builds on**: No prior layers required.

**Deliverables**:
- Vite project initialized with React and TypeScript configured.
- Client-side router installed and configured (React Router v6).
- Route stubs created for `/`, `/tasks`, `/map`, `/planner`, `/track`, and `/settings` — each rendering only its route name as a heading.
- `Header` component with logo/title, league selector `<select>`, search bar `<input>` (not yet wired), points chip placeholder, and nav links to all six routes.
- `Footer` component with OSRS Wiki attribution text and a GitHub link.
- `LeagueContext` that reads available league names from `data/leagues/index.json` (produced by Assembly Layer 5); hardcoded stub list acceptable during development. Switching the selector updates the context value; no data fetch occurs yet.

**Acceptance criteria**:
- `npm run dev` starts without errors and opens the app in a browser.
- Navigating to each of the six routes renders that route's stub heading without a 404.
- The `Header` and `Footer` components are visible on every route.
- Selecting a different league from the dropdown changes the value returned by `LeagueContext`.
- No TypeScript compilation errors at build time.

**Out of scope**: Actual task data loading, search bar functionality, points chip logic, any page content beyond route stubs.

---

#### Site Layer 2 — Static Pages

**Goal**: Every route renders real placeholder content and the task browser displays the full unfiltered task list loaded from a static data file.

**Builds on**: Site Layer 1; Data Layer 1.

**Deliverables**:
- Dashboard (`/`) stub showing league name, a static points placeholder, and labelled empty sections for tier progress, region unlocks, and active list.
- `/tasks` page that reads the active league's static JSON file (resolved via `LeagueContext`) and renders all tasks as rows in a table or card list — columns include task name, region, difficulty, and point value.
- `/map` page with a placeholder `<div>` sized to fill the viewport and a "Map coming soon" label.
- `/planner` page with a two-column layout stub: empty task list on the left, map placeholder on the right.
- `/track` page with a placeholder task list showing all tasks with unchecked checkboxes (state not yet persisted).
- `/settings` page with a league selector (duplicating nav control) and labelled preference stubs (no save logic yet).
- Data-loading utility `loadLeagueTasks(leagueId: string): Task[]` that imports the correct static JSON at build time and returns typed task objects.

**Acceptance criteria**:
- Every route is reachable by direct URL navigation without a blank screen or console error.
- `/tasks` renders one row per task in the sample league JSON.
- Switching the league selector re-renders `/tasks` with data from the newly selected league's JSON.
- All pages pass TypeScript type-checking with no `any` suppressions in new code.
- The app builds to a static bundle with `npm run build` without errors.

**Out of scope**: Filtering, sorting, search, completion state persistence, Leaflet map rendering.

---

#### Site Layer 3 — Global Filter State

**Goal**: Region filter pills and a wired search bar establish shared filter state that simultaneously narrows the task list on `/tasks` and on `/map`.

**Builds on**: Site Layer 2; Data Layer 1 (task schema with `region` field).

**Deliverables**:
- `FilterContext` holding: `activeRegions: Set<RegionId>`, `searchQuery: string`, and a reset action.
- Region filter pill bar component rendering one pill per region; selected pills are visually distinct; clicking toggles the region in `FilterContext`.
- Search bar in `Header` wired to `FilterContext.searchQuery`; updates on each keystroke.
- `useFilteredTasks(tasks: Task[]): Task[]` hook that returns only tasks matching all active region filters AND the search query substring against task name.
- `/tasks` page consumes `useFilteredTasks`.
- Region pill bar rendered on both `/tasks` and `/map`.
- Filter state resets on active league change.

**Acceptance criteria**:
- Toggling a region pill on `/tasks` immediately removes tasks from non-selected regions.
- Toggling the same pill again restores those tasks.
- Entering text in the search bar filters the task list (case-insensitive).
- Navigating from `/tasks` to `/map` and back preserves the current filter state.
- Changing the active league resets all filter pills to unselected and clears the search input.
- No TypeScript errors; `FilterContext` type is fully typed with no `any`.

**Out of scope**: Filtering by difficulty, skill, relic dependency, or completion status; URL serialization of filter state; debounced search.

---

#### Site Layer 4 — Points Chip and Settings

**Goal**: The points chip reflects live earned/total points derived from `UserState`, and the Settings page persists league choice and display preferences across page reloads.

**Builds on**: Site Layer 3; Data Layer 4.

**Deliverables**:
- `useUserState` hook (Zustand store, accessed directly) that loads from `localStorage` on mount and writes back on every mutation; initial state is an empty `completedTaskIds` set and default preferences.
- Points chip component in `Header` (see §4.6).
- Trophy tier derived from earned points using the league's tier thresholds; tier label updates reactively.
- `/track` page checkboxes now write to `useUserState().completedTaskIds` (toggling a checkbox calls `toggleTask(taskId)`).
- `/settings` page with a working league selector (synced to `LeagueContext`), a "Character name" text input, and `showCompletedOnMap: boolean` display preference toggle; all values saved via `useUserState()` on change.
- Settings values survive a hard page reload.
- `useUserState` migration placeholder: if localStorage schema version is missing or mismatched, reset to defaults without throwing.

**Acceptance criteria**:
- Checking a task on `/track` causes the points chip to increment by that task's point value within the same render cycle.
- Unchecking the task decrements the chip back to the prior value.
- The trophy tier label changes when earned points cross the tier threshold.
- Reloading the page after checking tasks shows the same checked state and the same points total.
- Changing the league in `/settings` updates `LeagueContext` and the chip resets to the new league's totals.
- Entering a character name and reloading the page shows the same name pre-filled.
- No TypeScript errors; `UserState` type matches the Data Layer 4 schema.

**Out of scope**: Cross-device sync, export/import of user state, bulk task actions, tier completion toasts, PWA/offline functionality.

---

#### Site Layer 5 — PWA and URL State

**Goal**: The app loads and functions fully offline after the first visit, and all active filter state is serialized to URL query parameters so any filtered view is deep-linkable.

**Builds on**: Site Layer 4; all prior site layers complete.

**Deliverables**:
- Service worker registered via Vite PWA plugin with a precache manifest covering all static assets and league JSON files.
- `manifest.json` with app name, icons at 192×192 and 512×512, `display: standalone`, and appropriate `start_url`.
- `BaseFilterState` type with `{ regions: string[]; searchQuery: string }`.
- `filtersToParams` and `paramsToFilters` utilities (see §4.9).
- `FilterContext` updated to read initial state from URL query string on mount, then push URL updates via `history.replaceState` on every filter change.
- Offline indicator when `navigator.onLine` is false.
- `npm run build` produces `dist/` with a valid service worker and precache manifest.

**Acceptance criteria**:
- After first load, disabling the network in DevTools and reloading the page renders the full app without network errors.
- Copying the URL from a filtered `/tasks` view and opening it in a new tab shows the same region pills active and the same search input.
- `paramsToFilters(filtersToParams(f))` round-trips correctly for any valid `FilterState`.
- The service worker appears as "activated and running" in DevTools Application panel after the first load.
- The `manifest.json` passes Chrome's PWA installability checklist.
- All prior layer acceptance criteria continue to pass.

---

## §5 Interactive Map

### §5.1 Leaflet Setup

- **Base layer**: wiki tile server at `maps.runescape.wiki/osrs/{plane}/{z}/{x}/{y}.png`. Leaflet.js handles pan/zoom; all markers, labels, and overlays are custom React/Leaflet layers rendered on top. No tiles are bundled — the wiki server is the dependency.
- **Tile server URL**: configurable via env var `VITE_TILE_SERVER_URL`.
- **Plane**: passed as a path segment in the tile URL. Plane 0 = surface world.
- **Zoom levels**: tile map supports approximately zoom levels 0–9.

### §5.2 OSRS Projection (OsrsCrs)

- **Coordinate system**: OSRS tile coordinates mapped to Leaflet pixel space via a `L.CRS.Simple`-based custom CRS shim (`OsrsCrs`).
- The wiki's `x, y, plane` triplet is canonical.
- **Note**: verify that react-leaflet v4+ supports custom CRS injection via `MapContainer`'s `crs` prop before implementing `OsrsCrs` — this is a foundational dependency for Map, Planner, and the annotation review UI.
- `mapUtils.ts` exports:
  - `osrsTileToLatLng(x, y): LatLng`
  - `latLngToOsrsTile(latlng): {x, y}`
- Unit test: known OSRS coord (3222, 3218) maps to the expected Leaflet LatLng within ±1px at zoom 7.
- Round-trip test: converting a coord to LatLng and back returns the original tile within ±1.

`usePlane` hook holds the active plane value (default `0`) and exposes a setter. `usePlane` is **component-local to each `MapContainer` instance** (passed via Leaflet's map context), not a global singleton — this prevents the planner's map panel from sharing plane state with the main map.

### §5.3 Location Markers & Labeled Zone Cards

This is the core visual difference from the wiki map. Each `Location` is rendered as a **labeled zone** rather than a point icon:

```
┌────────────────────────┐
│  Lumbridge Swamp Mines │
│  ⛏ mining  🔥 smithing │
│  3 tasks available     │
└────────────────────────┘
```

- The label text is `Location.name`.
- Activity icons (small, color-coded glyphs) list `Location.activities`.
- The task count badge shows how many tasks at this location are currently visible given the active filters. Completed tasks are shown in a muted style unless "show completed" is on.
- Clicking the label opens the Location Detail Panel (see §5.9).

`ACTIVITY_ICONS` constant in `activityIcons.ts` maps each `ActivityType` string to a glyph character or SVG icon component.

Components:
- `<LocationLabel>` — a Leaflet `DivIcon`-based overlay card. Accepts `location: Location`, `taskCount: number`, `hasCompleted: boolean` props.
- `<LocationMarker>` — scaffold `CircleMarker` component used in Layer 2, replaced by `<LocationLabel>` in Layer 3. Do not over-engineer it.
- `<ClusterMarker>` — circle marker showing aggregate task count for a geographic area, rendered at zoom 5–7 using bounding-box grouping.
- `<RegionNameOverlay>` — `DivIcon` label placed at the centroid of each region polygon.

Hooks:
- `useLocations(leagueId)` — loads the active league's location data from bundled JSON, returns `Location[]`.
- `useFilteredTaskCount(locationId)` — returns count of tasks at a location matching current global filter state.
- `useZoomTier(map)` — returns `'region' | 'cluster' | 'label'` based on current zoom.

### §5.4 Zoom Tiers

| Zoom | Rendered content |
|---|---|
| zoom < 5 | Region outlines and `<RegionNameOverlay>` only |
| 5 ≤ zoom < 7 | `<ClusterMarker>` showing task count per area (zone markers begin at zoom ≥ 5); individual location cards hidden |
| zoom ≥ 7 | Full `<LocationLabel>` cards for all locations passing current filters |

A location with 0 tasks matching the current filter is not rendered (hidden, not shown with a 0 badge).

### §5.5 Region Overlays

Each region has a semi-transparent colored polygon overlay on the map (color from `Region.color`).

- `<RegionOverlay>` — a Leaflet `Polygon` rendered for each region using its `region.polygon`, filled with `region.color` at 20% opacity when unlocked and a hatched SVG `PatternFill` at 15% opacity when locked.
- `useRegionLockState(regionId)` — returns `'unlocked' | 'locked'` by reading `UserState.unlockedRegionIds`.
- Locked regions render with a hatched/dimmed pattern. Unlocked regions render with a lighter fill. The difference is visually distinct.
- Overlays can be toggled via an overlay toggle toolbar button (hides all `<RegionOverlay>` polygons without removing location labels).

### §5.6 Map Filters

The same filter state used in the Task Browser is reflected on the map — the map shows only locations that have at least one task matching the current filters. Filter state changed on `/map` is reflected immediately when navigating to the Task Browser (shared `FilterContext`) and vice versa.

`<MapFilterSidebar>` — collapsible sidebar (left edge) containing all filter controls:

| Filter | Options |
|---|---|
| Region | Multi-select pills (only unlocked regions highlighted by default) |
| Difficulty | Easy / Medium / Hard / Elite / Master (multi-toggle) |
| Skills | Multi-select skill list |
| Tags | Free-text tag search (boss, slayer, minigame…) |
| Status | All / Incomplete only / Completed only |
| Has requirements | Show/hide tasks you don't yet meet requirements for |
| Task list | "Only show my list" — highlights locations for tasks in the active TaskList |

`<MapFilterSidebar>` is hidden below breakpoint `768px` and replaced by a filter icon button that opens a drawer.

`useMapFilters()` — composes global `FilterContext` with a `visibleRegionIds` derived value (only regions with ≥1 matching location after filtering).

### §5.7 "My List" Overlay

When the user has an active `TaskList` or `RoutePlan`, a second visual layer highlights relevant locations:

- `<MyListOverlay>` — a second Leaflet marker layer rendered on top of location labels.
- Each location that has ≥1 task in the active `TaskList` gets a colored ring: green (`--color-success`) for fully completed locations, accent (`--color-accent`) for partially or not-started locations.
- This makes it trivial to see "I've done everything in Kandarin except two spots" without filtering.

### §5.8 Map Controls

- **Zoom in / out** buttons.
- **Reset view** — fits the user's unlocked regions into the viewport.
- **Plane toggle** — cycles through available planes (0 → 1 → 2 → 0); tile layer and all marker layers re-render for the active plane.
- **Toggle overlays** — region fill, location labels, route path (if plan active), completed tasks.

### §5.9 Location Detail Panel

Slides in from the right (360px wide, CSS `transform` transition) on desktop, or a bottom sheet on mobile (see §5.10), when a location is clicked.

`<LocationDetailPanel>` contains:
- Location name and region badge.
- Activity type chips (fishing, mining, etc.).
- Task list: all tasks at this location, with difficulty badges and points. Each task has:
  - Difficulty badge and points value.
  - "Add to List" button → calls `taskListStore.addTaskToList(listId, taskId)` (where `listId` is read from `useUserState().activeTaskListId`); shows brief inline confirmation ("Added"); does not add duplicates.
  - Completed tasks shown struck-through.
- "Plan route through here" button → calls `routePlanStore.addWaypoint(locationId)` (the store defined in Route Layer 1).

`useLocationDetail(locationId)` — returns the full `Location` with its resolved tasks, requirements status per task, and completion status from `UserState`.

### §5.10 Mobile Layout

- Bottom sheet (fixed bottom, full-width, 60vh max-height, scrollable) replaces the side panel for location detail when viewport width < 768px.
- Filters collapse into a drawer triggered by a floating filter icon button.
- `<LocationLabel>` touch target size increased to minimum 44×44px via CSS.
- Labels scale up slightly so they're tappable at touch sizes.

### §5.11 Map Implementation Layers

#### Map Layer 1 — Leaflet Scaffold

**Goal**: Mount a functional OSRS-projected Leaflet map in the `/map` route with tile loading, zoom/pan, and correct coordinate system — no data overlays yet.

**Builds on**: Data Layer 2 (spatial schema).

**Deliverables**:
- `<MapView>` component mounted at `/map`, wrapping a Leaflet map instance.
- OSRS tile layer configuration pointing at `VITE_TILE_SERVER_URL`.
- `OsrsCrs` custom Leaflet CRS (see §5.2).
- `usePlane` hook (component-local, default plane 0).
- Zoom control buttons and a "Reset view" button.
- `mapUtils.ts` with `osrsTileToLatLng` and `latLngToOsrsTile`.
- Route `/map` added to app router.

**Acceptance criteria**:
- `/map` route renders without console errors on first load.
- OSRS tile layer is visible; tiles load from the configured tile server.
- Zoom, pan all function correctly.
- `osrsTileToLatLng` unit test: known OSRS coord (3222, 3218) maps to expected Leaflet LatLng within ±1px at zoom 7.
- `latLngToOsrsTile` round-trips within ±1.
- Switching to a non-existent plane shows no tile layer (graceful empty state, no error).

**Out of scope**: Location markers, labels, region overlays, filters, detail panel, cluster logic, mobile layout.

---

#### Map Layer 2 — Point Markers

**Goal**: Render every `Location` from sample data as a simple circle marker at its correct tile position, with a name tooltip on hover.

**Builds on**: Map Layer 1; Data Layer 2 (sample data with 5 locations).

**Deliverables**:
- `useLocations(leagueId)` hook.
- `<LocationMarker>` component (scaffold; will be replaced in Layer 3): Leaflet `CircleMarker` at the converted tile position, visible only when `location.plane === activePlane`.
- `<MapView>` updated to iterate `locations` and render one `<LocationMarker>` per entry.
- Tooltip on each marker showing `location.name` on hover (`permanent: false`).
- Marker visibility gated on zoom: hidden below zoom level 3.

**Acceptance criteria**:
- All 5 locations from sample data appear as circle markers at visually correct positions.
- Hovering a marker shows a tooltip with the exact `location.name` string.
- Markers for plane 0 are visible when `activePlane === 0`; disappear when toggled to 1.
- No marker renders at a null or undefined coordinate (silently skipped with a console warning).
- Switching leagues causes markers to re-render for the new league's locations.

**Out of scope**: Labeled zone card styling, activity icons, task count badges, clustering, region overlays, filters, detail panel.

---

#### Map Layer 3 — Labeled Zone Cards

**Goal**: Replace plain circle markers with fully styled labeled zone cards showing location name, activity icons, and a filtered task count badge, with zoom-gated density levels.

**Builds on**: Map Layer 2; Data Layer 2 (location `activities` array, `TaskLocation` join, task data).

**Deliverables**:
- `<LocationLabel>` component (see §5.3).
- `<ClusterMarker>` component.
- `useZoomTier(map)` hook.
- `<RegionNameOverlay>` component.
- `useFilteredTaskCount(locationId)` hook.
- `<MapView>` updated to switch between overlay types based on `zoomTier`.
- Completed tasks in muted CSS class on card unless "show completed" filter is active.
- `ACTIVITY_ICONS` constant in `activityIcons.ts`.

**Acceptance criteria**:
- At zoom < 5, only region name overlays render; no location cards or cluster markers visible.
- At 5 ≤ zoom < 7, cluster markers render with correct aggregate task counts; individual location cards hidden.
- At zoom ≥ 7, full `<LocationLabel>` cards render for all locations passing current filters.
- Each card's task count badge matches the count of tasks at that location (no filters active).
- Activity icons render for every `ActivityType` in sample data; no icon renders as an empty box.
- Zooming from level 4 to 8 transitions density tiers without console errors or marker duplication.
- A location with 0 tasks matching the current filter is not rendered.

**Out of scope**: Region polygon fill overlays, filter sidebar controls, detail panel, "My List" overlay, mobile layout.

---

#### Map Layer 4 — Region Overlays and Filters

**Goal**: Add semi-transparent region polygon overlays with locked/unlocked styling, and wire the map filter sidebar to global filter state.

**Builds on**: Map Layer 3; Data Layer 3 (`Region` type with `color` and polygon geometry; `UserState` with `unlockedRegionIds`).

**Deliverables**:
- `<RegionOverlay>` component (see §5.5).
- `useRegionLockState(regionId)` hook.
- `<MapFilterSidebar>` component with all filter controls; hidden below 768px breakpoint.
- `useMapFilters()` hook.
- `<LocationLabel>` updated to re-derive `taskCount` from `useFilteredTaskCount` on every filter state change.
- Overlay toggle toolbar button.

**Acceptance criteria**:
- Each region's polygon fills the correct geographic area.
- Unlocked regions render with a light semi-transparent fill; locked with hatched dimmed pattern.
- Toggling the overlay button hides all `<RegionOverlay>` polygons without removing location labels.
- Selecting a region filter pill in `<MapFilterSidebar>` hides location cards in all other regions within one render cycle.
- Toggling Difficulty filter to "Elite only" updates all visible task count badges.
- Filter state changed on `/map` is reflected immediately when navigating to the Task Browser.

**Out of scope**: Location detail panel, "My List" ring overlay, plane toggle for upper floors, mobile bottom sheet, "Add to list" interaction.

---

#### Map Layer 5 — Detail Panel, My List Overlay, and Mobile

**Goal**: Complete the interactive layer: clicking a location opens `<LocationDetailPanel>`, the "My List" ring overlay highlights active task list locations, the plane toggle enables dungeon navigation, and mobile bottom sheet passes visual review.

**Builds on**: Map Layer 4; Data Layer 4 (`UserState`, `TaskList`, `RoutePlan`).

**Deliverables**:
- `<LocationDetailPanel>` component (see §5.9).
- `useLocationDetail(locationId)` hook.
- `<MyListOverlay>` component (see §5.7).
- `usePlane` extended to support planes 1 and 2; plane toggle cycles 0 → 1 → 2 → 0.
- "Add to List" calls `taskListStore.addTaskToList(listId, taskId)` (direct import, not React context).
- "Plan route through here" calls `routePlanStore.addWaypoint(locationId)` (direct import, not React context).
- Mobile layout: bottom sheet for detail panel at viewport < 768px (see §5.10).
- `<LocationLabel>` touch target ≥ 44×44px on mobile.

**Acceptance criteria**:
- Clicking a `<LocationLabel>` card opens `<LocationDetailPanel>` with correct location name, region badge, and task list.
- Every task row in the panel shows the correct difficulty badge and points value.
- Clicking "Add to List" adds the task to the active `TaskList`; button changes to confirmation state; no duplicates added.
- After adding a task, the corresponding location's `<MyListOverlay>` ring appears on the map without a page reload.
- Completed tasks in the panel render struck-through.
- Clicking the plane toggle cycles planes; location markers for the new plane render; markers for the previous plane disappear.
- On a 390px-wide viewport, the detail panel renders as a bottom sheet; filter sidebar is hidden; a filter icon button is visible.
- On a 390px-wide viewport, each `<LocationLabel>` card has a minimum tap target of 44×44px.
- "My List" overlay ring renders in green for a location where all list tasks are complete, accent color when at least one is incomplete.

**Out of scope**: Export/share of route plan, offline tile caching, URL-serialized filter state (Site Layer 5), teleport-aware distance calculation (Route Layer 5).

---

## §6 Route Planner

### §6.1 Concepts

| Term | Definition |
|---|---|
| **Task List** | An unordered collection of tasks the user wants to do. Multiple lists can exist; one is "active." |
| **Route Plan** | An ordered sequence of tasks (derived from a Task List) with a corresponding map path. |
| **Leg** | The segment of travel between two consecutive tasks in a route. |
| **Waypoint** | A specific `Location` explicitly pinned into a route, even without a task attached. |

A Task List is the input; a Route Plan is the output. The user can auto-generate a plan from a list, then manually re-order it.

### §6.2 Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  [ Active List: "Desert + Kourend grind" ▼ ]  [New list]     │
├─────────────────────────┬────────────────────────────────────┤
│  TASK LIST (left panel) │   MAP PREVIEW (right panel)        │
│                         │                                     │
│  Drag to reorder        │   Route path drawn as line         │
│  ──────────────         │   overlaid on the map.             │
│  1. [task name]    ✓    │   Each stop numbered to match      │
│  2. [task name]    ✓    │   the left panel order.            │
│  3. [task name]    …    │                                     │
│  + Add tasks            │   [ Fit route ]  [ Full map ]      │
│                         │                                     │
│  [Auto-sort route]      │                                     │
│  [Export]               │                                     │
└─────────────────────────┴────────────────────────────────────┘
```

CSS/layout: each pane 50% width on desktop, stacked on mobile.

### §6.3 Task List Management

**Creating a List**: "New List" button → prompt for name → empty list created. Tasks can be added from the Task Browser, the Map (Location Detail Panel), or the Planner's own search/add within the left panel.

**Editing a List**:
- Drag-and-drop reordering within the left panel (via `@dnd-kit/sortable`).
- Remove individual tasks with a ✕ button.
- Bulk actions: remove completed, remove by region, clear all.
- Rename or delete a list from the list selector dropdown.

**Multiple Lists**: Users can maintain several named lists simultaneously. Only one list is "active" at a time (shown on the map and in the tracker). Switching the active list updates the map overlay and tracker view immediately.

**Store** — `taskListStore.ts`:
- `addTaskToList(listId: string, taskId: string): void` — appends a task to a named list, no-ops on duplicate.
- `removeTaskFromList(listId: string, taskId: string): void`.
- `setActiveList(listId: string): void` — writes `activeListId` to `UserState`.
- `useTaskLists()` hook — returns all lists, the active list ID, and the CRUD actions.

`taskListStore` is imported directly, not wrapped in a React context.

### §6.4 Auto-Sort Algorithm

The "Auto-sort route" button reorders tasks in the active list to minimize estimated travel cost.

**Starting point**: the first stop in the list (task or waypoint). The user sets this by dragging a task to position 1 or prepending a waypoint.

**Algorithm — teleport-aware nearest-neighbor**:
1. Start from the first stop's location.
2. At each step, pick the unvisited task whose `Location` has the lowest **effective travel cost** from the current position.
3. Respect hard prerequisites: if task B requires task A, A cannot be placed after B. Violations are shown as inline warnings (not blocking).

This is a greedy heuristic, not an optimal TSP solve, but fast enough for typical 10–30 task lists.

**Performance requirement**: `nearestNeighborSort` must complete in under 50 ms for a list of 30 tasks (verified by unit test using `performance.now()`).

**Type definitions** in `src/schemas/planner.ts`:
```ts
type SortableTask = Pick<Task, 'id' | 'locations' | 'requirements'>;
type RequirementMap = Record<string, Requirement[]>; // keyed by task ID
```

**Functions**:
- `nearestNeighborSort(tasks: SortableTask[], startTile?: TileCoord): SortableTask[]` — pure function; uses Euclidean distance in tile space. Calling it twice with the same input produces the same output.
- `detectPrerequisiteConflicts(orderedTasks: SortableTask[], requirements: RequirementMap): PrerequisiteConflict[]` — returns `{ taskId, blockedByTaskId, message }[]`.

**Components**:
- `<AutoSortButton>` — renders "Auto-sort route"; calls `nearestNeighborSort`, writes result to store, then calls `detectPrerequisiteConflicts` and stores conflicts.
- `<PrerequisiteWarningBanner>` — renders one inline warning row per `PrerequisiteConflict` beneath the affected `<TaskCard>`; each row includes a "Fix order" button that swaps the two conflicting tasks.
- After any manual drag-and-drop, `<AutoSortButton>` label changes to "Re-sort route".

### §6.5 Teleport-Aware Routing

**Effective travel cost** between two locations:

```
min(
  tile_distance(current, destination),
  ...for each enabled teleport T:
    tile_distance(current, T.origin) + T.cast_cost + tile_distance(T.destination, destination)
)
```

The algorithm picks the cheapest option at each step.

**Teleport configuration**: see §3.12 for the `Teleport` schema. The user configures accessible teleports via a checklist in Settings (stored as `enabledTeleportIds` in `UserState`).

Default state:
- Standard spells: enabled.
- League-specific teleports (e.g. bank teleport): enabled for the active league.
- Item teleports (jewelry, tabs): disabled by default — user enables as acquired.

Teleports are grouped in the checklist by source type (Spells / Items / League / Relic) and filterable by region.

**`teleportAwareDistance(from: TileCoord, to: TileCoord, userState: UserState): number`** — stub function in Route Layer 5 that currently returns Euclidean tile distance; accepts `UserState` so teleport cost logic can be added later without changing the call site; documented with a `// TODO: incorporate teleport graph` comment.

**Deferred**: named teleport profiles, progressive auto-unlock based on skill levels or relic tier.

### §6.6 Manual Reordering

Drag-and-drop (via `@dnd-kit/sortable`) always takes precedence. After manual reordering the auto-sort button shows a "re-sort" affordance.

Prerequisite violations from manual ordering are flagged inline:

```
⚠ Task "Barrows Chest" requires Morytania region — drag it below your
   region unlock task, or unlock Morytania first.
```

### §6.7 Route Map Overlay

When a Route Plan is active, the map panel draws:

- **Numbered pins** (`DivIcon` showing sequence number) at each task's location, matching the left-panel order.
- **Polyline legs** (`L.Polyline`) connecting consecutive stops — re-drawn whenever the task order changes.
- **Completed stop style** — pins for tasks in `completedTaskIds` render with a muted grey `DivIcon` and a checkmark.
- The map auto-fits (`fitRouteBounds()`) the bounding box of all route stops when the plan is first opened or re-sorted.

`<RouteMapPanel>` — replaces `<MapStub>` in `<PlannerPage>`; mounts the shared Leaflet map instance scoped to the planner route.

`useRoutePins(listId: string)` — derives an ordered array of `{ taskId, locationTileX, locationTileY, sequenceNumber }` from the active task list.

`fitRouteBounds()` — computes the bounding box of all (incomplete) route pins and calls `map.fitBounds()`.

### §6.8 Task Card in the Planner

Each task in the left panel (`<TaskCard>`) shows:

```
[3]  Kill the Barrows Brothers (Elite — 50 pts)
     📍 Barrows — Morytania
     Req: 💀 Morytania unlocked
     [ Mark done ]  [ Remove ]
```

- Sequence number.
- Task name, difficulty badge, points.
- Primary location with region tag.
- First blocking requirement (collapsed; expand for all).
- Mark done / Remove actions.

### §6.9 Export & Share

Three export formats via `<ExportMenu>` dropdown:

- **`exportPlanAsText(plan: RoutePlan): string`** — numbered plain-text list of task names with locations. `RouteStop` waypoints appear as "(waypoint at {locationName})".
- **`exportPlanAsJSON(plan: RoutePlan): string`** — full plan JSON with task IDs, list name, and schema version. Waypoint stops included with `type: 'waypoint'` and their `locationId`.
- **`encodePlanToURL(plan: RoutePlan): string`** — encodes task ID array into `?plan=<base64>`; waypoint stops encoded inline with task stops in the base64 payload. No backend required.
- **`decodePlanFromURL(url: string): RoutePlan | null`** — decodes and validates client-side; returns `null` on malformed input.

`<ExportMenu>` actions: "Copy as text" (writes to clipboard), "Download JSON" (triggers file download), "Share link" (writes URL to clipboard and shows a confirmation toast).

A share link URL rendered in a fresh browser tab renders the plan in read-only mode with no `UserState` dependency.

### §6.10 Session Progress

As tasks are marked done (from the Planner or Tracker):
- The left panel item gains a checkmark and moves to a collapsed "Completed" section at the bottom (toggle shows/hides completed cards).
- The map pin transitions to the muted grey completed style.
- Points earned update in the global header chip.
- After a task is marked done, `fitRouteBounds()` is called on the remaining incomplete pins only.

### §6.11 Route Planner Implementation Layers

#### Route Layer 1 — Task List CRUD

**Goal**: Establish persistent task list data management.

**Builds on**: Data Layer 4 (`UserState`, `TaskList`, `RoutePlan` types and localStorage serialization).

**Deliverables**:
- `taskListStore.ts` with `addTaskToList`, `removeTaskFromList`, `setActiveList` operations backed by `UserState` in localStorage.
- `useTaskLists()` hook.
- Unit tests covering create/rename/delete round-trips and localStorage persistence.

**Acceptance criteria**:
- A new list can be created with a name and immediately appears in the store.
- A task added to a list persists after a full page reload.
- A task removed from a list is absent after a full page reload.
- Renaming a list updates its name without changing its ID or task entries.
- Deleting a list removes it and, if it was active, sets `activeListId` to another list or `null`.
- `addTaskToList` called twice with the same task ID does not create a duplicate entry.

**Out of scope**: UI rendering; drag-and-drop; auto-sort; map overlay.

---

#### Route Layer 2 — Planner Page Layout

**Goal**: Render a navigable split-pane planner page.

**Builds on**: Route Layer 1.

**Deliverables**:
- `<PlannerPage>` at `/planner`.
- `<ListSelectorDropdown>` — shows all list names; triggers `setActiveList`; includes "New list" button.
- `<TaskListPanel>` — left-pane with ordered `<TaskCard>` components and "+ Add tasks" search entry.
- `<TaskCard>` — sequence number, task name, difficulty badge, point value, primary location with region tag, first blocking requirement (collapsed), "Mark done" and "Remove" buttons.
- `<MapStub>` — right-pane placeholder.

**Acceptance criteria**:
- `/planner` renders without console errors.
- Switching the active list via `<ListSelectorDropdown>` immediately re-renders `<TaskListPanel>`.
- Each `<TaskCard>` displays the correct sequence number.
- Clicking "Remove" calls `removeTaskFromList` and the card disappears.
- Creating a new list via "New list" button adds it to the dropdown.
- `<MapStub>` is visible in the right pane.

**Out of scope**: Live map rendering; drag-and-drop; auto-sort; route overlay; export.

---

#### Route Layer 3 — Route Map Overlay

**Goal**: Replace the map stub with a live Leaflet map that renders numbered pins and a polyline.

**Builds on**: Route Layer 2; Map Layer 1 (Leaflet scaffold with OSRS tile layer and correct projection).

**Deliverables**:
- `<RouteMapPanel>` replacing `<MapStub>`.
- `useRoutePins(listId: string)` hook.
- Numbered circular marker layer (Leaflet `DivIcon` showing sequence number).
- Polyline layer connecting pins in sequence order.
- `fitRouteBounds()` utility.
- "Fit route" and "Full map" buttons.
- Drag-and-drop reordering in `<TaskListPanel>` (via `@dnd-kit/sortable`).

**Acceptance criteria**:
- Numbered pins appear at correct tile positions for all tasks in the active list.
- Pin sequence numbers match the order in `<TaskListPanel>`.
- Polyline connects all pins in sequence order with no gaps.
- Dragging a task card to a new position updates both left-panel sequence numbers and map pin numbers within one render cycle.
- Switching the active list replaces all pins and polyline with the new list's data.
- Clicking "Fit route" zooms the map to show all pins with padding.
- A list with zero tasks renders no pins and no polyline without console errors.

**Out of scope**: Completed-stop muted pin style; auto-sort; prerequisite warnings; export.

---

#### Route Layer 4 — Auto-Sort Algorithm

**Goal**: Provide a one-click greedy nearest-neighbor sort with inline prerequisite conflict warnings.

**Builds on**: Route Layer 3.

**Deliverables**:
- `src/schemas/planner.ts` with `SortableTask` and `RequirementMap` types.
- `nearestNeighborSort(tasks: SortableTask[], startTile?: TileCoord): SortableTask[]` — pure function.
- `detectPrerequisiteConflicts(orderedTasks: SortableTask[], requirements: RequirementMap): PrerequisiteConflict[]`.
- `<AutoSortButton>` component.
- `<PrerequisiteWarningBanner>` component with "Fix order" button.
- "Re-sort" affordance after manual drag.

**Acceptance criteria**:
- Clicking "Auto-sort route" on a 10-task list reorders cards and pins within one render cycle.
- `nearestNeighborSort` with 30 tasks completes in under 50 ms in the unit test environment.
- A prerequisite conflict is detected and `<PrerequisiteWarningBanner>` appears.
- Clicking "Fix order" resolves the specific conflict and removes that banner.
- After any manual drag, `<AutoSortButton>` label changes to "Re-sort route".
- A list with one task sorts without errors and shows no warnings.
- `nearestNeighborSort` is pure: calling it twice with the same input produces the same output.

**Out of scope**: Teleport-aware distance calculation; completed pin styles; export.

---

#### Route Layer 5 — Export, Teleport v2, and Session Progress

**Goal**: Plan export (text, JSON, share link), completed-task visual feedback, and teleport-aware distance stub.

**Builds on**: Route Layer 4.

**Deliverables**:
- `exportPlanAsText`, `exportPlanAsJSON`, `encodePlanToURL`, `decodePlanFromURL` functions.
- `<ExportMenu>` dropdown.
- Completed-pin style in `<RouteMapPanel>` (muted grey `DivIcon` with checkmark).
- Completed-task "Completed" section in `<TaskListPanel>` (collapsed, togglable).
- Route re-fit on completion (`fitRouteBounds()` on remaining incomplete pins only).
- `teleportAwareDistance(from: TileCoord, to: TileCoord, userState: UserState): number` — stub returning Euclidean tile distance with `// TODO: incorporate teleport graph` comment.

**Acceptance criteria**:
- "Copy as text" writes a numbered plain-text list to the clipboard.
- "Download JSON" triggers a file download whose contents parse as valid JSON with correct task IDs.
- A share link generated by `encodePlanToURL` round-trips through `decodePlanFromURL` and reconstructs the same task ID order.
- Opening a share link URL in a fresh browser tab renders the plan in read-only mode with no `UserState` dependency.
- Marking a task done moves its card to the "Completed" section and mutes its map pin within one render cycle.
- After marking a task done, `fitRouteBounds()` excludes the completed task's pin.
- `teleportAwareDistance` is exported and returns a number equal to the Euclidean tile distance.
- The "Completed" section can be toggled open and closed without affecting the active task order.

---

## §7 Task Tracker

### §7.1 Tracker Page Layout

```
┌───────────────────────────────────────────────────────────────┐
│  Points: 12,450 / 145,490   🏆 Mithril Trophy (next: 15,000) │
│  ████████████░░░░░░░░░░░░░░░░░░  8.5% complete               │
├──────────────────────────────┬────────────────────────────────┤
│  FILTER / VIEW OPTIONS       │  TASK LIST                     │
│                              │                                 │
│  Region: [All ▼]             │  ☑ Smelt a Bronze Bar    10 pts│
│  Difficulty: [All ▼]         │  ☑ Complete Al Kharid    10 pts│
│  Status: Incomplete ▼        │  ☐ Chop 50 Teak Logs    20 pts│
│  Show: All tasks             │  ☐ Kill 50 Cave Bugs    30 pts│
│        My list only          │  …                             │
│                              │                                 │
│  Sort by: Difficulty ▼       │                                 │
│           Points             │                                 │
│           Completion %       │                                 │
│           Region             │                                 │
└──────────────────────────────┴────────────────────────────────┘
```

### §7.2 Points & Tier Progress

**Header Summary** (always visible at top of Tracker and as the global chip in the header):
- Earned points / Total available points for currently filtered scope.
- Current tier trophy name and icon.
- Progress bar toward the next tier, showing exact points gap.

`usePointTotals(completedTaskIds: Set<string>, tasks: Task[]): { earned: number; total: number; currentTier: PointTier; nextTier: PointTier | null; gap: number }` — pure derived computation hook. Returns `gap = 0` and `nextTier = null` when the player has reached the maximum tier.

**Tier Timeline** — stepped bar showing tier nodes (Bronze → Silver → Gold → Rune → Dragon). Clicking a tier node triggers `onTierClick(tier: PointTier)` callback (showing which tasks would push over that threshold).

Components:
- `<PointsSummary>` — header bar showing earned points, total available points, current tier name and icon, and exact points gap to next tier.
- `<TierProgressBar>` — horizontal progress bar filled to `earned / nextTier.threshold` (100% if max tier). Accepts `earned: number` and `tiers: PointTier[]` props.
- `<TierTimeline>` — stepped row of tier nodes with "you are here" indicator; one node per defined `PointTier`.

### §7.3 Task List in the Tracker

Each row (`<TaskRow>`):

```
☑  Kill the Barrows Brothers    Elite    50 pts    Morytania
```

- Checkbox to toggle completion state (persists to localStorage `UserState`).
- Task name (clicking opens a detail drawer).
- Difficulty badge (color-coded).
- Point value.
- Region tag.
- Completion rate from wiki data (small grey text, e.g. "72% of players") — used to surface easy wins when sorted by completion rate descending.

Completed tasks render with the checkbox filled and text muted, but remain visible by default (can be hidden via the Status filter).

### §7.4 Filters — useTrackerFilteredTasks

`useTrackerFilters` hook — reads filter state from URL query params on mount, exposes typed setters for each filter dimension, serializes changes back to the URL without a full navigation.

Filter state shape:
```ts
{
  regions: string[];
  difficulties: Difficulty[];
  status: 'all' | 'incomplete' | 'completed';
  skills: string[];
  tags: string[];
  myListOnly: boolean;
  meetsRequirements: boolean;
  sort: SortOption;
}
```

URL param format: `/track?region=morytania&difficulty=Hard,Elite&status=incomplete`

The canonical URL param keys `region` and `q` are shared with the global `FilterState` (see §4.9). `TrackerFilters` extends `BaseFilterState`.

`useTrackerFilteredTasks(tasks: Task[], filters: TrackerFilters, userState: UserState): Task[]` — pure function/hook applying all active filters and the selected sort order. Returns a sorted, filtered `Task[]`.

**Filter controls in `<FilterSidebar>`**:

| Filter | Behavior |
|---|---|
| Region | Show only tasks in selected regions. Defaults to unlocked regions. |
| Difficulty | Multi-select. |
| Status | All / Incomplete / Completed |
| Skill | Show only tasks that exercise selected skills |
| My list only | Narrow to the active TaskList |
| Meets requirements | Hide tasks you don't yet qualify for — checks both region unlocks AND current skill levels from `UserState.skillLevels` |
| Tags | Boss, slayer, minigame, quest, etc. |

`<SortControl>` dropdown with options: Difficulty, Points, Completion %, Region.

`<PointsSummary>` computes totals over the **filtered** task set rather than the full set.

### §7.5 Region Progress Panels

Collapsible panels below the main task list showing per-region summaries:

```
▼ Morytania  ████████░░  18/42 tasks  1,240/4,200 pts
▼ Kourend    ██████████  42/42 tasks  ✓ COMPLETE
▼ Desert     ████░░░░░░   8/30 tasks    680/3,210 pts
```

`<RegionPanel>` — collapsible section with region name, inline progress bar, task count (completed/total), and points (earned/total). Expanded state shows that region's `<TaskRow>` list inline.

`useRegionSummaries(tasks: Task[], completedTaskIds: Set<string>): RegionSummary[]` — derives per-region `{ regionId, name, completedCount, totalCount, earnedPoints, totalPoints }` array.

`<RegionPanel>` list renders only regions that contain at least one task matching the active filter state.

### §7.6 Task Detail Drawer

`<TaskDetailDrawer>` — slide-in panel (right side) that renders on `<TaskRow>` name click:

- Task name and difficulty badge.
- Full description.
- Points value.
- Region and Location(s) — with a "View on map" link (`/map?taskId={taskId}` via React Router `<Link>`; actual map centering implemented in Map Layer 5).
- Requirements list with met/unmet indicators.
- Skills exercised.
- Tags.
- Wiki completion rate.
- "Add to list" / "Remove from list" buttons for the active TaskList.
- "Mark complete" toggle.

`useRequirementStatus(requirements: Requirement[], userState: UserState): RequirementStatus[]` — returns each requirement with a `met: boolean | 'manual'` field:
- `true`/`false` for skill and region requirements (automatically evaluated against `userState`).
- `'manual'` for quest and item requirements (shown but not automatically evaluated — user manually toggles red/green).
- Typed as `{ requirement: Requirement; met: boolean | 'manual' }`.

"Add to list" in `<TaskDetailDrawer>` adds the task to the active `TaskList` and the button label changes to "Remove from list" without closing the drawer. "Mark complete" toggle has the same effect as the `<TaskRow>` checkbox and both stay in sync.

### §7.7 Bulk Actions

`<BulkActionBar>` — toolbar rendered above the task list when filters are active:
- **Mark all filtered as done** — opens `<ConfirmDialog>` showing count and active filters before writing.
- **Unmark all** — also confirmed.
- **Import from clipboard** — parses a comma-separated list of task IDs or names, resolves them against the active league's task list, marks matching tasks complete.

`<ConfirmDialog>` — reusable modal with a message prop, "Confirm" and "Cancel" actions.

Actions on `useUserState`:
- `markAllFiltered(filteredTaskIds: string[]): void`
- `unmarkAll(): void`

### §7.8 Export / Import / Share-Progress URL

- **Export**: `exportUserState(): void` — serializes current `UserState` to `leagues-plan-{YYYY-MM-DD}.json` and triggers a browser download.
- **Import**: `<ImportButton>` with a hidden `<input type="file">` and drag-and-drop zone; reads the JSON file, validates it against the `UserState` schema, and calls `importUserState(state: UserState): void` on success; shows an inline error message on validation failure.
- **Reset**: wipe state for the active league with a confirmation dialog.
- **Share-progress URL**: `generateShareUrl(completedTaskIds: Set<string>): string` — encodes completed task IDs as base64 into `?progress=<base64>` (distinct from the route planner's `?plan=<base64>` param to avoid collision). Navigating to that URL renders `<TrackerPage>` in read-only mode with no checkboxes.

Round-trip test: export → clear state → import → completion set matches original.

### §7.9 Milestone Notifications

When a tier threshold is crossed (by marking a task done), a banner appears:

```
🏆 You reached Rune Trophy! (30,000 points)
```

When a region is 100% complete:

```
✓ Morytania complete — all 42 tasks done!
```

`useMilestoneToasts` hook — subscribes to `completedTaskIds` changes via `useEffect`; fires a toast via `<ToastProvider>` context when `usePointTotals` detects a tier crossing or `useRegionSummaries` detects a region reaching 100%; each toast auto-dismisses after 4 seconds.

`<Toast>` — single transient notification component. Tier toast shows trophy icon and tier name; region toast shows checkmark and region name. No more than one toast visible at a time; if two milestones trigger simultaneously, they queue sequentially.

### §7.10 Tracker Implementation Layers

#### Tracker Layer 1 — Checkbox Persistence

**Goal**: Render a basic task list with functional checkboxes that write completion state to `UserState` in localStorage and survive a page reload.

**Builds on**: Data Layer 4.

**Deliverables**:
- `<TrackerPage>` at `/track`; renders a flat, unfiltered task list.
- `<TaskRow>` — checkbox, task name, difficulty badge, point value, region tag.
- `useUserState` hook with `toggleTaskComplete(taskId: string): void`.
- `completedTaskIds` set wired through `useUserState`; checkbox state derived from this set.

**Acceptance criteria**:
- Checking a `<TaskRow>` checkbox calls `toggleTaskComplete` and immediately reflects the checked state without a page reload.
- Reloading the page shows all previously checked tasks still checked.
- Unchecking a previously completed task removes it from `completedTaskIds` and persists on reload.
- `<TrackerPage>` renders all tasks for the active league with no console errors.
- `useUserState` correctly scopes state by `leagueId`.

**Out of scope**: Points display, tier bar, filters, sort controls, region panels, task detail drawer, bulk actions, export/import, toasts.

---

#### Tracker Layer 2 — Points + Tier Bar

**Goal**: Display the player's earned points total and a tier progress bar that updates immediately when any checkbox is toggled.

**Builds on**: Tracker Layer 1; Data Layer 1 (`PointTier` thresholds, task point values).

**Deliverables**:
- `<PointsSummary>`, `<TierProgressBar>`, `<TierTimeline>` components.
- `usePointTotals` hook.
- Points values sourced from the active league's task data; no separate API call.

**Acceptance criteria**:
- Checking a `<TaskRow>` checkbox causes `<PointsSummary>` to reflect the new earned total within the same render cycle.
- `<TierProgressBar>` fill percentage matches `earned / nextTier.threshold` (or 100% if max tier).
- Current tier name and icon are correct for the earned total at every tier boundary.
- `<TierTimeline>` renders exactly one node per defined `PointTier` and marks the current tier visually distinct.
- `usePointTotals` returns `gap = 0` and `nextTier = null` when max tier reached.

**Out of scope**: Filter-scoped point totals, URL filter state, region panels, task detail drawer, bulk actions, export/import, toasts.

---

#### Tracker Layer 3 — Filters + Sort

**Goal**: Wire all filter controls and sort options; filter state reflected in URL query string.

**Builds on**: Tracker Layer 2; Data Layer 3 (`Requirement` types); Site Layer 3 (global filter context and URL param serialization pattern).

**Deliverables**:
- `<FilterSidebar>` with all filter controls.
- `<SortControl>` dropdown.
- `useTrackerFilters` hook (reads/writes URL query params).
- `useTrackerFilteredTasks` hook (pure filter+sort function).
- `<PointsSummary>` updated to compute totals over filtered task set.

**Acceptance criteria**:
- Selecting a region removes all tasks outside that region within the same render cycle.
- Setting Status to "Incomplete" hides all rows whose `taskId` is in `completedTaskIds`.
- Enabling "My List Only" shows only tasks in the active `TaskList`.
- Enabling "Meets Requirements" hides tasks with any unmet condition given current `UserState`.
- Pasting a URL with valid query params restores the exact same filter state and visible task list.
- `<PointsSummary>` earned and total values reflect only the filtered task set.
- All seven filter dimensions can be combined simultaneously and produce a correct intersection result.

**Out of scope**: Region progress panels, task detail drawer, bulk actions, export/import, toasts, tier-node click behavior.

---

#### Tracker Layer 4 — Region Panels + Detail Drawer

**Goal**: Add collapsible per-region progress panels and a slide-in `<TaskDetailDrawer>`.

**Builds on**: Tracker Layer 3; Data Layer 3 (`Requirement` types, location data); Map Layer 1 (route target for "View on map" link).

**Deliverables**:
- `<RegionPanel>` component.
- `useRegionSummaries` hook.
- `<TaskDetailDrawer>` component with full task detail (see §7.6).
- `useRequirementStatus` hook returning `{ requirement: Requirement; met: boolean | 'manual' }[]`.
- "View on map" link navigating to `/map?taskId={taskId}`.
- `<TrackerPage>` renders `<RegionPanel>` list below `<TaskRow>` list; both sections respect active filter state.

**Acceptance criteria**:
- Clicking a region panel header toggles expanded/collapsed state without closing other panels.
- Each `<RegionPanel>` completed count and earned points update immediately when a checkbox inside it is toggled.
- Clicking a task name in any `<TaskRow>` opens `<TaskDetailDrawer>` with that task's data.
- Requirements display green indicator for met conditions and red for unmet based on current `UserState`.
- "Add to list" in `<TaskDetailDrawer>` adds the task and button label changes to "Remove from list" without closing the drawer.
- "Mark complete" toggle in `<TaskDetailDrawer>` and `<TaskRow>` checkbox stay in sync.
- "View on map" link navigates to `/map?taskId={taskId}`.
- `<RegionPanel>` list renders only regions with at least one task matching the active filter state.

**Out of scope**: Bulk actions, export/import, share-progress URL, completion toasts, actual map centering (Map Layer 5).

---

#### Tracker Layer 5 — Bulk Actions + Export + Milestones

**Goal**: Bulk task completion actions, JSON export/import, share-progress URL, and transient toast notifications.

**Builds on**: Tracker Layer 4; Data Layer 4 (`UserState` serialization); Data Layer 5 (validated data bundle for stable task IDs).

**Deliverables**:
- `<BulkActionBar>` with "Mark all filtered as done" and "Unmark all" (both confirmed via `<ConfirmDialog>`).
- `<ConfirmDialog>` reusable modal.
- `markAllFiltered` and `unmarkAll` actions on `useUserState`.
- `exportUserState(): void` function.
- `<ImportButton>` with hidden file input and drag-and-drop zone.
- "Import from clipboard" action.
- `generateShareUrl(completedTaskIds: Set<string>): string` with `?progress=<base64>` param.
- `useMilestoneToasts` hook with `<ToastProvider>` and `<Toast>` component.

**Acceptance criteria**:
- Clicking "Mark all filtered as done" opens `<ConfirmDialog>` showing the exact count; confirming marks all complete and updates `<PointsSummary>` and all `<RegionPanel>` counts immediately.
- "Unmark all" sets `completedTaskIds` to empty set; all checkboxes render unchecked.
- Export downloads a valid JSON file that, when re-imported, restores the identical `completedTaskIds` set.
- Importing a JSON file with an invalid schema shows an error message and does not modify current `UserState`.
- A share URL renders `<TrackerPage>` with checkboxes absent and correct tasks shown as complete.
- A tier-crossing toast appears within the same render cycle as the triggering checkbox toggle and auto-dismisses after 4 seconds.
- A region-completion toast appears when the last incomplete task in a region is checked.
- No more than one toast visible at a time; simultaneous milestones queue sequentially.

**Out of scope**: Server-side persistence, user accounts, multi-device sync, push notifications, offline service worker (Site Layer 5).

---

## §8 Data Assembly Pipeline

### §8.1 Problem Statement

The OSRS Wiki has two largely separate data surfaces:

1. **Task tables** — structured lists of tasks per league, with name, description, difficulty, points, region category, and completion percentage. These do NOT reliably include where a task is physically completed.
2. **Map data** — the wiki's interactive map has markers for fishing spots, mining rocks, trees, agility courses, bosses, etc. These are geo-located but not linked to league tasks.

Bridging these two surfaces is the core assembly challenge. It cannot be done purely programmatically; some human annotation is always required, but automation can do the majority of the work.

### §8.2 Task Sourcing & Incrementalism

All tasks come from the OSRS Wiki — no other source. The scraper is run manually (`npm run scrape`). No polling, no scheduling. Tasks are only added once they appear on the wiki.

**Incremental / partial dataset constraint**: The full task list for a new league may not be on the wiki yet. The pipeline must:

- Work correctly with a **partial task set** — the app is fully usable with however many tasks are currently known.
- Support **additive updates** — running the pipeline again after new tasks are discovered appends without invalidating prior annotations or matches.
- Never treat "no tasks yet for this region/difficulty" as an error.
- Produce a **valid, launchable bundle** from any non-empty task set, even if many tasks lack location links (they render as `locationless` until resolved).

**Design rules for incrementalism**:
- **Never overwrite an existing annotation** — if `annotations.json` already has an entry for a task name, the pipeline must not alter it during a re-run. Annotations are the authoritative human layer.
- **Matched-draft is append-only during a session** — the auto-matcher writes only new entries, never updates or removes existing ones.
- **The final bundle is always rebuilt from scratch** — the merge+validate step re-derives the full bundle from all inputs on every run.
- **Partial bundles are valid app data** — a task with no resolved location and `locationless: false` is written with an empty `locations: []` array. The app renders it in task list and tracker but hides it from the map.
- **Version field on the bundle** — each rebuilt bundle increments a `dataVersion` integer; the app detects a version bump on load and refreshes its cached data.

### §8.3 Data Sources

| Source | What it provides | Format |
|---|---|---|
| Wiki task tables | Task name, description, difficulty, points, region, completion % | HTML tables / wiki templates |
| Wiki map markers | Location name, tile coords, marker category (e.g. "Woodcutting") | JSON via wiki API (`action=query&prop=mapmarkers`) |
| Wiki item/monster pages | Drop sources, spawn locations | HTML / SMW queries |
| osrs-map community tileset | Pre-projected tile layers for Leaflet | XYZ tile PNG |
| Manual annotation file | Human-curated task→location links | JSON / YAML |

### §8.4 Pipeline Stages Overview

```
[1] Scrape tasks          [2] Scrape locations        [3] Manual seed
      │                          │                           │
      ▼                          ▼                           ▼
  raw-tasks.json         raw-locations.json         annotations.json
      │                          │                           │
      └──────────┬───────────────┘                           │
                 ▼                                           │
         [4] Auto-match (heuristic)                          │
                 │                                           │
                 ▼                                           │
         matched-draft.json ◄────────────────────────────────┘
                 │
                 ▼
         [5] Human review UI (annotation tool)
                 │
                 ▼
         matched-final.json
                 │
                 ▼
         [6] Validate & bundle
                 │
                 ▼
         data/leagues/{league-id}.json   (the final app bundle)
```

### §8.5 Stage 1 — Scrape Tasks

**Script**: `scripts/scrape-tasks.ts`

Fetch the wiki task table for a given league (e.g. `https://oldschool.runescape.wiki/w/Trailblazer_Reloaded_League/Tasks`). The wiki renders tasks as HTML tables with columns: `Task | Description | Difficulty | Points | % completed`. The region is either a page section header or a column value.

Output: `data/raw/{league-id}/raw-tasks.json`

```ts
interface RawTask {
  name: string;
  description: string;
  difficulty: string;
  points: number;
  region: string;          // as it appears on the wiki (may need normalization)
  completionPct: number;   // 0–100
  wikiUrl?: string;        // link to task-specific page if it exists
}
```

**Considerations**:
- Wiki pages use MediaWiki templates; some task data is in `{{Leagues task}}` template calls — the API's `action=parse` or raw wikitext endpoint is more reliable than scraping rendered HTML.
- Rate-limit requests: 1 request/second, respect `User-Agent` header with contact info as per wiki bot policy.
- Cache raw responses locally so re-runs don't re-fetch unchanged pages.

### §8.6 Stage 2 — Scrape Locations

**Script**: `scripts/scrape-locations.ts`

The wiki map API exposes map markers used in the interactive map. Each marker has a category, a name, and tile coordinates.

Relevant API endpoint:
```
https://oldschool.runescape.wiki/api.php?action=query&list=mapmarkers&mmlimit=500&mmcategory=Woodcutting&format=json
```

Repeat for each `ActivityType` category. Merge and deduplicate by tile position and name.

Output: `data/raw/{league-id}/raw-locations.json`

```ts
interface RawLocation {
  name: string;
  category: string;        // wiki marker category
  tile: { x: number; y: number; plane: number };
  regionHint?: string;     // inferred from tile coords using region bounding boxes
  wikiUrl?: string;
}
```

**Considerations**:
- Not all wiki map marker categories map cleanly to `ActivityType`. A mapping table is needed (see `data/raw/category-map.json` in §8.12).
- Some locations are only findable via individual item/NPC pages.
- Tile coordinates use the OSRS tile system (`x, y, plane`). Verify projection by cross-checking a known landmark (e.g. Lumbridge Castle at ~3222, 3218, 0).

### §8.7 Stage 3 — Manual Seed / Annotation File

**File**: `data/annotations/{league-id}/annotations.json`

A human-curated file providing ground truth for task→location links that automation cannot resolve. Serves as the override mechanism — if the auto-matcher gets something wrong, a manual entry here wins.

```ts
interface Annotation {
  taskName: string;           // exact match against RawTask.name (case-sensitive)
  locationNames: string[];    // exact match against RawLocation.name (≥1)
  locationless: boolean;      // true = task has no fixed location (e.g. milestones)
  notes?: string;             // e.g. "only the inner ring counts"
}
```

**Important**: `taskName` is used as the join key between annotations and matched tasks. It is case-sensitive and must match the wiki-sourced task name exactly. If a task is renamed in a wiki update, its annotation entry must be manually updated.

The annotation file is committed to the repo and grows over time. It is the primary community contribution surface — contributors submit PRs to add or correct task→location mappings without touching application code.

`locationless: true` tasks are hidden from the map entirely. They appear in the task browser and tracker as normal, but have no map pin.

### §8.8 Stage 4 — Auto-Match (Heuristic Linker)

**Script**: `scripts/auto-match.ts`

Attempts to link each `RawTask` to one or more `RawLocation` entries without human intervention.

#### Matching strategies (applied in priority order)

1. **Explicit place name in description** — scan task description for known location names (fuzzy-matched against `RawLocation.name`). E.g.: "Complete the Seers' Village Agility Course" → matches "Seers' Village Rooftop Course".

2. **Skill + region intersection** — if a task description contains a skill keyword ("fish", "mine", "chop") and the task has a region, find all locations of that activity type within that region's bounding box. E.g.: "Catch 50 Monkfish" + region=Kandarin → all Fishing locations in Kandarin.

3. **Boss/NPC name** — extract boss or NPC names from descriptions, cross-reference against location names. E.g.: "Kill Zulrah 5 times" → matches "Zulrah's Shrine".

4. **Quest name** — match against a known quest→location table.

5. **Item name** — for tasks involving a specific item ("Smelt a Rune Bar"), look up the item's creation locations.

#### Match result

Each task ends up in one of two states:
- **Matched** — one or more locations found; written to `matched-draft.json`.
- **Unmatched** — no location determined; `matchConfidence: 0` and `needsReview: true`; added to the review queue.

Output: `data/raw/{league-id}/matched-draft.json`

```ts
interface MatchedTask extends RawTask {
  id: string;                   // generated stable ID: "{league-prefix}-{slug}"
  matchedLocationNames: string[];  // empty = unmatched, goes to review queue
  matchStrategy: string;        // which strategy produced the match, for debugging
}
```

### §8.9 Stage 5 — Human Review UI (Annotation Tool)

A minimal local web UI (React — not vanilla HTML/JS, so it can import `src/schemas/` directly without a separate bundling step) for reviewing and correcting the draft matches.

**Script**: `scripts/review-server.ts` — launches a local Express server at `http://localhost:3001`.

**Entry point**: `npm run review -- --league trailblazer-reloaded`

#### Review queue

Shows all tasks with no matched location (`matchedLocationNames` is empty and no annotation exists yet). Sorted by region then difficulty.

For each entry:
- Task name, description, region, difficulty.
- A map preview (embedded Leaflet) centered on the task's region.
- Controls:
  - **Assign location** — search and select one or more locations from the full location list; saves to `annotations.json`.
  - **No location** — marks `locationless: true` in `annotations.json`.
  - **Skip** — defer to another session.

Progress display:
```
Unmatched: 142 remaining / 480 total
Matched (auto): 278   Matched (manual): 60   Locationless: 0
```

`scripts/lib/annotations.ts` — read/write `annotations.json` with file locking to prevent concurrent write corruption.

### §8.10 Stage 6 — Validate & Bundle

**Script**: `scripts/build-data.ts`

Merges `matched-draft.json` + `annotations.json` → applies all overrides → validates the result against the full data schema → writes the final league bundle.

#### Merge logic

1. For each task, if an `annotations.json` entry exists for `taskName`, use its `locationNames` (override auto-match completely).
2. Otherwise use `matchedLocationNames` from the draft.
3. Resolve location names → Location objects (with full tile coords) from `raw-locations.json`. Fail validation if a referenced name can't be resolved.

#### Validation checks

- Every task has at least one resolved location OR `locationless: true`.
- Every `locationId` reference in `TaskLocation` resolves to a real `Location`.
- No duplicate task IDs within a league.
- All `regionId` values on tasks and locations match a `Region` in the league.
- All `Requirement` discriminated union variants are valid.
- Points sum matches expected total (sanity check against wiki source).
- `data/teleports.json` validated against the `Teleport` schema from `src/schemas/teleport.ts`.

Validation failures are reported as a structured `ValidationResult[]` list (not thrown exceptions), so all errors are visible at once. Human-readable validation report written to stdout: ✓/✗ per check, with offending task IDs listed for failures.

Output: `data/leagues/{league-id}.json` — the final bundle loaded by the app.
Also writes: `data/leagues/index.json` — list of available league IDs and names for the app's league selector.

### §8.11 Incremental Update Flow

```
1. Re-run scrape-tasks  →  new entries appear in raw-tasks.json
                            existing entries are unchanged (idempotent)

2. Re-run normalize     →  new tasks get stable IDs
                            existing IDs are unchanged

3. Re-run auto-match    →  only NEW tasks are matched; existing matched-draft
                            entries are preserved (skip if already matched)

4. Review UI shows only →  only newly-added tasks appear in the review queue
   NEW needsReview tasks    previously annotated tasks are skipped

5. Re-run build-data    →  merges all annotations + new draft matches
                            re-validates the full bundle
                            writes updated league JSON
```

### §8.12 Data Assembly Implementation Layers

#### Assembly Layer 1 — Raw Scrapers

**Goal**: Fetch raw task and location data from the wiki and write it to disk in a consistent JSON format.

**Builds on**: nothing (standalone Node scripts).

**Deliverables**:
- `scripts/scrape-tasks.ts` — scrapes one league's task table given a league slug arg; outputs `data/raw/{league-id}/raw-tasks.json`.
- `scripts/scrape-locations.ts` — fetches map markers for all `ActivityType` categories; outputs `data/raw/{league-id}/raw-locations.json`.
- `scripts/lib/wiki-client.ts` — rate-limited wiki API client (1 req/s, User-Agent header, local response cache in `data/raw/.cache/`).
- `data/raw/category-map.json` — maps wiki marker category strings to `ActivityType` enum values.
- `npm run scrape -- --league trailblazer-reloaded` entry point.

**Acceptance criteria**:
- Running the scrape command produces a non-empty `raw-tasks.json` with however many tasks are currently on the wiki.
- Running the location scrape produces `raw-locations.json` with ≥1 entry per active region having a valid `tile.x`, `tile.y`, `tile.plane`.
- Re-running with a warm cache makes zero HTTP requests.
- Script exits non-zero and prints a clear error if the wiki returns a non-200.
- Running the scrape a second time after new tasks appear adds new tasks without altering existing entries.

**Out of scope**: matching tasks to locations; generating stable IDs; any validation beyond basic JSON structure.

---

#### Assembly Layer 2 — ID Generation & Normalization

**Goal**: Assign stable IDs to tasks and locations, normalize region names, and produce cleaned intermediate files ready for matching.

**Builds on**: Assembly Layer 1 outputs.

**Deliverables**:
- `scripts/normalize.ts` — reads raw files, normalizes region strings (e.g. "Kourend & Kebos" → `"kourend"`), slugifies task names to IDs (`"{league-prefix}-{kebab-slug}"`), deduplicates locations by tile+name, assigns stable `loc-{kebab-slug}` IDs to locations derived from the location name only (not coordinates); IDs remain stable when tile coordinates are corrected in re-scrapes.
- `data/raw/{league-id}/tasks-normalized.json` and `data/raw/{league-id}/locations-normalized.json`.
- `scripts/lib/id.ts` — deterministic ID generation utilities.
- `data/regions.json` — canonical region slug → display name mapping shared across leagues.

**Acceptance criteria**:
- Running normalize twice on the same raw input produces identical output (deterministic IDs).
- No two tasks in the same league share an ID.
- No two locations share an ID.
- All region strings in normalized tasks match a key in `data/regions.json`.

**Out of scope**: task→location linking; validation against app schema; build pipeline.

---

#### Assembly Layer 3 — Auto-Matcher

**Goal**: Heuristically link tasks to locations using the five matching strategies, producing a draft file with confidence scores.

**Builds on**: Assembly Layers 1 & 2 normalized outputs.

**Deliverables**:
- `scripts/auto-match.ts` — runs all five strategies in priority order; outputs `data/raw/{league-id}/matched-draft.json`.
- `scripts/lib/match-strategies/` directory:
  - `place-name.ts` — fuzzy place-name extraction from descriptions.
  - `skill-region.ts` — skill keyword + region bounding-box intersection.
  - `boss-npc.ts` — boss/NPC name lookup table.
  - `quest-location.ts` — quest start/completion location table.
  - `item-location.ts` — item name lookup against item creation/use locations.
- `data/boss-locations.json` — hand-curated boss name → location name table.
- `data/quest-locations.json` — quest name → location name table.
- Stats report printed to stdout: total tasks, auto-confirmed count, needs-review count, no-match count.

**Acceptance criteria**:
- ≥60% of tasks receive a confidence score ≥0.8 (auto-confirmed) without any manual annotation.
- Tasks containing exact location names in their descriptions achieve ≥95% match rate.
- `matched-draft.json` contains an entry for every task in `tasks-normalized.json`.
- Running auto-match on a set of 10 tasks produces valid output (partial datasets do not cause errors).
- Re-running after new tasks are added appends new entries without modifying existing entries.
- Tasks with no match receive `matchConfidence: 0` and `needsReview: true` rather than being omitted.

**Out of scope**: human review UI; annotation override logic; final validation.

---

#### Assembly Layer 4 — Annotation Tool & Review UI

**Goal**: Provide a local browser UI for humans to resolve tasks that auto-matching couldn't handle confidently.

**Builds on**: Assembly Layer 3 draft output; Assembly Layer 1 location data.

**Deliverables**:
- `scripts/review-server.ts` — Express server, port 3001.
- `scripts/review-ui/` — minimal React frontend (React is required, not vanilla HTML/JS, so it can import `src/schemas/` directly without a separate bundling step):
  - Review queue list sorted by confidence ascending.
  - Task card with description, auto-match result, confidence badge.
  - Embedded Leaflet map preview showing candidate location(s).
  - Confirm / Edit / Add / No-location / Skip actions.
  - Progress counter.
- `scripts/lib/annotations.ts` — read/write `annotations.json` with file locking.
- `npm run review -- --league trailblazer-reloaded` entry point.

**Acceptance criteria**:
- `npm run review` starts the server and opens at `localhost:3001` without errors.
- Confirming a task writes the entry to `annotations.json` within 1 second and removes it from the review queue.
- Editing a task's location and saving reflects the new location in the queue immediately.
- Refreshing the page does not lose progress (state loaded from `annotations.json` on every page load).
- A task marked "No location" does not appear in the review queue again.

**Out of scope**: multi-user collaboration; cloud sync; production hosting of the review tool.

---

#### Assembly Layer 5 — Validate, Bundle & CI

**Goal**: Merge annotations with draft matches, validate the full schema, write the final league bundle, and gate all of this behind a CI check.

**Builds on**: Assembly Layers 1–4; app data schema from §3.

**Deliverables**:
- `scripts/build-data.ts` — merge + validate + bundle; writes `data/leagues/{league-id}.json`.
- `scripts/lib/validator.ts` — all validation checks; returns a structured `ValidationResult[]` not thrown exceptions; also validates `data/teleports.json` against the `Teleport` schema from `src/schemas/teleport.ts` as part of `npm run validate-data`.
- `npm run build-data -- --league trailblazer-reloaded` entry point.
- `npm run validate-data` — validate existing bundles without rebuilding; includes validation of `data/teleports.json`.
- `.github/workflows/validate-data.yml` — CI job that runs `validate-data` on every PR touching `data/`.
- `data/leagues/index.json` — list of available league IDs and names for the app's league selector.

**npm scripts summary**:

| Script | Purpose |
|---|---|
| `npm run scrape -- --league {id}` | Fetch raw task and location data from wiki |
| `npm run validate-data` | Validate existing bundles + `data/teleports.json` |
| `npm run build-data -- --league {id}` | Merge + validate + write final bundle |
| `npm run review -- --league {id}` | Start annotation review server at localhost:3001 |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build to `dist/` with service worker |

**Acceptance criteria**:
- `npm run build-data` exits 0 and produces a valid `{league-id}.json` when all tasks have resolved locations.
- `npm run build-data` exits non-zero and lists all failing task IDs when any task lacks a resolved location and is not marked `locationless`.
- CI job fails on PRs that introduce invalid data and passes on valid data.
- The final bundle's task count matches the raw scraped task count (no silent drops).
- `data/leagues/index.json` includes the newly built league after a successful build.

---

## §9 Implementation Layers

### §9.1 Layer Numbering Convention

| Layer | Theme | What gets built |
|---|---|---|
| 1 | Scaffold | Bare-bones structure, types, or UI shell with no logic |
| 2 | Core read path | Data loads and renders correctly; user can see but not interact much |
| 3 | Core write path | User-driven interactions: filtering, toggling, adding |
| 4 | Integration | Features connect across pages; shared state flows correctly |
| 5 | Polish & edge cases | Export/share, mobile, offline, advanced algorithms |

Layers within a feature are sequentially dependent. Layers across features that share the same number can be built in parallel (e.g. all five Layer 1s can be started simultaneously).

### §9.2 Per-Feature Layer Tables

#### 01 — Site Overview

| # | Name | Inputs | Output | Done when |
|---|---|---|---|---|
| 1 | App scaffold | — | Vite + React project; routing; nav shell; league selector loads league names | Nav links render; switching leagues changes a context value |
| 2 | Static pages | Site L1 | Dashboard stub; all routes render placeholder content; task browser shows raw unfiltered task list | Every route is reachable; task list renders all rows |
| 3 | Global filter state | Site L2 | Region filter pills; shared filter context; search bar wired to task name filter | Toggling a region pill filters both /tasks and /map simultaneously |
| 4 | Points chip + Settings | Site L3 | Live points chip in header from UserState; Settings page (league swap, preferences) | Chip updates when a task is marked done; settings persist on reload |
| 5 | PWA + URL state | Site L4 | Service worker for offline; filter state serialized to URL query params; deep-linkable filter views | App loads offline; sharing a URL restores filter state |

#### 02 — Data Design

| # | Name | Inputs | Output | Done when |
|---|---|---|---|---|
| 1 | Core task schema | — | `League`, `Region`, `Task`, `Skill`, `Difficulty`, `PointTier` types; one sample league JSON with 10 tasks | TypeScript compiles; sample data validates against schema |
| 2 | Spatial schema | Data L1 | `Location`, `TaskLocation`, `ActivityType` types added; sample data includes 5 locations with tile coords | Every task in sample data has ≥1 resolved `LocationId` |
| 3 | Prerequisite schema | Data L2 | `Requirement`, `Relic` types; sample data includes skill/quest/region requirements | Requirement type union exhaustively handled in a type-check test |
| 4 | User state schema | Data L3 | `UserState`, `TaskList`, `RoutePlan` types; localStorage serialization/deserialization with migration placeholder | Round-trip serialization test passes; unknown keys preserved |
| 5 | Build pipeline | Data L4 | Node validation script; raw → bundle merge; schema tests; versioning | Running `npm run validate-data` exits 0 on valid data, non-zero on schema errors |

#### 03 — Task Map

| # | Name | Inputs | Output | Done when |
|---|---|---|---|---|
| 1 | Leaflet scaffold | Data L2 | Map mounts with OSRS tile layer; correct projection; zoom/pan works; plane 0 loads | Map renders in `/map` route without console errors |
| 2 | Point markers | Map L1 | Each `Location` renders a simple circle marker with name tooltip | All locations from sample data appear at correct tile positions |
| 3 | Labeled zone cards | Map L2 | Circle markers replaced by labeled zone cards (name + activity icons + task count); zoom-gated density | Cards appear at zoom ≥ 7; clusters at zoom 5–7; region names at zoom < 5 |
| 4 | Region overlays + filters | Map L3 + Data L3 | Semi-transparent region polygons; locked/unlocked styles; map filter sidebar wired to global filter state | Toggling a region filter pill shows/hides that region's location labels |
| 5 | Detail panel + My List overlay + mobile | Map L4 | Location detail panel on click; "My List" ring overlay; plane toggle; bottom sheet on mobile | Clicking a label shows the detail panel; "Add to list" works; mobile layout passes visual check |

#### 04 — Route Planning

| # | Name | Inputs | Output | Done when |
|---|---|---|---|---|
| 1 | Task list CRUD | Data L4 | Create / rename / delete lists; add / remove tasks; persist to UserState | Multiple lists can be created, tasks added/removed, state survives reload |
| 2 | Planner page layout | Route L1 | Split-pane layout: task list left, static map stub right; list selector dropdown; task cards with sequence numbers | Route renders; switching active list updates the card sequence |
| 3 | Route map overlay | Route L2 + Map L1 | Numbered pins on map for each task; polyline connecting stops; auto-fit bounding box | Pins render in correct sequence; polyline connects them in order |
| 4 | Auto-sort algorithm | Route L3 | Nearest-neighbor greedy sort; prerequisite conflict detection with inline warnings; re-sort button | 10-task list sorts in < 50 ms; prerequisite conflicts show warning banner |
| 5 | Export + teleport v2 + session progress | Route L4 | Copy-as-text; download JSON; share link via URL encoding; session progress (completed pins mute); teleport-aware distance stub | Share link round-trips; completed tasks mute on map and move to bottom of list |

#### 05 — Task Tracking

| # | Name | Inputs | Output | Done when |
|---|---|---|---|---|
| 1 | Checkbox persistence | Data L4 | Task list with checkboxes; toggle writes to `completedTaskIds` in UserState; survives page reload | Checking a task and reloading shows it still checked |
| 2 | Points + tier bar | Track L1 | Points total from completed tasks; tier progress bar; next-tier gap display; tier timeline | Points update immediately on checkbox toggle; correct tier shown |
| 3 | Filters + sort | Track L2 | All filter controls (region, difficulty, status, skill, tags, meets-requirements, my-list-only); sort options; URL-serialized filter state | Each filter narrows the visible task list correctly; URL reflects filter state |
| 4 | Region panels + detail drawer | Track L3 | Collapsible per-region progress panels; task detail drawer with requirements indicator; "View on map" link | Region panels show correct counts; drawer opens on row click; map link works |
| 5 | Bulk actions + export + milestones | Track L4 | Mark-all-filtered bulk action with confirmation; export/import JSON; share-progress URL; tier and region completion toasts | Bulk mark works; export JSON re-imports correctly; trophy toast fires on tier crossing |

#### 06 — Data Assembly

| # | Name | Inputs | Output | Done when |
|---|---|---|---|---|
| 1 | Raw scrapers | — | `scrape-tasks.ts` + `scrape-locations.ts`; rate-limited wiki client; cached raw JSON output | Scraping any partial task set (≥1 task) produces valid output; re-run with cache makes 0 HTTP requests |
| 2 | ID generation + normalization | Assembly L1 | `normalize.ts`; stable deterministic IDs; region slug normalization | Two runs on same input produce identical IDs; no duplicate IDs |
| 3 | Auto-matcher | Assembly L2 | `auto-match.ts` + 5 strategy modules; confidence scores; `matched-draft.json` | ≥60% auto-confirmed; re-run after new tasks appends without modifying existing entries |
| 4 | Annotation / review UI | Assembly L3 | Local Express server + React browser UI; Leaflet map preview; `annotations.json` write | Confirming a task writes to annotations and removes from queue; refresh doesn't lose progress |
| 5 | Validate + bundle + CI | Assembly L4 | `build-data.ts`; validator; `data/leagues/{id}.json`; CI workflow | Valid partial set exits 0; missing-location tasks exit non-zero with IDs listed; CI gates PRs |

### §9.3 Cross-File Dependency Graph

```
Asm L1 ──► Asm L2 ──► Asm L3 ──► Asm L4 ──► Asm L5
                                                 │
                                                 ▼
Data L1 ──► Data L2 ──► Data L3 ──► Data L4 ──► Data L5
   │            │            │            │
   ▼            ▼            ▼            ▼
Site L1 ──► Site L2      Map L1 ──► Map L2 ──► Map L3 ──► Map L4 ──► Map L5
                                                              │
Route L1 ──► Route L2 ──────────────────────────────────────►│
                                                              │
Track L1 ──► Track L2 ──► Track L3 ──► Track L4 ──► Track L5◄┘
```

**Additional cross-file dependency edges** not shown in the diagram above:
- `Site L3 ──► Track L3` — the tracker filter layer builds on the global filter context and URL param serialization pattern established in Site Layer 3.
- `Map L1 ──► Track L4` — the task detail drawer's "View on map" link and requirement status display depend on the Leaflet scaffold being in place.

**Assembly pipeline relationship**: The assembly pipeline output (Assembly L5's `data/leagues/{id}.json` bundle) is what the app layers consume. During active development, a manually constructed `sample.json` (as used in Data L1) can substitute for assembly output.

### §9.4 MVP Definition

**Minimum viable product = Assembly L5 + all five app Layer 3s complete.**

- Assembly L5 produces the validated data bundle required by the app; a manually constructed `sample.json` can substitute during development of app layers.
- The five app Layer 3s are: Site L3, Data L3, Map L3, Route L3, Track L3.

**Full feature set = all six Layer 5s complete** (Site L5, Data L5, Map L5, Route L5, Track L5, Assembly L5).

---

_Spec assembled from: 01-site-overview.md, 02-data-design.md, 03-task-map.md, 04-route-planning.md, 05-task-tracking.md, 06-data-assembly.md, LAYERS.md_
_All integration issues resolved. See INTEGRATION-NOTES.md for the resolution log._
