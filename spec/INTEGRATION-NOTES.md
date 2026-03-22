# Integration Notes
_Generated: 2026-03-22_

## BLOCKERS
Issues that would cause implementation ambiguity or contradictions.

_(All blockers resolved — see RESOLVED section below.)_

---

## WARNINGS

_(All warnings resolved — see RESOLVED section below.)_

---

## NOTES

_(All notes resolved — see RESOLVED section below.)_

---

## RESOLVED

- **BLOCKER 1 — `src/types/` vs `src/schemas/` path conflict**: Updated all layer deliverables in `02-data-design.md` (Layers 1–4) to use `src/schemas/` paths and Zod schema exports with `z.infer<>` inferred types instead of plain TypeScript interfaces in `src/types/`.

- **BLOCKER 2 — RoutePlan stub vs full definition**: Removed the stub caveat from Data Layer 4 in `02-data-design.md`; Layer 4 now specifies implementing the full `RoutePlan`/`RouteStop` shape (including `stops: RouteStop[]`, `sourceTaskListId`, and `lastModified`) as already defined in the User State schema section.

- **BLOCKER 3 — Route path `/plan` vs `/planner`**: Updated `04-route-planning.md` Layer 2 to use `/planner` as the route path for `<PlannerPage>`, matching the Site Overview definition.

- **BLOCKER 4 — `useFilteredTasks` hook name collision**: Renamed the tracker-specific hook to `useTrackerFilteredTasks` throughout `05-task-tracking.md` Layer 3 to avoid collision with the global `useFilteredTasks` hook defined in Site Layer 3.

- **BLOCKER 5 — `region.polygonCoords` field doesn't exist**: Added `polygon?: [number, number][]` to the `Region` interface in `02-data-design.md`; updated `03-task-map.md` Layer 4 to reference `region.polygon` instead of `region.polygonCoords`.

- **BLOCKER 6 — `LocationRef` type is undefined**: Added `LocationRef` as a `string` type alias (referencing a `Location.id`) to the Location section in `02-data-design.md` and to the `src/schemas/location.ts` file list; added a clarifying note in `04-route-planning.md` near the Teleport interface.

- **BLOCKER 7 — Teleport schema orphaned**: Added `src/schemas/teleport.ts` to the schema file list and a full `Teleport` schema section to `02-data-design.md`; added `data/teleports.json` to the Data Sources section; updated `06-data-assembly.md` Layer 5 to validate `data/teleports.json` against the `Teleport` schema as part of `npm run validate-data`.

- **BLOCKER 8 — LAYERS.md dependency graph ambiguity**: Added a clarifying note below the cross-file dependency diagram in `LAYERS.md` explaining that Assembly L5's `data/leagues/{id}.json` bundle is the output consumed by app layers, and that a manually constructed `sample.json` can substitute during active development.

- **W1 — zoom tier boundary ambiguity** (`03-task-map.md`): Updated zoom tier descriptions to use explicit exclusive lower bounds: zoom < 5 = region names, 5 ≤ zoom < 7 = clusters, zoom ≥ 7 = full labels; zone markers begin at zoom ≥ 5. Applied consistently to feature description, `useZoomTier` hook spec, and Layer 3 acceptance criteria.

- **W2 — `useUserState` vs `UserStateContext` naming** (`01-site-overview.md`): Replaced all `UserStateContext` references in Layer 4 deliverables with `useUserState` hook pattern; added note that the Zustand store is accessed directly via `useUserState()`, not wrapped in a React context.

- **W3 — preferences schema vs Settings UI mismatch** (`01-site-overview.md`): Updated the Layer 4 settings toggle example to reference `showCompletedOnMap: boolean` (an existing `UserState.preferences` field) instead of the vague "compact task rows" toggle.

- **W4 — auto-matcher 4 vs 5 strategy modules** (`06-data-assembly.md`, `LAYERS.md`): Added `item-location.ts` as a fifth strategy file in the `match-strategies/` directory deliverable in Layer 3; updated LAYERS.md Assembly L3 row to say "5 strategy modules".

- **W5 — `RoutePlanContext` undefined** (`03-task-map.md`): Replaced `RoutePlanContext.addWaypoint(locationId)` with `routePlanStore.addWaypoint(locationId)` in Layer 5; added clarifying note that `routePlanStore` is imported directly, not wrapped in a React context.

