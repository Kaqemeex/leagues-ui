# Leagues Planner — Task Map Feature

## Goal

A spatial view of tasks on the OSRS world map where the emphasis is on
**what you can do at a place**, not just that a task exists there. Instead of
generic interaction-spot icons (fishing spot, tree, rock), the map shows named
zones with readable labels describing the mix of activities available —
so you can glance at a location and know "I can fish, mine, and complete two
tasks here."

---

## Map Rendering

- **Base layer**: wiki tile server at `maps.runescape.wiki/osrs/{plane}/{z}/{x}/{y}.png`.
  Leaflet.js handles pan/zoom; all markers, labels, and overlays are custom React/Leaflet
  layers rendered on top. No tiles are bundled — the wiki server is the dependency.
- **Coordinate system**: OSRS tile coordinates mapped to Leaflet pixel space via a
  `L.CRS.Simple`-based custom CRS shim. The wiki's `x, y, plane` triplet is canonical;
  plane 0 = surface world. Plane is passed as a path segment in the tile URL.
- **Zoom levels**: tile map supports approximately zoom levels 0–9; locations
  are shown from zoom ≥ 3 to avoid clutter at world scale.

---

## Location Markers & Labels

This is the core visual difference from the wiki map.

Each `Location` is rendered as a **labeled zone** rather than a point icon:

```
┌────────────────────────┐
│  Lumbridge Swamp Mines │
│  ⛏ mining  🔥 smithing │
│  3 tasks available     │
└────────────────────────┘
```

- The label text is the `Location.name`.
- Activity icons (small, color-coded glyphs or emoji stand-ins) list the
  `Location.activities` array — this tells you at a glance what skills are
  exercised here.
- The task count badge shows how many tasks at this location are currently
  visible given the active filters. Tasks that are completed are shown in a
  muted style unless "show completed" is on.
- Clicking the label opens a **Location Detail Panel** (see below).

### Label Density Control

At low zoom levels (world view), only regions are highlighted, not individual
locations. As the user zooms in:

- **zoom < 5**: Region outlines and names only.
- **5 ≤ zoom < 7**: Cluster markers showing task count per area; hover expands. Zone markers begin at zoom ≥ 5.
- **zoom ≥ 7**: Full location labels appear.

---

## Location Detail Panel

Slides in from the right (or a bottom sheet on mobile) when a location is
clicked.

Contents:
- Location name and region badge
- Activity type chips (fishing, mining, etc.)
- Task list: all tasks at this location, with difficulty badges and points
  - Each task has an "Add to List" button → adds to the active `TaskList`
  - Completed tasks are shown struck-through
- "Plan route through here" button → passes this location to the Route Planner
  as a waypoint

---

## Filters (Sidebar or Top Bar)

The same filter state used in the Task Browser is reflected on the map — the
map shows only the locations that have at least one task matching the current
filters.

Filter controls specific to the map:

| Filter | Options |
|---|---|
| Region | Multi-select pills (only unlocked regions highlighted by default) |
| Difficulty | Easy / Medium / Hard / Elite / Master (multi-toggle) |
| Skills | Multi-select skill list |
| Tags | Free-text tag search (boss, slayer, minigame…) |
| Status | All / Incomplete only / Completed only |
| Has requirements | Show/hide tasks you don't yet meet requirements for |
| Task list | "Only show my list" — highlights locations for tasks in the active TaskList |

Filters are applied globally (shared state with Task Browser), so switching
from Map to Task Browser preserves the filter context.

---

## Region Overlays

Each region has a semi-transparent colored polygon overlay on the map
(color from `Region.color`). This helps quickly orient unlocked vs. locked
areas. Overlays can be toggled.

Locked regions render the overlay with a hatched/dimmed pattern. Unlocked
regions render with a lighter fill.

---

## "My List" Overlay

When the user has an active `TaskList` or `RoutePlan`, a second visual layer
highlights relevant locations:

- Locations containing list tasks glow or have a colored ring.
- Completed list tasks render in a success color (green ring).
- Remaining list tasks render in an accent color.

This makes it trivial to see "I've done everything in Kandarin except two
spots" without filtering.

---

## Map Controls

- **Zoom in / out** buttons
- **Reset view** — fits the user's unlocked regions into the viewport
- **Plane toggle** — switch between surface (plane 0), first floor, second
  floor for dungeons and multi-level areas
