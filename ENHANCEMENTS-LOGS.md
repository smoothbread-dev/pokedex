# Enhancements Log

Shipped enhancements removed from `FUTURE-ENHANCEMENTS.md`. Kept here for reference.

---

## Bug Fixes A–D (shipped)

### Bug Fix A — Pokédex Modal Background Scroll Lock

The Pokédex detail modal now locks background scroll (`document.body.style.overflow = 'hidden'`) while open and restores it on close.

### Bug Fix B — Pokédex Modal Shows Wrong Type for Gen 2

`openDexModal()` and `renderMissedGrid()` used `TYPES[id - 1]` which only covers Gen 1. Gen 2 Pokémon fell through to the `|| 'Normal'` fallback. Fixed to use `genTypes()[id - 1 - genOffset()]`.

### Bug Fix C — Gen 2 Badge Not Visible Until Refresh

After earning the Gen 2 completion badge, the items screen badge section didn't update until a page refresh. Fixed by calling `renderItemsScreen()` inside `showScreen()` when the target is `items-screen`, guaranteeing fresh rendering on every visit.

### Bug Fix D — Item Bag Back Button Routes to Hub Instead of WTP Settings

The items screen back button always returned to the hub, even when the user navigated from WTP settings. Added `itemsScreenOrigin` tracking so the back button returns to whichever screen the user came from.

---

## Chunk 9 — Bag Size Scaling (shipped)

**Depended on: Chunk 8 (Gen 2 Unlock — shipped).**

Item bag capacity increases as the player earns gen completion badges. Each badge adds +1 to the per-item cap, rewarding long-term progression.

| Badges earned | Cap per item |
|---|---|
| 0 | 3 (base) |
| 1 (Gen 1 complete) | 4 |
| 2 (Gen 2 complete) | 5 |
| N | 3 + N |

### Implementation

- Replaced `const ITEM_CAP = 3` with `function getItemCap() { return 3 + Object.keys(completionBadges).filter(k => completionBadges[k]).length; }`
- Updated all references from `ITEM_CAP` to `getItemCap()` (in `dropItems()`, `updateStreak()`, item bag rendering)
- Item Bag screen shows current cap per item (e.g. "2 / 4")
- No new localStorage keys — reads existing `wtp_completion_badges`

**Files changed:** `js/game.js`, `tests/items.spec.js`, `README.md`.

---

## Chunk 10 — Shiny Bonus Points (shipped)

**Depends on: nothing (current codebase).**

Correctly naming a shiny Pokémon now awards bonus points: +50 for a new shiny registration, +25 for a repeat shiny. Wrong answers still award +0 and don't register the shiny.

### Implementation

- Replaced inline `registerShiny` ternary in `revealAnswer()` with a block that adds `shinyPts` to `score` and appends the bonus to the feedback message
- Updated Pokédex help modal to mention +50/+25 bonus
- Added shiny bonus note to difficulty help modal
- Added scoring rows to README.md

**Files changed:** `js/game.js`, `index.html`, `tests/shiny-bonus.spec.js`, `README.md`.

---

## Chunk 11 — Beginner Mode (shipped)

**Depends on: nothing (current codebase).**

A 4th difficulty tier below Easy for players with zero Pokémon knowledge. Removes barriers so new players can learn names while playing.

### Features

- **2-choice buttons** instead of 4, reducing guesswork
- **No timer** — unlimited time to answer
- **Auto-hint** — type + first letter shown at round start
- **Manual hint** — free, shows the Pokémon's category (e.g. "Starter Pokémon", "Legendary", "Kanto Pokémon")
- **Progressive silhouette reveal** — brightens from `brightness(0)` → `0.15` at 4s → `0.3` at 7s
- **0.5× scoring** — halved points to reflect reduced difficulty
- **No item drops** — lures and charms are not awarded in Beginner games

### Implementation

- `js/data.js`: added `DIFF.beginner = { timer: 0, hintCost: 0, choices: 2 }`, `CATEGORIES` map for ~40 notable Pokémon, `getCategory(id)` helper
- `js/game.js`: dynamic choice count in `buildChoices()` using `genPool()`, beginner branches in `nextRound()` (auto-hint, progressive reveal via two `setTimeout`s), `revealAnswer()` (0.5× scoring with `Math.floor`), `dropItems()` (early return), `useHint()` (category hint). Also fixed pre-existing Gen 2 type bug in `useHint()` (same pattern as Bug Fix B)
- `index.html`: Beginner button in `.diff-btn` row, expanded difficulty help modal table with Beginner column + Scoring/Silhouette rows, CSS `filter 1s ease` transition on `#pokemon-sil`

**Files changed:** `js/data.js`, `js/game.js`, `index.html`, `tests/beginner.spec.js`, `README.md`.

---

## Chunk 14 — Pokédex Shiny Filter (shipped)

**Depends on: nothing (current codebase).**

A shiny filter toggle ("✨ Shiny") next to the Pokédex search bar lets players view only Pokémon whose shiny form they've caught for the active generation.

### Features

- Toggle button with gold highlight when active
- Only shiny-caught Pokémon shown, with shiny artwork on cards
- Progress text updates to "✨ Shinies: X / N"
- Combines with type filter and search
- Resets when switching gens

