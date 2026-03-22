# Leagues Planner — Data Assembly Pipeline

## Problem

The OSRS Wiki has two largely separate data surfaces:

1. **Task tables** — structured lists of tasks per league, with name, description,
   difficulty, points, region category, and completion percentage. These do NOT
   reliably include where a task is physically completed.

2. **Map data** — the wiki's interactive map has markers for fishing spots, mining
   rocks, trees, agility courses, bosses, etc. These are geo-located but not
   linked to league tasks.

Bridging these two surfaces — knowing that "Chop 50 Teak Logs" should resolve to
the Uzer Mastaba teak trees and the Ape Atoll woodcutting area — is the core
assembly challenge. It cannot be done purely programmatically; some human
annotation is always required, but automation can do the majority of the work.

### Task sourcing

All tasks come from the OSRS Wiki — no other source. The scraper is run
manually whenever an update is needed:

- **Historical leagues** (Trailblazer, Trailblazer Reloaded, Raging Echoes,
  etc.) — scrape once from their existing wiki pages. These are stable and
  won't change.
- **New leagues** — scrape after the official task list is published on the
  wiki. Re-run the scraper as the wiki is updated during the season.
- **No polling, no scheduling** — always a manual `npm run scrape` trigger.
- **No pre-wiki task entry** — tasks are only added once they appear on the
  wiki.

### Incremental / partial dataset constraint

**The full task list for a new league may not be on the wiki yet.** Early in
a season, only some tasks are documented. The pipeline must therefore:

- Work correctly with a **partial task set** — the app should be fully usable
  with however many tasks are currently known.
- Support **additive updates** — running the pipeline again after new tasks are
  discovered appends to existing data without invalidating prior annotations or
  matches.
- Never treat "no tasks yet for this region/difficulty" as an error — it is
  expected, especially early in a league season.
- Produce a **valid, launchable bundle** from any non-empty task set, even if
  many tasks lack location links (they render as `locationless` until resolved).

This shapes the pipeline to be a living process rather than a one-shot build.

---

## Data Sources

| Source | What it provides | Format |
|---|---|---|
| Wiki task tables | Task name, description, difficulty, points, region, completion % | HTML tables / wiki templates |
| Wiki map markers | Location name, tile coords, marker category (e.g. "Woodcutting") | JSON via wiki API (`action=query&prop=mapmarkers`) |
| Wiki item/monster pages | Drop sources, spawn locations | HTML / SMW queries |
| osrs-map community tileset | Pre-projected tile layers for Leaflet | XYZ tile PNG |
| Manual annotation file | Human-curated task→location links that automation can't resolve | JSON / YAML |

---

## Pipeline Stages

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

---

## Stage 1 — Scrape Tasks

**Script**: `scripts/scrape-tasks.ts`

Fetch the wiki task table for a given league (e.g.
`https://oldschool.runescape.wiki/w/Trailblazer_Reloaded_League/Tasks`).

The wiki renders tasks as HTML tables with columns:
`Task | Description | Difficulty | Points | % completed`

The region is either a page section header or a column value.

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
- Wiki pages use MediaWiki templates; some task data is in `{{Leagues task}}`
  template calls — the API's `action=parse` or raw wikitext endpoint is more
  reliable than scraping rendered HTML.
- Rate-limit requests: 1 request/second, respect `User-Agent` header with
  contact info as per wiki bot policy.
- Cache raw responses locally so re-runs don't re-fetch unchanged pages.

---

## Stage 2 — Scrape Locations

**Script**: `scripts/scrape-locations.ts`

The wiki map API exposes map markers used in the interactive map. Each marker
has a category (e.g. "Woodcutting", "Fishing spot", "Agility course"), a name,
and tile coordinates.

Relevant API endpoint:
```
https://oldschool.runescape.wiki/api.php?action=query&list=mapmarkers&mmlimit=500&mmcategory=Woodcutting&format=json
```

Repeat for each `ActivityType` category. Merge and deduplicate by tile position
and name.

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
- Not all wiki map marker categories map cleanly to `ActivityType`. A mapping
  table is needed (see Stage 4).
- Some locations are only findable via individual item/NPC pages
  (e.g. rare fishing spots, specific trees). These require a secondary scrape
  of relevant wiki categories.
- Tile coordinates use the OSRS tile system (`x, y, plane`). Verify projection
  by cross-checking a known landmark (e.g. Lumbridge Castle at ~3222, 3218, 0).

---

## Stage 3 — Manual Seed / Annotation File

