# Leagues Planner — Task Tracking Feature

## Goal

Let the player mark tasks complete, see their point total and tier progress,
and know at a glance what's left — all scoped to the tasks and regions they
actually care about.

---

## Tracker Page Layout

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

---

## Points & Tier Progress

### Header Summary

Always visible at the top of the Tracker page (and as the global chip in the
header):

- **Earned points** / **Total available points** for currently filtered scope.
- **Current tier** trophy name and icon.
- **Progress bar** toward the next tier, showing exact points gap.

### Tier Thresholds

Rendered as a timeline / stepped bar below the summary:

```
Bronze  Silver  Gold  Rune  Dragon
  ■───────■───────■─────■──────■
        ↑ you are here
```

Clicking a tier shows which tasks would push you over that threshold —
useful for targeted grinding.

---

## Task List in the Tracker

Each row:

```
☑  Kill the Barrows Brothers    Elite    50 pts    Morytania
```

- Checkbox to toggle completion state (persists to localStorage `UserState`).
- Task name (clicking opens a detail drawer).
- Difficulty badge (color-coded).
- Point value.
- Region tag.
- Completion rate from wiki data (small grey text, e.g. "72% of players" —
  used to surface easy wins: sort by completion rate descending to see tasks
  most players have done, i.e. the lowest-friction points available).

Completed tasks render the checkbox filled, text muted, but remain visible by
default (can be hidden via the Status filter).

### Bulk Actions

