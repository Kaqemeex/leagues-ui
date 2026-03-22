# Leagues Planner — Route Planning Feature

## Goal

Given a set of tasks the player wants to complete, suggest (or let the player
manually construct) an ordered path that minimizes travel and respects
logical prerequisites — so you can execute a session efficiently instead of
bouncing randomly across the map.

---

## Concepts

| Term | Definition |
|---|---|
| **Task List** | An unordered collection of tasks the user wants to do. Multiple lists can exist; one is "active." |
| **Route Plan** | An ordered sequence of tasks (derived from a Task List) with a corresponding map path. |
| **Leg** | The segment of travel between two consecutive tasks in a route. |
| **Waypoint** | A specific `Location` explicitly pinned into a route, even without a task attached. |

A Task List is the input; a Route Plan is the output. The user can auto-generate
a plan from a list, then manually re-order it.

---

## Route Planner Page Layout

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

---

## Task List Management

### Creating a List

- "New List" button → prompt for name → empty list created.
- Tasks can be added from:
  - The Task Browser ("Add to list" button on any task row).
  - The Map ("Add to list" in the Location Detail Panel).
  - The Planner's own search/add within the left panel.

### Editing a List

- Drag-and-drop reordering within the left panel.
- Remove individual tasks with a ✕ button.
- Bulk actions: remove completed, remove by region, clear all.
- Rename or delete a list from the list selector dropdown.

### Multiple Lists

Users can maintain several named lists simultaneously:
- "Grinding Easy tasks today"
- "Unlocking Morytania — prerequisites"
- "Boss diary tasks"

Only one list is "active" at a time (shown on the map and in the tracker).
Switching the active list updates the map overlay and tracker view immediately.

---

## Auto-Sort (Route Optimization)

The "Auto-sort route" button reorders tasks in the active list to minimize
estimated travel cost.

**Starting point**: the first stop in the list (task or waypoint). The user
sets this by dragging a task to position 1 or prepending a waypoint.

### Algorithm — teleport-aware nearest-neighbor

1. Start from the first stop's location.
2. At each step, pick the unvisited task whose `Location` has the lowest
   **effective travel cost** from the current position (see below).
3. Respect hard prerequisites: if task B requires task A, A cannot be placed
   after B. Violations are shown as inline warnings (not blocking).

This is a greedy heuristic, not an optimal TSP solve, but fast enough for
typical 10–30 task lists.

### Effective travel cost

Raw tile distance is the fallback. When teleports are enabled, the cost
between two locations is:

```
min(
  tile_distance(current, destination),
  ...for each enabled teleport T:
    tile_distance(current, T.origin) + T.cast_cost + tile_distance(T.destination, destination)
)
```

The algorithm picks the cheapest option at each step.

### Teleport configuration

Teleports are defined in `data/teleports.json` — a league-aware list of every
meaningful teleport in OSRS plus leagues-specific extras. Each entry:

(`LocationRef` is defined in `src/schemas/location.ts` as a `string` type alias referencing a `Location.id`.)

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

The user configures accessible teleports via a **checklist** in Settings
(stored as `enabledTeleportIds` in `UserState`). Each teleport is toggled
on/off manually as the user unlocks it.

Default state:
- Standard spells: enabled
- League-specific teleports (e.g. bank teleport): enabled for the active league
- Item teleports (jewelry, tabs): disabled by default — user enables as acquired

Teleports are grouped in the checklist by source type (Spells / Items /
League / Relic) and filterable by region to reduce noise.

**Deferred**: named profiles, progressive auto-unlock based on skill levels
or relic tier.

---

## Manual Reordering

Drag-and-drop always takes precedence. After manual reordering the auto-sort
button shows a "re-sort" affordance to re-apply if desired.

Prerequisite violations from manual ordering are flagged inline:

```
⚠ Task "Barrows Chest" requires Morytania region — drag it below your
   region unlock task, or unlock Morytania first.
```

---

## Route Map Overlay