**File**: `data/annotations/{league-id}/annotations.json`

A human-curated file that provides ground truth for task→location links that
automation cannot resolve. It also serves as the override mechanism — if the
auto-matcher gets something wrong, a manual entry here wins.

```ts
interface Annotation {
  taskName: string;           // exact match against RawTask.name
  locationNames: string[];    // exact match against RawLocation.name (≥1)
  locationless: boolean;      // true = task has no fixed location (e.g. milestones)
  notes?: string;             // e.g. "only the inner ring counts"
}
```

The annotation file is committed to the repo and grows over time. Because this
project is open source, `annotations.json` is the primary community contribution
surface — contributors submit PRs to add or correct task→location mappings
without needing to touch any application code.

**Note**: `taskName` is used as the join key between annotations and matched tasks. It is case-sensitive and must match the wiki-sourced task name exactly. If a task is renamed in a wiki update, its annotation entry must be manually updated.

`locationless: true` tasks are hidden from the map entirely. They appear in the
task browser and tracker as normal, but have no map pin. This is the correct
state for milestone tasks (e.g. "Reach total level 500") that have no physical
location.

---

## Stage 4 — Auto-Match (Heuristic Linker)

**Script**: `scripts/auto-match.ts`

Attempts to link each `RawTask` to one or more `RawLocation` entries without
human intervention.

### Matching strategies (applied in priority order)

1. **Explicit place name in description** — scan task description for known
   location names (fuzzy-matched against `RawLocation.name`). E.g.:
   > "Complete the Seers' Village Agility Course" → matches "Seers' Village
   > Rooftop Course"

2. **Skill + region intersection** — if a task description contains a skill
   keyword ("fish", "mine", "chop") and the task has a region, find all
   locations of that activity type within that region's bounding box.
   > "Catch 50 Monkfish" + region=Kandarin → all Fishing locations in Kandarin

3. **Boss/NPC name** — extract boss or NPC names from descriptions, cross-
   reference against location names.
   > "Kill Zulrah 5 times" → matches "Zulrah's Shrine"

4. **Quest name** — match against a known quest→location table (quests have
   fixed start/completion locations).

5. **Item name** — for tasks involving a specific item ("Smelt a Rune Bar"),
   look up the item's creation locations.

### Match result

Each task ends up in one of two states:

- **Matched** — one or more locations were found; written to `matched-draft.json`
  and does not appear in the review queue.
- **Unmatched** — no location could be determined; added to the review queue.

Output: `data/raw/{league-id}/matched-draft.json`

```ts
interface MatchedTask extends RawTask {
  id: string;                   // generated stable ID: "{league-prefix}-{slug}"
  matchedLocationNames: string[];  // empty = unmatched, goes to review queue
  matchStrategy: string;        // which strategy produced the match, for debugging
}
```

---

## Stage 5 — Human Review UI (Annotation Tool)

A minimal local web UI (separate from the main app) for reviewing and correcting
the draft matches.

**Script**: `scripts/review-server.ts` — launches a local Express server at
`http://localhost:3001`.

### Review queue

Shows all tasks with no matched location — i.e. `matchedLocationNames` is
empty and no annotation exists yet. Sorted by region then difficulty.