- **Mark all filtered as done** — with a confirmation dialog ("Mark 14 Easy
  Misthalin tasks as complete?").
- **Unmark all** — for re-setting after a league reset or data correction.
- **Import from clipboard** — paste a comma-separated list of task IDs or
  names (e.g. from a friend's export).

---

## Filters on the Tracker

| Filter | Behavior |
|---|---|
| Region | Show only tasks in selected regions. Defaults to unlocked regions. |
| Difficulty | Multi-select. Useful for focusing a session on only Hard+ tasks. |
| Status | All / Incomplete / Completed |
| Skill | Show only tasks that exercise selected skills |
| My list only | Narrow to the active TaskList |
| Meets requirements | Hide tasks you don't yet qualify for — checks both region unlocks AND current skill levels entered in Settings |
| Tags | Boss, slayer, minigame, quest, etc. |

Filters are shared in URL query params, so linking directly to
`/track?region=morytania&difficulty=Hard,Elite&status=incomplete` is possible.

---

## Region Progress Panels

Below the main task list, collapsible panels show per-region summaries:

```
▼ Morytania  ████████░░  18/42 tasks  1,240/4,200 pts
▼ Kourend    ██████████  42/42 tasks  ✓ COMPLETE
▼ Desert     ████░░░░░░   8/30 tasks    680/3,210 pts
```

Each panel expands to show that region's task list inline. This makes it easy
to see where you're closest to a clean sweep.

---

## Task Detail Drawer

Clicking any task row opens a slide-in drawer:

- **Task name** and difficulty badge
- **Description** (full wiki text)
- **Points value**
- **Region** and **Location(s)** — with a "View on map" link that opens the
  Map view centered on this location
- **Requirements** — full list with red/green indicators. Checks:
  - Skill requirements against `UserState.skillLevels` (red if level not met or unknown)
  - Region requirements against `UserState.unlockedRegionIds`
  - Quest/item requirements shown but not automatically evaluated (manual red/green toggle)
- **Skills exercised**
- **Tags**
- **Wiki completion rate**
- **Add to list** / **Remove from list** buttons for the active TaskList
- **Mark complete** toggle

---

## State Persistence

### localStorage

All completion state is stored locally under key `leagues-planner-state`.
No login required. State is per-league (scoped by `leagueId`).

### Export / Import

- **Export**: downloads `leagues-plan-{date}.json` with full `UserState`.
- **Import**: drag-and-drop or file picker to restore a saved state.
- **Reset**: wipe state for the active league with a confirmation dialog.

### Optional: Share Completion

A "share my progress" button encodes completed task IDs into a URL that renders
a read-only tracker view. No backend needed — state is decoded from the URL.

---

## Notifications / Milestones

When a tier threshold is crossed (by marking a task done), a banner appears:

```
🏆 You reached Rune Trophy! (30,000 points)
```

Similarly, when a region is 100% complete:

```
✓ Morytania complete — all 42 tasks done!
```

These are transient toasts, not persistent alerts.

---

# Implementation Layers

## Layer 1 — Checkbox Persistence

**Goal**: Render a basic task list with functional checkboxes that write completion state to `UserState` in localStorage and survive a page reload.

**Builds on**: Data Layer 4 (`UserState`, `TaskList`, localStorage serialization/deserialization).

**Deliverables**:
- `<TrackerPage>` — top-level route component at `/track`; renders a flat, unfiltered task list
- `<TaskRow>` — single task row with a checkbox, task name, difficulty badge, point value, and region tag
- `useUserState` hook — reads/writes `UserState` from/to localStorage under key `leagues-planner-state`; exposes `toggleTaskComplete(taskId: string): void`
- `completedTaskIds` set wired through `useUserState`; checkbox checked state derived from this set
- No filter controls, no sorting, no point totals in this layer

**Acceptance criteria**:
- Checking a `<TaskRow>` checkbox calls `toggleTaskComplete` and immediately reflects the checked state in the UI without a page reload
- Reloading the page shows all previously checked tasks still checked
- Unchecking a previously completed task removes it from `completedTaskIds` and persists the removal on reload
- `<TrackerPage>` renders all tasks for the active league with no console errors
- `useUserState` correctly scopes state by `leagueId` so switching leagues shows a distinct completion set

**Out of scope**: Points display, tier bar, filters, sort controls, region panels, task detail drawer, bulk actions, export/import, toasts.

---

## Layer 2 — Points + Tier Bar

**Goal**: Display the player's earned points total and a tier progress bar that updates immediately when any checkbox is toggled.

**Builds on**: Tracking Layer 1 (`useUserState`, `<TrackerPage>`), Data Layer 1 (`PointTier` thresholds, task point values).

**Deliverables**:
- `<PointsSummary>` — header bar showing earned points, total available points, current tier name and icon, and exact points gap to next tier
- `<TierProgressBar>` — horizontal progress bar component filled to the current tier percentage; accepts `earned: number` and `tiers: PointTier[]` props
- `<TierTimeline>` — stepped row of tier nodes (Bronze → Silver → Gold → Rune → Dragon) with a "you are here" indicator; clicking a tier node calls an `onTierClick(tier: PointTier): void` callback (handler is a no-op stub in this layer)
- `usePointTotals(completedTaskIds: Set<string>, tasks: Task[]): { earned: number; total: number; currentTier: PointTier; nextTier: PointTier | null; gap: number }` — pure derived computation hook
- Points values sourced from the active league's task data; no separate API call

**Acceptance criteria**:
- Checking a `<TaskRow>` checkbox causes `<PointsSummary>` to reflect the new earned total within the same render cycle (no reload required)
- `<TierProgressBar>` fill percentage matches `earned / nextTier.threshold` (or 100% if max tier reached)
- Current tier name and icon in `<PointsSummary>` are correct for the earned total at every tier boundary
- `<TierTimeline>` renders exactly one node per defined `PointTier` and marks the current tier visually distinct
- `usePointTotals` returns `gap = 0` and `nextTier = null` when the player has reached the maximum tier

**Out of scope**: Clicking a tier node to show qualifying tasks (stub only), filter-scoped point totals, URL filter state, region panels, task detail drawer, bulk actions, export/import, toasts.

---

## Layer 3 — Filters + Sort

**Goal**: Wire all filter controls and sort options to the task list so each filter correctly narrows visible rows and the active filter state is reflected in the URL query string.

**Builds on**: Tracking Layer 2 (`<TrackerPage>`, `useUserState`, `usePointTotals`), Data Layer 3 (`Requirement` types for meets-requirements filter), Site Layer 3 (global filter context and URL param serialization pattern).

**Deliverables**:
- `<FilterSidebar>` — container for all filter controls: Region (multi-select), Difficulty (multi-select), Status (All / Incomplete / Completed), Skill (multi-select), Tags (multi-select), My List Only (toggle), Meets Requirements (toggle)
- `<SortControl>` — dropdown with options: Difficulty, Points, Completion %, Region
- `useTrackerFilters` hook — reads filter state from URL query params on mount, exposes typed setters for each filter dimension, serializes changes back to the URL without a full navigation
- `useTrackerFilteredTasks(tasks: Task[], filters: TrackerFilters, userState: UserState): Task[]` — pure function/hook that applies all active filters and the selected sort order; returns a sorted, filtered `Task[]`
- `<PointsSummary>` updated to compute totals over the filtered task set rather than the full set
- Filter state shape: `{ regions: string[]; difficulties: Difficulty[]; status: 'all' | 'incomplete' | 'completed'; skills: string[]; tags: string[]; myListOnly: boolean; meetsRequirements: boolean; sort: SortOption }`
- URL param format: `/track?region=morytania&difficulty=Hard,Elite&status=incomplete`

**Acceptance criteria**:
- Selecting a region in `<FilterSidebar>` removes all tasks outside that region from `<TaskRow>` renders within the same render cycle
- Setting Status to "Incomplete" hides all rows whose `taskId` is in `completedTaskIds`
- Enabling "My List Only" shows only tasks present in the active `TaskList`
- Enabling "Meets Requirements" hides tasks whose `Requirement` array contains any unmet condition given current `UserState`
- Pasting a URL with valid query params into the browser restores the exact same filter state and visible task list
- `<PointsSummary>` earned and total values reflect only the filtered task set
- All seven filter dimensions can be combined simultaneously and produce a correct intersection result

**Out of scope**: Region progress panels, task detail drawer, bulk actions, export/import, toasts, tier-node click behavior.

---

## Layer 4 — Region Panels + Detail Drawer

**Goal**: Add collapsible per-region progress panels below the task list and a slide-in `<TaskDetailDrawer>` that opens when a task row is clicked.

**Builds on**: Tracking Layer 3 (filtered task list, `useTrackerFilters`), Data Layer 3 (`Requirement` types, location data), Map Layer 1 (route target for "View on map" link).

**Deliverables**:
- `<RegionPanel>` — collapsible section showing region name, inline progress bar, task count (completed/total), and points (earned/total); clicking the header toggles expansion; expanded state shows that region's `<TaskRow>` list inline
- `useRegionSummaries(tasks: Task[], completedTaskIds: Set<string>): RegionSummary[]` — derives per-region `{ regionId, name, completedCount, totalCount, earnedPoints, totalPoints }` array
- `<TaskDetailDrawer>` — slide-in panel (right side) that renders on `<TaskRow>` name click; displays task name, difficulty badge, full description, point value, region, location(s), requirements list with met/unmet indicators, skills exercised, tags, wiki completion rate, "Add to list" / "Remove from list" buttons, and "Mark complete" toggle
- `useRequirementStatus(requirements: Requirement[], userState: UserState): RequirementStatus[]` — returns each requirement with a `met: boolean | 'manual'` field; `true`/`false` for skill and region requirements (automatically evaluated against `userState`); `'manual'` for quest and item requirements (shown but not automatically evaluated — user manually toggles red/green); `RequirementStatus` is typed as `{ requirement: Requirement; met: boolean | 'manual' }`
- "View on map" link in `<TaskDetailDrawer>` navigates to `/map?taskId={taskId}` using React Router `<Link>`; actual map centering is implemented in Map Layer 5
- `<TrackerPage>` renders `<RegionPanel>` list below `<TaskRow>` list; both sections respect active filter state

**Acceptance criteria**:
- Clicking a region panel header toggles its expanded/collapsed state without closing other panels
- Each `<RegionPanel>` completed count and earned points update immediately when a checkbox inside it is toggled
- Clicking a task name in any `<TaskRow>` opens `<TaskDetailDrawer>` with that task's data populated
- Requirements in `<TaskDetailDrawer>` display a green indicator for met conditions and a red indicator for unmet conditions based on current `UserState`
- "Add to list" in `<TaskDetailDrawer>` adds the task to the active `TaskList` and the button label changes to "Remove from list" without closing the drawer
- "Mark complete" toggle in `<TaskDetailDrawer>` has the same effect as the `<TaskRow>` checkbox and both stay in sync
- "View on map" link in `<TaskDetailDrawer>` navigates to `/map?taskId={taskId}`
- `<RegionPanel>` list renders only regions that contain at least one task matching the active filter state

**Out of scope**: Bulk actions, export/import, share-progress URL, tier and region completion toasts, actual map centering on task location (Map Layer 5).

---

## Layer 5 — Bulk Actions + Export + Milestones

**Goal**: Deliver bulk task completion actions, JSON export/import, a share-progress URL, and transient toast notifications for tier and region completion milestones.

**Builds on**: Tracking Layer 4 (full tracker UI, `useUserState`, `useRegionSummaries`, `usePointTotals`), Data Layer 4 (`UserState` serialization), Data Layer 5 (validated data bundle for stable task IDs).

**Deliverables**:
- `<BulkActionBar>` — toolbar rendered above the task list when filters are active; contains "Mark all filtered as done" button (opens `<ConfirmDialog>` showing count and active filters before writing) and "Unmark all" button (also confirmed)
- `<ConfirmDialog>` — modal with a message prop, "Confirm" and "Cancel" actions; reusable across bulk mark and reset flows
- `markAllFiltered(filteredTaskIds: string[]): void` and `unmarkAll(): void` actions added to `useUserState`
- Export: `exportUserState(): void` function that serializes current `UserState` to `leagues-plan-{YYYY-MM-DD}.json` and triggers a browser download
- Import: `<ImportButton>` with a hidden `<input type="file">` and drag-and-drop zone; reads the JSON file, validates it against the `UserState` schema, and calls `importUserState(state: UserState): void` on success; shows an inline error message on validation failure
- "Import from clipboard" action in `<BulkActionBar>`: parses a comma-separated string of task IDs or task names, resolves them against the active league's task list, and marks matching tasks complete
- Share-progress URL: `generateShareUrl(completedTaskIds: Set<string>): string` encodes completed task IDs as base64 into the URL param `?progress=<base64>` (distinct from the route planner's `?plan=<base64>` param to avoid collision); navigating to that URL renders `<TrackerPage>` in read-only mode with no checkboxes
- `useMilestoneToasts` hook — subscribes to `completedTaskIds` changes via `useEffect`; fires a toast via a `<ToastProvider>` context when `usePointTotals` detects a tier crossing or `useRegionSummaries` detects a region reaching 100%; each toast auto-dismisses after 4 seconds
- `<Toast>` — single transient notification component; tier toast shows trophy icon and tier name; region toast shows checkmark and region name

**Acceptance criteria**:
- Clicking "Mark all filtered as done" opens `<ConfirmDialog>` showing the exact count of tasks that will be affected; confirming marks all of them complete in `UserState` and updates `<PointsSummary>` and all `<RegionPanel>` counts immediately
- "Unmark all" with confirmation sets `completedTaskIds` to an empty set and all checkboxes render unchecked
- Clicking export downloads a valid JSON file that, when re-imported, restores the identical `completedTaskIds` set (round-trip test: export → clear state → import → completion set matches original)
- Importing a JSON file with an invalid schema shows an error message and does not modify current `UserState`
- A share URL generated by `generateShareUrl` renders `<TrackerPage>` with checkboxes absent and the correct tasks shown as complete
- A tier-crossing toast appears within the same render cycle as the checkbox toggle that caused the crossing and auto-dismisses after 4 seconds
- A region-completion toast appears when the last incomplete task in a region is checked and auto-dismisses after 4 seconds
- No more than one toast is visible at a time; if two milestones trigger simultaneously, they queue sequentially

**Out of scope**: Server-side persistence, user accounts, multi-device sync, push notifications, offline service worker (Site Layer 5).