When a Route Plan is active, the map panel draws:

- **Numbered pins** at each task's location, matching the left-panel order.
- **Polyline legs** connecting consecutive stops — a thin path showing the
  intended travel route.
- **Completed stop style** — pins for done tasks render in a muted/checked
  style.
- The map auto-fits the bounding box of all route stops when the plan is first
  opened or re-sorted.

---

## Task Card in the Planner

Each task in the left panel shows:

```
[3]  Kill the Barrows Brothers (Elite — 50 pts)
     📍 Barrows — Morytania
     Req: 💀 Morytania unlocked
     [ Mark done ]  [ Remove ]
```

- Sequence number
- Task name, difficulty badge, points
- Primary location with region tag
- First blocking requirement (collapsed; expand for all)
- Mark done / Remove actions

---

## Exporting a Plan

- **Copy as text**: numbered list of task names with locations, paste-able
  into Discord or a notes app.
- **Download JSON**: full plan with task IDs for re-import.
- **Share link**: encodes the task ID list into a URL query string for
  shareable read-only plan views (no backend needed — all data is decoded
  client-side from the URL).

---

## Progress During a Session

As tasks are marked done (from the Planner or Tracker):
- The left panel item gains a checkmark and moves to a "Completed" section at
  the bottom (or is hidden if the user prefers).
- The map pin transitions to the completed style.
- Points earned update in the global header chip.
- The route re-fits to remaining incomplete stops.

---

# Implementation Layers

## Layer 1 — Task List CRUD

**Goal**: Establish persistent task list data management so users can create, rename, delete, and populate lists that survive page reload.

**Builds on**: Data Layer 4 (`UserState`, `TaskList`, `RoutePlan` types and localStorage serialization).

**Deliverables**:
- `taskListStore.ts` — create, rename, delete, and set-active operations on `TaskList` objects, backed by `UserState` in localStorage
- `addTaskToList(listId: string, taskId: string): void` — appends a task to a named list, no-ops on duplicate
- `removeTaskFromList(listId: string, taskId: string): void` — removes a task entry by ID
- `setActiveList(listId: string): void` — writes `activeListId` to `UserState`
- `useTaskLists()` hook — returns all lists, the active list ID, and the CRUD actions
- Unit tests covering create/rename/delete round-trips and localStorage persistence

**Acceptance criteria**:
- A new list can be created with a name and immediately appears in the store.
- A task added to a list persists after a full page reload.
- A task removed from a list is absent after a full page reload.
- Renaming a list updates its name without changing its ID or task entries.
- Deleting a list removes it and, if it was active, sets `activeListId` to another list or `null`.
- `addTaskToList` called twice with the same task ID does not create a duplicate entry.

**Out of scope**: UI rendering of any list or task card; drag-and-drop reordering; auto-sort; map overlay.

---

## Layer 2 — Planner Page Layout

**Goal**: Render a navigable split-pane planner page where the active task list is displayed as ordered task cards and the list selector controls which list is shown.

**Builds on**: Route Layer 1 (task list store and hooks).

**Deliverables**:
- `<PlannerPage>` — top-level route component at `/planner`; renders the list selector header and the split-pane layout
- `<ListSelectorDropdown>` — dropdown showing all list names; triggers `setActiveList` on selection; includes a "New list" button that prompts for a name
- `<TaskListPanel>` — left-pane component; renders ordered `<TaskCard>` components for the active list; includes an "+ Add tasks" search entry
- `<TaskCard>` — displays sequence number, task name, difficulty badge, point value, primary location with region tag, first blocking requirement (collapsed), "Mark done" button, and "Remove" (✕) button
- `<MapStub>` — right-pane placeholder rendering a static grey rectangle with the text "Map preview coming in Layer 3"
- CSS/layout module giving each pane 50% width on desktop, stacked on mobile (no interaction required in this layer)