- **W6 — `TaskListContext` undefined** (`03-task-map.md`): Replaced `TaskListContext.addTask(taskId)` with `taskListStore.addTaskToList(listId, taskId)` in Layer 5; added note that the active list ID is read from `useUserState().activeTaskListId`; noted direct store import (no React context).

- **W7 — `FilterState` base type and shared URL param keys** (`01-site-overview.md`): Added `BaseFilterState` type with `regions: string[]` and `searchQuery: string` in Layer 5; specified that both `FilterState` and `TrackerFilters` extend this base; documented canonical URL param keys `region` and `q` used by both pages.

- **W8 — location ID stability** (`06-data-assembly.md`): Updated Layer 2 normalization to use `loc-{kebab-slug}` (name-based) instead of `loc-{hash}` (content-hash); added note that the slug is derived from the location name only so IDs remain stable when tile coordinates are corrected in re-scrapes.

- **W9 — tracker share URL param name** (`05-task-tracking.md`): Specified that `generateShareUrl` encodes completed task IDs as base64 into `?progress=<base64>`, distinct from the route planner's `?plan=<base64>` param.

- **W10 — `src/lib/` vs `src/schemas/` clarity** (`02-data-design.md`): Added a one-sentence note in the schema architecture section clarifying that `src/schemas/` contains Zod schema definitions and inferred types; `src/lib/` contains runtime utilities that import from schemas but contain no schema definitions.

- **N1 — LAYERS.md missing dependency edges** (`LAYERS.md`): Added a note below the dependency graph documenting `Site L3 ──► Track L3` and `Map L1 ──► Track L4` cross-file dependencies.

- **N2 — `<LocationMarker>` throwaway note** (`03-task-map.md`): Added a comment to the `<LocationMarker>` deliverable in Layer 2 noting it is a scaffold component that will be replaced by `<LocationLabel>` in Layer 3 — do not over-engineer it.

- **N3 — `SortableTask` and `RequirementMap` undefined** (`04-route-planning.md`): Added `src/schemas/planner.ts` file entry in Layer 4 defining `SortableTask` as `Pick<Task, 'id' | 'locations' | 'requirements'>` and `RequirementMap` as `Record<string, Requirement[]>`.

- **N4 — `RouteStop` waypoint export format** (`04-route-planning.md`): Added export format specification in Layer 5: waypoints included in JSON export with `type: 'waypoint'`; appear as "(waypoint at {locationName})" in text export; encoded inline with task stops in the share URL.

- **N5 — `RequirementStatus` tri-state** (`05-task-tracking.md`): Updated `useRequirementStatus` return type in Layer 4 to `{ requirement: Requirement; met: boolean | 'manual' }` — `'manual'` returned for quest and item requirements that are shown but not automatically evaluated.

- **N6 — Annotation `taskName` stability note** (`06-data-assembly.md`): Added a note in the Annotation interface section that `taskName` is case-sensitive, used as the join key, and must be manually updated if a task is renamed in a wiki update.

- **N7 — react-leaflet custom CRS validation note** (`03-task-map.md`): Added a note to the `OsrsCrs` deliverable in Layer 1 to verify react-leaflet v4+ supports custom CRS injection via `MapContainer`'s `crs` prop before implementing, given it is a foundational dependency.

- **N8 — Assembly review UI: React vs vanilla** (`06-data-assembly.md`): Specified React (not vanilla HTML/JS) as the required tech choice for the review UI in Layer 4, so it can import `src/schemas/` directly.

- **N9 — `UserState.completedTaskIds` Zod transform** (`02-data-design.md`): Added an inline note to the `completedTaskIds` field in the UserState interface specifying the required Zod transform: `z.array(z.string()).transform(arr => new Set(arr))` with matching `.preprocess` on parse and custom serializer on stringify.

- **N10 — MVP definition clarification** (`LAYERS.md`): Updated MVP definition from "Assembly L3 + all five app Layer 3s" to "Assembly L5 + all five app Layer 3s" with a note that a manually constructed `sample.json` can substitute during development of app layers.

- **N11 — `usePlane` scope clarification** (`03-task-map.md`): Added a note in Layer 5 that `usePlane` is component-local to each `MapContainer` instance, not a global singleton, preventing the planner's map panel from sharing plane state with the main map.

- **N12 — `LeagueContext` source clarification** (`01-site-overview.md`): Updated the Layer 1 `LeagueContext` deliverable to specify that the list of available leagues is loaded from `data/leagues/index.json` (produced by Assembly Layer 5), with a hardcoded stub acceptable during development.
