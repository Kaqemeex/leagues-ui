# Leagues Planner — Site Overview & Feature Summary

## Purpose

A planning and routing tool for OSRS Leagues players. The primary gap this fills
versus the wiki is **personalized list-making, rich filtering, and spatial task
awareness** — knowing not just what tasks exist, but where to do them, in what
order, and whether you've done them.

---

## Core User Flows

1. **Browse & filter tasks** — slice the task list by region, skill, difficulty,
   relic dependency, completion status, or any combination.
2. **Build a task list** — select tasks from browse results and add them to a
   personal "run list" for a session or goal.
3. **Plan a route** — given a task list, find an efficient geographic ordering
   that minimizes travel.
4. **View on the map** — see task locations on an interactive OSRS map; labels
   show what activities are available at each spot rather than generic icons.
5. **Track completion** — mark tasks done, see point totals and tier progress,
   and know what's left.

---

## Top-Level Pages / Views

| Route | Name | Description |
|---|---|---|
| `/` | Dashboard | League summary: current points, tier progress, region unlocks, quick links to active list and recent activity. |
| `/tasks` | Task Browser | Filterable, sortable table/list of all tasks for the selected league. |
| `/map` | Task Map | Interactive map with labeled activity zones rather than raw interaction-spot icons. |
| `/planner` | Route Planner | Ordered task list with travel-path overlay on the map. |
| `/track` | Tracker | Completion state — checked-off tasks, points earned, tier milestones. |
| `/settings` | Settings | Active league selection, character name (for optional wiki sync), display preferences. |

---

## Global UI Elements

- **League selector** — dropdown in the nav; all data is scoped to the chosen
  league (e.g. Trailblazer Reloaded, Raging Echoes). Defaults to the most
  recent league.
- **Search bar** — fuzzy search across task names and descriptions, always
  visible in the header.
- **Points summary chip** — compact display of `earned / total` points and
  current trophy tier, visible on every page.
- **Region filter pills** — quick-toggle region filters persistent across the
  Task Browser and Map views, so unlocking two regions narrows everything to
  those regions automatically.

---

## Navigation Structure

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

---

## Design Principles

- **Filter-first** — every list is filterable; no page dumps a wall of tasks
  without controls.
- **Spatial awareness** — tasks should always be linkable to locations; the Map
  is a first-class view, not an afterthought.
- **Offline-capable** — task data is bundled or cached locally; the app should
  work without a live network once loaded.
- **League-agnostic data model** — supporting a new league means adding a new
  data file, not changing application logic.
- **No account required** — state is stored in localStorage by default;
  optional export/import for backup.

---

## Technology Assumptions

- **Framework**: React + TypeScript, bundled with Vite.
- **Routing**: React Router (client-side, no SSR).
- **Styling**: Tailwind CSS.
- **Map**: Leaflet.js via react-leaflet, custom OSRS CRS shim, wiki tile server.
- **State**: Zustand, persisted to localStorage. No backend, no sync.
- **Data**: static JSON files per league, bundled at build time.
- **Validation**: Zod — schemas are the source of truth for all data shapes.
  Used for: parsing league JSON bundles, validating localStorage state on load
  (handles corruption/migration), parsing URL query params, and validating
  pipeline output in `build-data.ts` (replaces bespoke validator logic).
- **Linting**: oxlint — fast Rust-based linter (via `npx oxlint` or `oxc`); replaces ESLint for rule enforcement. Run as part of CI and as a pre-commit check.
- **Formatting**: oxfmt — Rust-based formatter for TypeScript/JavaScript. Configured via `oxfmt.toml`; run on save in editor and enforced in CI (`oxfmt --check`).
- **Testing**: Playwright. Tests drive the locally-running dev server; Claude
  can interact with the app via browser automation to verify behavior.
- **Hosting**: local dev server (`vite dev`) during development. Deployment TBD.

---

# Implementation Layers

## Layer 1 — App Scaffold

**Goal**: Stand up a runnable project with routing, a nav shell, and a working league selector that exposes league names to the rest of the app via context.

**Builds on**: No prior layers required; this is the foundation for all subsequent site layers.

