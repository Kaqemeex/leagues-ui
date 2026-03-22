# Leagues Planner — Implementation Layer Decomposition

Each spec file is broken into 5 implementation layers. Layers within a file
are sequentially dependent — later layers build on earlier ones. Layers across
files that share the same number can be built in parallel (e.g. all five Layer
1s can be started simultaneously).

---

## Layer numbering convention

| Layer | Theme | What gets built |
|---|---|---|
| 1 | Scaffold | Bare-bones structure, types, or UI shell with no logic |
| 2 | Core read path | Data loads and renders correctly; user can see but not interact much |
| 3 | Core write path | User-driven interactions: filtering, toggling, adding |
| 4 | Integration | Features connect across pages; shared state flows correctly |
| 5 | Polish & edge cases | Export/share, mobile, offline, advanced algorithms |

---

## 01 — Site Overview layers

| # | Name | Inputs | Output | Done when |
|---|---|---|---|---|
| 1 | App scaffold | — | Vite + React/Svelte project; routing; nav shell; league selector loads league names | Nav links render; switching leagues changes a context value |
| 2 | Static pages | Layer 1 | Dashboard stub; all routes render placeholder content; task browser shows raw unfiltered task list | Every route is reachable; task list renders all rows |
| 3 | Global filter state | Layer 2 | Region filter pills; shared filter context; search bar wired to task name filter | Toggling a region pill filters both /tasks and /map simultaneously |
| 4 | Points chip + Settings | Layer 3 | Live points chip in header from UserState; Settings page (league swap, preferences) | Chip updates when a task is marked done; settings persist on reload |
| 5 | PWA + URL state | Layer 4 | Service worker for offline; filter state serialized to URL query params; deep-linkable filter views | App loads offline; sharing a URL restores filter state |

---

## 02 — Data Design layers

| # | Name | Inputs | Output | Done when |
|---|---|---|---|---|
| 1 | Core task schema | — | `League`, `Region`, `Task`, `Skill`, `Difficulty`, `PointTier` types; one sample league JSON with 10 tasks | TypeScript compiles; sample data validates against schema |
| 2 | Spatial schema | Layer 1 | `Location`, `TaskLocation`, `ActivityType` types added; sample data includes 5 locations with tile coords | Every task in sample data has ≥1 resolved `LocationId` |
| 3 | Prerequisite schema | Layer 2 | `Requirement`, `Relic` types; sample data includes skill/quest/region requirements | Requirement type union exhaustively handled in a type-check test |
| 4 | User state schema | Layer 3 | `UserState`, `TaskList`, `RoutePlan` types; localStorage serialization/deserialization with migration placeholder | Round-trip serialization test passes; unknown keys preserved |
| 5 | Build pipeline | Layer 4 | Node validation script; raw → bundle merge; schema tests; versioning; sourcing notes | Running `npm run validate-data` exits 0 on valid data, non-zero on schema errors |

---

## 03 — Task Map layers

| # | Name | Inputs | Output | Done when |
|---|---|---|---|---|
| 1 | Leaflet scaffold | Data L2 | Map mounts with OSRS tile layer; correct projection; zoom/pan works; plane 0 loads | Map renders in `/map` route without console errors |
| 2 | Point markers | Map L1 | Each `Location` renders a simple circle marker with name tooltip | All locations from sample data appear at correct tile positions |
| 3 | Labeled zone cards | Map L2 | Circle markers replaced by labeled zone cards (name + activity icons + task count); zoom-gated density | Cards appear at zoom ≥ 7; clusters at zoom 5–7; region names at zoom 3–5 |
| 4 | Region overlays + filters | Map L3 + Data L3 | Semi-transparent region polygons; locked/unlocked styles; map filter sidebar wired to global filter state | Toggling a region filter pill shows/hides that region's location labels |
| 5 | Detail panel + My List overlay + mobile | Map L4 | Location detail panel on click; "My List" ring overlay; plane toggle; bottom sheet on mobile | Clicking a label shows the detail panel; "Add to list" works; mobile layout passes visual check |

---

## 04 — Route Planning layers