- **Toggle overlays** — region fill, location labels, route path (if plan
  active), completed tasks

---

## Mobile Considerations

- Bottom sheet replaces the side panel for location detail.
- Filters collapse into a drawer triggered by a filter icon button.
- Labels scale up slightly so they're tappable at touch sizes.

---

# Implementation Layers

## Layer 1 — Leaflet Scaffold

**Goal**: Mount a functional OSRS-projected Leaflet map in the `/map` route with tile loading, zoom/pan, and correct coordinate system — no data overlays yet.

**Builds on**: Data Layer 2 (spatial schema: `Location`, `TaskLocation`, `ActivityType` types and tile coordinate fields must exist to validate projection math).

**Deliverables**:
- `<MapView>` component mounted at the `/map` route, wrapping a Leaflet map instance
- OSRS tile layer configuration pointing at a community tile server URL (configurable via env var `VITE_TILE_SERVER_URL`)
- Custom Leaflet CRS (`OsrsCrs`) that converts OSRS `{x, y, plane}` tile coordinates to Leaflet `LatLng` pixel space using the fixed affine projection; note: verify that react-leaflet v4+ supports custom CRS injection via `MapContainer`'s `crs` prop before implementing `OsrsCrs` — this is a foundational dependency for Map, Planner, and the annotation review UI
- `usePlane` hook that holds the active plane value (default `0`) and exposes a setter; plane 0 tiles load on mount
- Zoom control buttons (in/out) and a "Reset view" button that fits a hardcoded bounding box for plane 0
- `mapUtils.ts` exporting `osrsTileToLatLng(x, y): LatLng` and `latLngToOsrsTile(latlng): {x, y}` conversion functions
- Route `/map` added to the app router and linked from the nav shell

**Acceptance criteria**:
- The `/map` route renders without console errors on first load
- The OSRS tile layer is visible and tiles load from the configured tile server
- Zoom in, zoom out, and pan all function correctly with the mouse and trackpad
- `osrsTileToLatLng` unit test: known OSRS coord (3222, 3218) maps to the expected Leaflet LatLng within ±1px at zoom 7
- `latLngToOsrsTile` round-trips: converting a coord to LatLng and back returns the original tile within ±1
- Switching to a non-existent plane shows no tile layer (graceful empty state, no error)
- The `/map` nav link is present in the nav shell and routes correctly

**Out of scope**: Location markers, labels, region overlays, filters, detail panel, cluster logic, mobile layout.

---

## Layer 2 — Point Markers

**Goal**: Render every `Location` from sample data as a simple circle marker on the map at its correct tile position, with a name tooltip on hover.

**Builds on**: Map Layer 1 (Leaflet scaffold, `OsrsCrs`, `osrsTileToLatLng`); Data Layer 2 (sample data with 5 locations each having `{x, y, plane}` tile coordinates).

**Deliverables**:
- `useLocations(leagueId)` hook that loads the active league's location data from the bundled JSON and returns `Location[]`
- `<LocationMarker>` component that accepts a `Location` prop and renders a Leaflet `CircleMarker` at the converted tile position, visible only when `location.plane === activePlane`; note: `<LocationMarker>` is a scaffold component that will be replaced by `<LocationLabel>` in Layer 3 — do not over-engineer it
- `<MapView>` updated to iterate `locations` and render one `<LocationMarker>` per entry
- Tooltip on each `<LocationMarker>` showing `location.name` on hover (Leaflet `Tooltip` with `permanent: false`)
- Marker visibility gated on zoom: markers are hidden below zoom level 3 (Leaflet `minZoom` prop on the marker layer)

**Acceptance criteria**:
- All 5 locations from sample data appear as circle markers at visually correct positions on the map
- Hovering a marker shows a tooltip with the exact `location.name` string
- Markers for plane 0 locations are visible when `activePlane === 0`; they disappear when the plane is toggled to 1
- No marker renders at a null or undefined coordinate (locations missing tile coords are silently skipped with a console warning)
- Switching leagues causes markers to re-render for the new league's locations

**Out of scope**: Labeled zone card styling, activity icons, task count badges, clustering, region overlays, filters, detail panel.

---

## Layer 3 — Labeled Zone Cards