**Acceptance criteria**:
- `/planner` renders without console errors.
- Switching the active list via `<ListSelectorDropdown>` immediately re-renders `<TaskListPanel>` with the new list's tasks.
- Each `<TaskCard>` displays the correct sequence number matching its position in the list.
- Clicking "Remove" on a task card calls `removeTaskFromList` and the card disappears.
- Creating a new list via the "New list" button adds it to the dropdown.
- `<MapStub>` is visible in the right pane.

**Out of scope**: Live map rendering; drag-and-drop reordering; auto-sort; route overlay; export.

---

## Layer 3 — Route Map Overlay

**Goal**: Replace the map stub with a live Leaflet map that renders numbered pins and a polyline connecting all tasks in the active list in sequence order.

**Builds on**: Route Layer 2 (planner page layout); Map Layer 1 (Leaflet scaffold with OSRS tile layer and correct projection).

**Deliverables**:
- `<RouteMapPanel>` — replaces `<MapStub>` in `<PlannerPage>`; mounts the shared Leaflet map instance scoped to the planner route
- `useRoutePins(listId: string)` hook — derives an ordered array of `{ taskId, locationTileX, locationTileY, sequenceNumber }` from the active task list
- Numbered circular marker layer — each task's primary location rendered as a Leaflet `DivIcon` showing its sequence number; correct tile-coordinate projection reused from Map Layer 1
- Polyline layer — a single `L.Polyline` connecting pins in sequence order, re-drawn whenever the task order changes
- `fitRouteBounds()` utility — computes the bounding box of all route pins and calls `map.fitBounds()`; called on initial render and after re-sort
- "Fit route" and "Full map" buttons wired to `fitRouteBounds()` and `map.setView(worldCenter, minZoom)` respectively
- Drag-and-drop reordering in `<TaskListPanel>` (via a library such as `@dnd-kit/sortable`) writing the new order back to the store, causing pins and polyline to re-render

**Acceptance criteria**:
- Numbered pins appear at the correct tile positions for all tasks in the active list.
- Pin sequence numbers match the order shown in `<TaskListPanel>`.
- The polyline connects all pins in sequence order with no gaps.
- Dragging a task card to a new position updates both the left-panel sequence numbers and the map pin numbers within one render cycle.
- Switching the active list replaces all pins and the polyline with the new list's data.
- Clicking "Fit route" zooms the map to show all pins with padding.
- A list with zero tasks renders no pins and no polyline without console errors.

**Out of scope**: Completed-stop muted pin style; auto-sort algorithm; prerequisite warnings; export.

---

## Layer 4 — Auto-Sort Algorithm

**Goal**: Provide a one-click greedy nearest-neighbor sort that reorders the active list to minimize tile-distance travel, with inline prerequisite conflict warnings.

**Builds on**: Route Layer 3 (live map overlay and drag-and-drop reordering).

**Deliverables**:
- `src/schemas/planner.ts` — exports `SortableTask` defined as `Pick<Task, 'id' | 'locations' | 'requirements'>` and `RequirementMap` defined as `Record<string, Requirement[]>` (keyed by task ID, values are its requirements)
- `nearestNeighborSort(tasks: SortableTask[], startTile?: TileCoord): SortableTask[]` — pure function implementing the greedy nearest-neighbor heuristic; accepts an optional starting tile coordinate; uses Euclidean distance in tile space
- `detectPrerequisiteConflicts(orderedTasks: SortableTask[], requirements: RequirementMap): PrerequisiteConflict[]` — returns an array of conflict objects `{ taskId, blockedByTaskId, message }` for any task ordered before a task it depends on
- `<AutoSortButton>` — renders "Auto-sort route" in `<TaskListPanel>`; calls `nearestNeighborSort`, writes result to the store, then calls `detectPrerequisiteConflicts` and stores any conflicts
- `<PrerequisiteWarningBanner>` — renders one inline warning row per `PrerequisiteConflict` beneath the affected `<TaskCard>`; each row includes a "Fix order" button that swaps the two conflicting tasks
- "Re-sort" affordance on `<AutoSortButton>` — shown after any manual drag-and-drop reorder to indicate the sort can be re-applied
- Performance: `nearestNeighborSort` must complete in under 50 ms for a list of 30 tasks (verified by a unit test using `performance.now()`)