### Implementation

- Added `dexShinyFilter` state variable and `toggleShinyFilter()` function
- Updated `applyDexSearch()` to filter by `shinyDex` membership when active
- Updated `buildPokedex()` to use `SPRITE_OFFICIAL_SHINY(id)` when shiny filter is on
- Updated `refreshDexMarks()` to show shiny progress text when filter is active
- Reset filter on gen switch and when opening Pokédex

**Files changed:** `js/game.js`, `index.html`, `tests/pokedex.spec.js`, `README.md`.

---

## Chunk 15 — Pokédex Type Filter Redesign (shipped)

**Depends on: nothing (current codebase).**

Replaced the 16–18 individual type filter buttons with a compact custom dropdown that works well on all screen sizes.

### Features

- Dropdown trigger button shows currently selected type badge (or "All Types")
- Panel opens with a grid of type badges; selecting one filters the grid and closes the panel
- "All Types" option restores the full grid
- Click outside closes the panel
- Dropdown rebuilds with correct types when switching gens

### Implementation

- Replaced filter button creation loop in `buildPokedex()` with `renderTypeDropdown()`
- Added `closeTypeDropdown()` and `selectTypeOption()` helpers
- Simplified `applyDexFilter()` since the dropdown manages its own UI state
- Added CSS for `.type-dropdown`, `.type-dropdown-trigger`, `.type-dropdown-panel`

**Files changed:** `js/game.js`, `index.html`, `tests/pokedex.spec.js`, `README.md`.

---

## Chunk 17 — Gen Badge Effect Display in WTP (shipped)

**Depends on: nothing (current codebase).**

When the player has earned the gen completion badge for the current generation, a visual indicator in the WTP game header shows the boosted shiny rate is active.

### Features

- Badge indicator appears in game header when `completionBadges[currentGen]` is truthy
- Shows current shiny rate (e.g. "🏆 Gen 1 Badge — Shiny rate 1/64")
- When combined with Shiny Charm, shows combined rate (e.g. "✨ Shiny Charm + 🏆 Badge → 1/16")
- Hidden when no badge for the current gen

### Implementation

- Added `#game-badge-indicator` div in game screen header
- In `startGame()`, after item pill setup, check for badge and compute display text using `getShinyRate()`
- CSS for `.game-badge-indicator` (centered gold text)

**Files changed:** `js/game.js`, `index.html`, `tests/whos-that.spec.js`, `README.md`.

---

## Chunk 13 — Gen 3 Unlock (Hoenn) (shipped)

**Depended on: Chunk 8 (Gen 2 Unlock — shipped).**

Adds Gen 3 (Hoenn, 135 Pokémon, IDs 252–386). Earning the Gen 2 completion badge unlocks Gen 3, following the same cascade as Gen 1 → Gen 2.

### Architectural refactor: GEN_CONFIG lookup table

Replaced the hardcoded gen1/gen2 ternaries in `genPool()`, `genTypes()`, `genOffset()`, `genAliases()` with a `GEN_CONFIG` lookup table. Each gen is a single config entry — adding future gens only requires a new entry, data arrays, and markup.

```js
const GEN_CONFIG = {
  gen1: { pool, types, offset, aliases, filterTypes, count, region },
  gen2: { ... },
  gen3: { ... },
};
```

Genericized `renderGenSelectors()`, `setGen()`, and the stale-gen guard to work with any number of gens instead of hardcoding `gen2`.

### Features

- **Gen 3 data**: `POKEMON_GEN3` (135 names), `TYPES_GEN3` (135 type strings), `ALIASES_GEN3` (deoxys → deoxys-normal)
- **Gen 3 unlock cascade**: Gen 2 badge → Gen 3 unlocked, all 135 Gen 3 caught → Gen III badge
- **Shiny rate boost**: Gen III badge gives 1/64 shiny rate (1/16 with Shiny Charm) — already handled generically by `getShinyRate()` using `completionBadges[currentGen]`
- **Bag capacity**: Gen III badge adds +1 to per-item cap (formula: 3 + badge count)
- **Items screen badge**: hidden when locked, placeholder when unlocked, gold when earned
- **Hub description**: dynamically shows "Browse all 386" and "Gen I, II & III — Kanto, Johto & Hoenn Edition"
- **Type dropdown**: Gen 3 Pokédex uses `GEN3_TYPES` (same as `GEN2_TYPES` — Dark/Steel present, Fairy is Gen 6)
- **CATEGORIES**: Gen 3 starters (252–260), fossils (345–348), legendaries (377–384), mythicals (385–386)

### Implementation

- `GEN3_TYPES = GEN2_TYPES` (same type set)
- `renderTypeDropdown()` uses `GEN_CONFIG[currentGen].filterTypes` instead of hardcoded ternary
- `checkCompletionBadge()` extended with Gen 3 unlock + badge blocks
- `renderItemsScreen()` extended with Gen 3 badge display
- `updateDexHubDesc()` extended with Gen 3 count and region
- Service worker cache bumped to `pokedex-cache-v3`

**Files changed:** `js/data.js`, `js/game.js`, `index.html`, `tests/helpers.js`, `tests/gen3.spec.js` (new, ~22 tests), `sw.js`, `README.md`.