**Deliverables**:
- Vite project initialized with React or Svelte and TypeScript configured
- Client-side router installed and configured (e.g. React Router v6 or SvelteKit file-based routing)
- Route stubs created for `/`, `/tasks`, `/map`, `/planner`, `/track`, and `/settings` — each rendering only its route name as a heading
- `Header` component with logo/title, league selector `<select>`, search bar `<input>` (not yet wired), points chip placeholder, and nav links to all six routes
- `Footer` component with OSRS Wiki attribution text and a GitHub link
- `LeagueContext` (or equivalent store) that reads available league names from `data/leagues/index.json` (produced by Assembly Layer 5) and exposes the currently selected league ID to all descendants; during development before assembly is complete, a hardcoded stub list is acceptable
- Switching the league selector updates the context value; no data fetch occurs yet

**Acceptance criteria**:
- `npm run dev` starts without errors and opens the app in a browser
- Navigating to each of the six routes renders that route's stub heading without a 404
- The `Header` and `Footer` components are visible on every route
- Selecting a different league from the dropdown changes the value returned by `LeagueContext` (verifiable via React DevTools or a rendered debug label)
- No TypeScript compilation errors at build time

**Out of scope**: Actual task data loading, search bar functionality, points chip logic, any page content beyond route stubs, and all routing for Map/Planner/Tracker functionality.

---

## Layer 2 — Static Pages

**Goal**: Every route renders real placeholder content and the task browser displays the full unfiltered task list loaded from a static data file.

**Builds on**: Layer 1 (app scaffold, routing, league context); Data Layer 1 (core task schema and sample league JSON).

**Deliverables**:
- Dashboard (`/`) stub showing league name, a static points placeholder (e.g. `0 / 0 pts`), and labelled empty sections for tier progress, region unlocks, and active list
- `/tasks` page that reads the active league's static JSON file (resolved via `LeagueContext`) and renders all tasks as rows in a table or card list — columns include task name, region, difficulty, and point value
- `/map` page with a placeholder `<div>` sized to fill the viewport (no Leaflet yet) and a "Map coming soon" label
- `/planner` page with a two-column layout stub: empty task list on the left, map placeholder on the right
- `/track` page with a placeholder task list showing all tasks with unchecked checkboxes (state not yet persisted)
- `/settings` page with a league selector (duplicating nav control) and labelled preference stubs (no save logic yet)
- Data-loading utility `loadLeagueTasks(leagueId: string): Task[]` that imports the correct static JSON at build time and returns typed task objects

**Acceptance criteria**:
- Every route is reachable by direct URL navigation without a blank screen or console error
- `/tasks` renders one row per task in the sample league JSON; the row count matches the number of entries in the JSON file
- Switching the league selector re-renders `/tasks` with data from the newly selected league's JSON (or an empty state if no data file exists for that league)
- All pages pass TypeScript type-checking with no `any` suppressions in new code
- The app builds to a static bundle with `npm run build` without errors

**Out of scope**: Filtering, sorting, search, completion state persistence, Leaflet map rendering, and any interactive planner or tracker functionality.

---

## Layer 3 — Global Filter State

**Goal**: Region filter pills and a wired search bar establish shared filter state that simultaneously narrows the task list on `/tasks` and (when the map exists) on `/map`.

**Builds on**: Layer 2 (static pages, task list rendering); Data Layer 1 (task schema with `region` field).

**Deliverables**:
- `FilterContext` (or equivalent store) holding: `activeRegions: Set<RegionId>`, `searchQuery: string`, and a reset action
- Region filter pill bar component rendering one pill per region in the active league; selected pills are visually distinct; clicking a pill toggles its region in `FilterContext`
- Search bar in the `Header` wired to `FilterContext.searchQuery`; input updates the store value on each keystroke with no debounce requirement at this layer
- `useFilteredTasks(tasks: Task[]): Task[]` hook (or equivalent derived store) that returns only tasks matching all active region filters AND the search query substring against task name
- `/tasks` page consumes `useFilteredTasks` so its rendered list reflects the current filter state
- Region pill bar rendered on both `/tasks` and `/map` (map still shows placeholder content at this layer); the same `FilterContext` instance drives both
- Filter state resets to "all regions, empty search" when the active league changes

**Acceptance criteria**:
- Toggling a region pill on `/tasks` immediately removes tasks from non-selected regions from the rendered list
- Toggling the same pill again restores those tasks
- Entering text in the search bar filters the task list to rows whose name contains the search string (case-insensitive)
- Navigating from `/tasks` to `/map` and back preserves the current filter state (pills and search query remain unchanged)
- Changing the active league resets all filter pills to unselected and clears the search input
- No TypeScript errors; `FilterContext` type is fully typed with no `any`