**Acceptance criteria**:
- Clicking "Auto-sort route" on a 10-task list reorders cards and pins within one render cycle.
- `nearestNeighborSort` with 30 tasks completes in under 50 ms in the unit test environment.
- A prerequisite conflict is detected and a `<PrerequisiteWarningBanner>` appears beneath the affected card when the sorted order violates a requirement.
- Clicking "Fix order" in the warning banner resolves the specific conflict and removes that banner.
- After any manual drag, the `<AutoSortButton>` label changes to "Re-sort route".
- A list with one task sorts without errors and shows no warnings.
- `nearestNeighborSort` is a pure function: calling it twice with the same input produces the same output.

**Out of scope**: Teleport-aware distance calculation; session progress (completed pin styles); export functionality.

---

## Layer 5 — Export, Teleport v2, and Session Progress

**Goal**: Deliver plan export (text, JSON, share link), completed-task visual feedback on the map and list, and a teleport-aware distance stub for future optimization.

**Builds on**: Route Layer 4 (auto-sort, prerequisite warnings, full planner page).

**Deliverables**:
- `exportPlanAsText(plan: RoutePlan): string` — returns a numbered plain-text list of task names with locations, suitable for pasting into Discord; `RouteStop` entries of type `waypoint` appear as "(waypoint at {locationName})" in the numbered list
- `exportPlanAsJSON(plan: RoutePlan): string` — returns a JSON string of the full plan including task IDs, list name, and schema version; `RouteStop` entries of type `waypoint` are included with `type: 'waypoint'` and their `locationId`
- `encodePlanToURL(plan: RoutePlan): string` — encodes task ID array into a URL query parameter (`?plan=<base64>`); waypoint stops are encoded inline with task stops in the base64 payload; no backend required
- `decodePlanFromURL(url: string): RoutePlan | null` — decodes and validates the query parameter client-side, returning `null` on malformed input
- `<ExportMenu>` — dropdown triggered by the "Export" button in `<TaskListPanel>`; offers three actions: "Copy as text" (writes to clipboard), "Download JSON" (triggers file download), "Share link" (writes URL to clipboard and shows a confirmation toast)
- Completed-pin style — `<RouteMapPanel>` renders pins for tasks in `completedTaskIds` with a muted grey `DivIcon` and a checkmark; incomplete pins retain the numbered style
- Completed-task section — `<TaskListPanel>` moves cards for completed tasks to a collapsed "Completed" section below the active tasks; a toggle shows/hides completed cards
- Route re-fit on completion — after a task is marked done, `fitRouteBounds()` is called on the remaining incomplete pins only
- `teleportAwareDistance(from: TileCoord, to: TileCoord, userState: UserState): number` — stub function that currently returns Euclidean tile distance; accepts `UserState` so teleport cost logic can be added later without changing the call site; exported and documented with a `// TODO: incorporate teleport graph` comment

**Acceptance criteria**:
- "Copy as text" writes a numbered plain-text list to the clipboard; pasting it shows task names and locations in order.
- "Download JSON" triggers a file download whose contents parse as valid JSON and contain the correct task IDs.
- A share link generated by `encodePlanToURL` round-trips through `decodePlanFromURL` and reconstructs the same task ID order.
- Opening a share link URL in a fresh browser tab renders the plan in read-only mode with no `UserState` dependency.
- Marking a task done from `<TaskCard>` moves its card to the "Completed" section and mutes its map pin within one render cycle.
- After marking a task done, `fitRouteBounds()` excludes the completed task's pin from the bounding box calculation.
- `teleportAwareDistance` is exported from its module and returns a number equal to the Euclidean tile distance given the current stub implementation.
- The "Completed" section in `<TaskListPanel>` can be toggled open and closed without affecting the active task order.