For each entry:
- Task name, description, region, difficulty
- A map preview (embedded Leaflet) centered on the task's region
- Controls:
  - **Assign location** — search and select one or more locations from the
    full location list; saves to `annotations.json`
  - **No location** — task has no fixed location (e.g. "Reach total level
    500"); marks `locationless: true` in `annotations.json`
  - **Skip** — defer to another session

### Progress display

```
Unmatched: 142 remaining / 480 total
Matched (auto): 278   Matched (manual): 60   Locationless: 0
```

---

## Stage 6 — Validate & Bundle

**Script**: `scripts/build-data.ts`

Merges `matched-draft.json` + `annotations.json` → applies all overrides →
validates the result against the full data schema → writes the final league
bundle.

### Merge logic

1. For each task, if an `annotations.json` entry exists for `taskName`, use its
   `locationNames` (override auto-match completely).
2. Otherwise use `matchedLocationNames` from the draft.
3. Resolve location names → Location objects (with full tile coords) from
   `raw-locations.json`. Fail validation if a referenced name can't be resolved.

### Validation checks

- Every task has at least one resolved location OR `locationless: true`.
- Every `locationId` reference in `TaskLocation` resolves to a real `Location`.
- No duplicate task IDs within a league.
- All `regionId` values on tasks and locations match a `Region` in the league.
- All `Requirement` discriminated union variants are valid.
- Points sum matches expected total (sanity check against wiki source).

Validation failures are reported as a structured error list, not a thrown
exception, so all errors are visible at once.

Output: `data/leagues/{league-id}.json` — the final bundle loaded by the app.

---

## Incremental Update Flow

When new tasks are discovered (e.g. a player posts an unreleased task on Reddit,
or the wiki is updated mid-season), the update cycle is:

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

### Key design rules for incrementalism

- **Never overwrite an existing annotation** — if `annotations.json` already
  has an entry for a task name, the pipeline must not alter it during a re-run.
  Annotations are the authoritative human layer.

- **Matched-draft is append-only during a session** — the auto-matcher writes
  only new entries, never updates or removes existing ones. To force a re-match
  of a specific task, delete its entry from the draft manually.

- **The final bundle is always rebuilt from scratch** — the merge+validate step
  re-derives the full bundle from all inputs on every run, so the bundle is
  always a deterministic function of `(normalized tasks, normalized locations,
  matched-draft, annotations)`.

- **Partial bundles are valid app data** — a task with no resolved location and
  `locationless: false` is written to the bundle with an empty `locations: []`
  array. The app renders it in the task list and tracker but hides it from the
  map. This is not an error state; it is expected for newly discovered tasks.

- **Version field on the bundle** — each rebuilt bundle increments a
  `dataVersion` integer. The app detects a version bump on load and refreshes
  its cached data.

---

## Implementation Layers

---

### Layer 1 — Raw Scrapers

**Goal**: Fetch raw task and location data from the wiki and write it to disk
in a consistent JSON format.

**Builds on**: nothing (standalone Node scripts)

**Deliverables**:
- `scripts/scrape-tasks.ts` — scrapes one league's task table given a league
  slug arg; outputs `data/raw/{league-id}/raw-tasks.json`
- `scripts/scrape-locations.ts` — fetches map markers for all `ActivityType`
  categories; outputs `data/raw/{league-id}/raw-locations.json`
- `scripts/lib/wiki-client.ts` — rate-limited wiki API client (1 req/s,
  User-Agent header, local response cache in `data/raw/.cache/`)
- `data/raw/category-map.json` — maps wiki marker category strings to
  `ActivityType` enum values
- `npm run scrape -- --league trailblazer-reloaded` entry point

**Acceptance criteria**:
- Running the scrape command produces a non-empty `raw-tasks.json` with however
  many tasks are currently on the wiki — even if that is 10 or 50 (early season).
- Running the location scrape produces `raw-locations.json` with ≥ 1 entry per
  active region having a valid `tile.x`, `tile.y`, `tile.plane`.
- Re-running with a warm cache makes zero HTTP requests.
- Script exits non-zero and prints a clear error if the wiki returns a non-200.
- Running the scrape a second time after new tasks appear on the wiki adds the
  new tasks to `raw-tasks.json` without altering existing entries.

**Out of scope**: matching tasks to locations; generating stable IDs; any
validation beyond basic JSON structure.

---

### Layer 2 — ID Generation & Normalization

**Goal**: Assign stable IDs to tasks and locations, normalize region names, and
produce cleaned intermediate files ready for matching.

**Builds on**: Layer 1 outputs

**Deliverables**:
- `scripts/normalize.ts` — reads raw files, normalizes region strings (e.g.
  "Kourend & Kebos" → `"kourend"`), slugifies task names to IDs
  (`"{league-prefix}-{kebab-slug}"`), deduplicates locations by tile+name,
  assigns stable `loc-{kebab-slug}` IDs to locations derived from the location
  name only (not coordinates); note: slug is derived from the location name only
  (not coordinates), so IDs remain stable when tile coordinates are corrected in
  re-scrapes
- `data/raw/{league-id}/tasks-normalized.json` and
  `data/raw/{league-id}/locations-normalized.json`
- `scripts/lib/id.ts` — deterministic ID generation utilities
- `data/regions.json` — canonical region slug → display name mapping shared
  across leagues

**Acceptance criteria**:
- Running normalize twice on the same raw input produces identical output
  (deterministic IDs).
- No two tasks in the same league share an ID.
- No two locations share an ID.
- All region strings in normalized tasks match a key in `data/regions.json`.

**Out of scope**: task→location linking; validation against app schema; build
pipeline.

---

### Layer 3 — Auto-Matcher

**Goal**: Heuristically link tasks to locations using the four matching
strategies, producing a draft file with confidence scores.

**Builds on**: Layers 1 & 2 normalized outputs

**Deliverables**:
- `scripts/auto-match.ts` — runs all five strategies in priority order;
  outputs `data/raw/{league-id}/matched-draft.json`
- `scripts/lib/match-strategies/` directory:
  - `place-name.ts` — fuzzy place-name extraction from descriptions
  - `skill-region.ts` — skill keyword + region bounding-box intersection
  - `boss-npc.ts` — boss/NPC name lookup table
  - `quest-location.ts` — quest start/completion location table
  - `item-location.ts` — item name lookup against item creation/use locations
- `data/boss-locations.json` — hand-curated boss name → location name table
- `data/quest-locations.json` — quest name → location name table
- Stats report printed to stdout: total tasks, auto-confirmed count,
  needs-review count, no-match count

**Acceptance criteria**:
- ≥ 60% of tasks receive a confidence score ≥ 0.8 (auto-confirmed) without
  any manual annotation.
- Tasks containing exact location names in their descriptions achieve ≥ 95%
  match rate.
- `matched-draft.json` contains an entry for every task in
  `tasks-normalized.json`.
- Running auto-match on a set of 10 tasks produces valid output (partial
  datasets do not cause errors).
- Re-running auto-match after new tasks are added to `tasks-normalized.json`
  appends new entries to `matched-draft.json` without modifying existing entries.
- Tasks with no match receive `matchConfidence: 0` and `needsReview: true`
  rather than being omitted.

**Out of scope**: human review UI; annotation override logic; final validation.

---

### Layer 4 — Annotation Tool & Review UI

**Goal**: Provide a local browser UI for humans to resolve the tasks that
auto-matching couldn't handle confidently.

**Builds on**: Layer 3 draft output; Layer 1 location data

**Deliverables**:
- `scripts/review-server.ts` — Express server, port 3001
- `scripts/review-ui/` — minimal React frontend (React is required, not vanilla HTML/JS, so it can import `src/schemas/` directly without a separate bundling step):
  - Review queue list sorted by confidence ascending
  - Task card with description, auto-match result, confidence badge
  - Embedded Leaflet map preview showing candidate location(s)
  - Confirm / Edit / Add / No-location / Skip actions
  - Progress counter
- `scripts/lib/annotations.ts` — read/write `annotations.json` with file
  locking to prevent concurrent write corruption
- `npm run review -- --league trailblazer-reloaded` entry point

**Acceptance criteria**:
- `npm run review` starts the server and opens at `localhost:3001` without
  errors.
- Confirming a task writes the entry to `annotations.json` within 1 second
  and removes it from the review queue.
- Editing a task's location and saving reflects the new location in the
  queue immediately.
- Refreshing the page does not lose progress (state loaded from
  `annotations.json` on every page load).
- A task marked "No location" does not appear in the review queue again.

**Out of scope**: multi-user collaboration; cloud sync; production hosting of
the review tool.

---

### Layer 5 — Validate, Bundle & CI

**Goal**: Merge annotations with draft matches, validate the full schema, write
the final league bundle, and gate all of this behind a CI check.

**Builds on**: Layers 1–4; app data schema from `02-data-design.md`

**Deliverables**:
- `scripts/build-data.ts` — merge + validate + bundle; writes
  `data/leagues/{league-id}.json`
- `scripts/lib/validator.ts` — all validation checks (see Stage 6 above);
  returns a structured `ValidationResult[]` not thrown exceptions; also
  validates `data/teleports.json` against the `Teleport` schema from
  `src/schemas/teleport.ts` as part of `npm run validate-data`
- `npm run build-data -- --league trailblazer-reloaded` entry point
- `npm run validate-data` — validate existing bundles without rebuilding;
  includes validation of `data/teleports.json`
- `.github/workflows/validate-data.yml` — CI job that runs `validate-data` on
  every PR touching `data/`
- Human-readable validation report written to stdout: ✓/✗ per check, with
  offending task IDs listed for failures
- `data/leagues/index.json` — list of available league IDs and names for the
  app's league selector

**Acceptance criteria**:
- `npm run build-data` exits 0 and produces a valid `{league-id}.json` when
  all tasks have resolved locations.
- `npm run build-data` exits non-zero and lists all failing task IDs when any
  task lacks a resolved location and is not marked `locationless`.
- CI job fails on PRs that introduce invalid data and passes on valid data.
- The final bundle's task count matches the raw scraped task count (no silent
  drops).
- `data/leagues/index.json` includes the newly built league after a successful
  build.