**Goal**: Replace plain circle markers with fully styled labeled zone cards showing location name, activity icons, and a filtered task count badge, with zoom-gated density levels (region names → cluster markers → full cards).

**Builds on**: Map Layer 2 (point markers, `<LocationMarker>`, `useLocations`); Data Layer 2 (location `activities` array, `TaskLocation` join, task data).

**Deliverables**:
- `<LocationLabel>` component: a Leaflet `DivIcon`-based overlay card rendering location name, activity icon glyphs (one per entry in `location.activities`), and a task count badge; accepts `location: Location`, `taskCount: number`, `hasCompleted: boolean` props
- `<ClusterMarker>` component: a circle marker showing the aggregate task count for a geographic area, rendered at zoom 5–7 using a simple bounding-box grouping strategy
- `useZoomTier(map)` hook returning `'region' | 'cluster' | 'label'` based on current zoom level (region: zoom < 5, cluster: 5 ≤ zoom < 7, label: zoom ≥ 7)
- `<RegionNameOverlay>` component: a `DivIcon` label placed at the centroid of each region polygon, rendered only when `zoomTier === 'region'`
- `useFilteredTaskCount(locationId)` hook returning the count of tasks at a location matching the current global filter state
- `<MapView>` updated to switch between `<RegionNameOverlay>`, `<ClusterMarker>`, and `<LocationLabel>` based on `zoomTier`
- Completed tasks rendered in a muted CSS class on the card unless the global "show completed" filter is active
- Activity icon mapping: `ACTIVITY_ICONS` constant in `activityIcons.ts` mapping each `ActivityType` string to a glyph character or SVG icon component

**Acceptance criteria**:
- At zoom < 5, only region name overlays render; no location cards or cluster markers are visible
- At 5 ≤ zoom < 7, cluster markers render with correct aggregate task counts per area; individual location cards are hidden
- At zoom ≥ 7, full `<LocationLabel>` cards render for all locations passing current filters
- Each card's task count badge matches the count of tasks at that location in the sample data (with no filters active)
- Activity icons render for every `ActivityType` present in the sample data; no icon renders as an empty box or broken glyph
- Zooming from level 4 to 8 transitions density tiers without console errors or marker duplication
- A location with 0 tasks matching the current filter is not rendered (hidden, not shown with a 0 badge)

**Out of scope**: Region polygon fill overlays, filter sidebar controls, detail panel, "My List" overlay, mobile layout.

---

## Layer 4 — Region Overlays and Filters

**Goal**: Add semi-transparent region polygon overlays with locked/unlocked styling, and wire the map filter sidebar to the global filter state so location cards react to filter changes in real time.

**Builds on**: Map Layer 3 (labeled zone cards, `useFilteredTaskCount`, zoom tiers); Data Layer 3 (prerequisite and `Relic` schema; `Region` type with `color` and polygon geometry fields; `UserState` with `unlockedRegionIds`).

**Deliverables**:
- `<RegionOverlay>` component: a Leaflet `Polygon` rendered for each region using its `region.polygon`, filled with `region.color` at 20% opacity when unlocked and a hatched SVG `PatternFill` at 15% opacity when locked; togglable via an overlay toggle control
- `useRegionLockState(regionId)` hook returning `'unlocked' | 'locked'` by reading `UserState.unlockedRegionIds`
- `<MapFilterSidebar>` component: collapsible sidebar (left edge) containing all filter controls listed in the spec (Region multi-select pills, Difficulty multi-toggle, Skills multi-select, Tags text search, Status select, Has requirements toggle, Task list toggle); reads from and writes to the global `FilterContext`
- `<MapFilterSidebar>` is hidden below breakpoint `768px` and replaced by a filter icon button that opens a drawer
- `useMapFilters()` hook composing global `FilterContext` with a `visibleRegionIds` derived value (only regions with ≥1 matching location after filtering)
- `<LocationLabel>` updated to re-derive `taskCount` from `useFilteredTaskCount` on every filter state change
- Overlay toggle toolbar button that shows/hides region polygon fills independently of location labels