**Out of scope**: Filtering by difficulty, skill, relic dependency, or completion status; map marker filtering; URL serialization of filter state; debounced search.

---

## Layer 4 — Points Chip and Settings

**Goal**: The points chip in the header reflects live earned/total points derived from `UserState`, and the Settings page persists league choice and display preferences across page reloads.

**Builds on**: Layer 3 (global filter state, full page shells); Data Layer 4 (UserState schema, localStorage serialization).

**Deliverables**:
- `useUserState` hook (Zustand store, accessed directly — not wrapped in a React context) that loads from `localStorage` on mount and writes back on every mutation; initial state is an empty `completedTaskIds` set and default preferences
- Points chip component in `Header` that reads `completedTaskIds` from `useUserState()`, sums point values of completed tasks for the active league, and displays `earned / total pts` plus the current trophy tier label
- Trophy tier derived from earned points using the league's tier thresholds; tier label updates reactively
- `/track` page checkboxes now write to `useUserState().completedTaskIds` (toggling a checkbox calls `toggleTask(taskId)`)
- `/settings` page with a working league selector (synced to `LeagueContext`), a "Character name" text input, and at minimum one display preference toggle (e.g. `showCompletedOnMap: boolean` from `UserState.preferences`); all values saved via `useUserState()` on change
- Settings values survive a hard page reload (read back from `localStorage` on mount)
- `useUserState` migration placeholder: if `localStorage` schema version is missing or mismatched, reset to defaults without throwing

**Acceptance criteria**:
- Checking a task on `/track` causes the points chip in the header to increment by that task's point value within the same render cycle
- Unchecking the task decrements the chip back to the prior value
- The trophy tier label in the chip changes to the next tier label when earned points cross the tier threshold
- Reloading the page after checking tasks shows the same checked state and the same points total
- Changing the league in `/settings` updates `LeagueContext` and the chip resets to the new league's totals
- Entering a character name and reloading the page shows the same name pre-filled in the input
- No TypeScript errors; `UserState` type matches the Data Layer 4 schema

**Out of scope**: Cross-device sync, export/import of user state, bulk task actions, tier completion toasts, and PWA/offline functionality.

---

## Layer 5 — PWA and URL State

**Goal**: The app loads and functions fully offline after the first visit, and all active filter state is serialized to URL query parameters so any filtered view is deep-linkable.

**Builds on**: Layer 4 (points chip, settings, UserState persistence); all prior site layers complete.

**Deliverables**:
- Service worker registered via Vite PWA plugin (e.g. `vite-plugin-pwa`) with a precache manifest covering all static assets and league JSON files bundled at build time
- `manifest.json` with app name, icons at 192×192 and 512×512, `display: standalone`, and appropriate `start_url`
- `BaseFilterState` type with shared dimensions: `{ regions: string[]; searchQuery: string }` — the global `FilterState` (used by `FilterContext`) and the tracker's `TrackerFilters` both extend this base; the URL param keys `region` and `q` are canonical and used consistently by both `/tasks` and `/track`
- URL serialization utility `filtersToParams(filters: FilterState): URLSearchParams` and `paramsToFilters(params: URLSearchParams): Partial<FilterState>` — encoding `regions` as a comma-separated value under the key `region` and `searchQuery` as the key `q`
- `FilterContext` updated to read initial state from the current URL query string on mount, then push URL updates via `history.replaceState` (not `pushState`) on every filter change
- Navigating to `/tasks?regions=Misthalin,Karamja&q=mine` restores those exact region pills as active and populates the search input with "mine"
- Offline indicator: when `navigator.onLine` is false, a banner or chip variant signals offline mode; the app remains fully usable for browsing, filtering, and toggling tasks
- `npm run build` produces a `dist/` directory with a valid service worker and precache manifest; no uncached network requests are required for core app functionality after first load

**Acceptance criteria**:
- After first load, disabling the network in DevTools and reloading the page renders the full app without any network errors in the console
- Copying the URL from a filtered `/tasks` view, opening it in a new tab, and observing that the same region pills are active and the search input matches
- `paramsToFilters(filtersToParams(f))` round-trips correctly for any valid `FilterState` (verifiable via a unit test)
- The service worker appears as "activated and running" in the DevTools Application panel after the first load
- The `manifest.json` passes Chrome's PWA installability checklist (no manifest-related errors in DevTools)
- All prior layer acceptance criteria continue to pass after service worker registration