| # | Name | Inputs | Output | Done when |
|---|---|---|---|---|
| 1 | Task list CRUD | Data L4 | Create / rename / delete lists; add / remove tasks; persist to UserState | Multiple lists can be created, tasks added/removed, state survives reload |
| 2 | Planner page layout | Route L1 | Split-pane layout: task list left, static map stub right; list selector dropdown; task cards with sequence numbers | Route renders; switching active list updates the card sequence |
| 3 | Route map overlay | Route L2 + Map L1 | Numbered pins on map for each task; polyline connecting stops; auto-fit bounding box | Pins render in correct sequence; polyline connects them in order |
| 4 | Auto-sort algorithm | Route L3 | Nearest-neighbor greedy sort; prerequisite conflict detection with inline warnings; re-sort button | 10-task list sorts in < 50 ms; prerequisite conflicts show warning banner |
| 5 | Export + teleport v2 + session progress | Route L4 | Copy-as-text; download JSON; share link via URL encoding; session progress (completed pins mute); teleport-aware distance stub | Share link round-trips; completed tasks mute on map and move to bottom of list |

---

## 05 — Task Tracking layers

| # | Name | Inputs | Output | Done when |
|---|---|---|---|---|
| 1 | Checkbox persistence | Data L4 | Task list with checkboxes; toggle writes to `completedTaskIds` in UserState; survives page reload | Checking a task and reloading shows it still checked |
| 2 | Points + tier bar | Track L1 | Points total from completed tasks; tier progress bar; next-tier gap display; tier timeline | Points update immediately on checkbox toggle; correct tier shown |
| 3 | Filters + sort | Track L2 | All filter controls (region, difficulty, status, skill, tags, meets-requirements, my-list-only); sort options; URL-serialized filter state | Each filter narrows the visible task list correctly; URL reflects filter state |
| 4 | Region panels + detail drawer | Track L3 | Collapsible per-region progress panels; task detail drawer with requirements indicator; "View on map" link | Region panels show correct counts; drawer opens on row click; map link works |
| 5 | Bulk actions + export + milestones | Track L4 | Mark-all-filtered bulk action with confirmation; export/import JSON; share-progress URL; tier and region completion toasts | Bulk mark works; export JSON re-imports correctly; trophy toast fires on tier crossing |

---

## 06 — Data Assembly layers

| # | Name | Inputs | Output | Done when |
|---|---|---|---|---|
| 1 | Raw scrapers | — | `scrape-tasks.ts` + `scrape-locations.ts`; rate-limited wiki client; cached raw JSON output | Scraping any partial task set (≥1 task) produces valid output; re-run with cache makes 0 HTTP requests |
| 2 | ID generation + normalization | Assembly L1 | `normalize.ts`; stable deterministic IDs; region slug normalization | Two runs on same input produce identical IDs; no duplicate IDs |
| 3 | Auto-matcher | Assembly L2 | `auto-match.ts` + 5 strategy modules; confidence scores; `matched-draft.json` | ≥60% auto-confirmed; re-run after new tasks appends without modifying existing entries |
| 4 | Annotation / review UI | Assembly L3 | Local Express server + browser UI; Leaflet map preview; `annotations.json` write | Confirming a task writes to annotations and removes from queue; refresh doesn't lose progress |
| 5 | Validate + bundle + CI | Assembly L4 | `build-data.ts`; validator; `data/leagues/{id}.json`; CI workflow | Valid partial set exits 0; missing-location tasks exit non-zero with IDs listed; CI gates PRs |

---

## Cross-file dependencies

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

Additional cross-file dependency edges not shown above: `Site L3 ──► Track L3` (tracker filter layer builds on the global filter context and URL param serialization pattern); `Map L1 ──► Track L4` (task detail drawer's "View on map" link and requirement status display depend on the Leaflet scaffold being in place).

Assembly pipeline produces the data files that all other layers consume.
The app can run with a partial dataset at any stage — tasks without resolved
locations appear in the tracker/browser but not on the map.

> **Dependency clarification**: The assembly pipeline output (Assembly L5's
> `data/leagues/{id}.json` bundle) is what the app layers consume. During
> active development, a manually constructed `sample.json` (as used in Data L1)
> can substitute for assembly output.

Minimum viable product = Assembly L5 + all five app Layer 3s complete. (Assembly L5 produces the validated data bundle required by the app; a manually constructed `sample.json` can substitute during development of app layers.)
Full feature set = all six Layer 5s complete.