**Acceptance criteria**:
- Each region's polygon fills the correct geographic area on the map (visually verified against the OSRS world map)
- Unlocked regions render with a light semi-transparent fill; locked regions render with the hatched dimmed pattern; the difference is visually distinct
- Toggling the region overlay button hides all `<RegionOverlay>` polygons without removing location labels
- Selecting a region filter pill in `<MapFilterSidebar>` hides location cards in all other regions within one render cycle
- Toggling the Difficulty filter to "Elite only" updates all visible task count badges to reflect only Elite tasks
- Filter state changed on `/map` is reflected immediately when navigating to the Task Browser (shared `FilterContext`)
- Filter state changed in the Task Browser is reflected on the map when navigating back

**Out of scope**: Location detail panel, "My List" ring overlay, plane toggle for upper floors, mobile bottom sheet, "Add to list" interaction.

---

## Layer 5 — Detail Panel, My List Overlay, and Mobile

**Goal**: Complete the interactive layer: clicking a location opens the `<LocationDetailPanel>`, the "My List" ring overlay highlights active task list locations, the plane toggle enables dungeon/multi-floor navigation, and the mobile bottom sheet layout passes visual review.

**Builds on**: Map Layer 4 (region overlays, filter sidebar, `<LocationLabel>`, `useMapFilters`); Data Layer 4 (`UserState`, `TaskList`, `RoutePlan` types and localStorage persistence).

**Deliverables**:
- `<LocationDetailPanel>` component: slides in from the right on desktop (CSS `transform` transition, 360px wide); contains location name, region badge, activity type chips, task list rows (each with difficulty badge, points value, "Add to List" button, and struck-through style for completed tasks), and a "Plan route through here" button that appends the location to the active `RoutePlan` as a waypoint
- `useLocationDetail(locationId)` hook returning the full `Location` with its resolved tasks, requirements status per task, and completion status from `UserState`
- `<MyListOverlay>` component: a second Leaflet marker layer rendered on top of location labels; each location that has ≥1 task in the active `TaskList` gets a colored ring — green (`--color-success`) for fully completed locations, accent (`--color-accent`) for partially or not-started locations
- `usePlane` hook extended to support planes 1 and 2; plane toggle control in the map toolbar cycles through available planes; tile layer and all marker layers re-render for the active plane; note: `usePlane` is component-local to each `MapContainer` instance (passed via Leaflet's map context), not a global singleton — this prevents the planner's map panel from sharing plane state with the main map
- "Add to List" button in `<LocationDetailPanel>` calls `taskListStore.addTaskToList(listId, taskId)` (where `listId` is read from `useUserState().activeTaskListId`) and shows a brief inline confirmation ("Added"); note: `taskListStore` is imported directly, not wrapped in a React context
- "Plan route through here" calls `routePlanStore.addWaypoint(locationId)` (the store defined in Route Layer 1); note: `routePlanStore` is imported directly, not wrapped in a React context
- Mobile layout: `<LocationDetailPanel>` renders as a bottom sheet (fixed bottom, full-width, 60vh max-height, scrollable) when viewport width < 768px; `<MapFilterSidebar>` renders as a drawer triggered by a floating filter icon button
- `<LocationLabel>` touch target size increased to minimum 44×44px on mobile via CSS

**Acceptance criteria**:
- Clicking a `<LocationLabel>` card opens `<LocationDetailPanel>` with the correct location name, region badge, and task list
- Every task row in the panel shows the correct difficulty badge and points value from sample data
- Clicking "Add to List" on a task adds it to the active `TaskList`; the button changes to a confirmation state and does not add duplicates
- After adding a task, the corresponding location's `<MyListOverlay>` ring appears on the map without a page reload
- Completed tasks in the panel render with a struck-through style
- The "Plan route through here" button is present and clicking it does not throw an error (waypoint added to plan)
- Clicking the plane toggle cycles from 0 → 1 → 2 → 0; location markers for the new plane render and markers for the previous plane disappear
- On a 390px-wide viewport, the detail panel renders as a bottom sheet; the filter sidebar is hidden and a filter icon button is visible
- On a 390px-wide viewport, each `<LocationLabel>` card has a minimum tap target of 44×44px (verifiable via browser DevTools)
- The "My List" overlay ring renders in green for a location where all list tasks are marked complete, and in accent color when at least one list task is incomplete

**Out of scope**: Export/share of route plan, offline tile caching, URL-serialized filter state (deferred to Site Layer 5), teleport-aware distance calculation (deferred to Route Layer 5).
