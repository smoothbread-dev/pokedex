# Future Enhancements

Ideas not built yet. Remove or rewrite entries as they ship.

Features are ordered by dependency — each chunk can be built and tested independently before the next begins.

## Chunk 4 — Item Drops

**Depends on: Chunk 2 (item inventory). Chunk 3 not required.**

Lures drop from Who's That; Shiny Charms drop from Type Quiz. Drops are shown on the end screen.

### Who's That drops (lures only)
| Difficulty | Drop |
|---|---|
| Easy | 1 lure |
| Normal | 1 lure + 30% chance of a second |
| Hard | 2 lures guaranteed |

### Type Quiz drops (grade-gated)
| Grade | Reward |
|---|---|
| S | 1 Shiny Charm (if below cap) |
| A | 1 lure |
| B / C | Nothing |

### Pokémon of the Day double-drop
A date-seeded featured Pokémon is shown on the hub daily (same one for all players). Correctly naming it in Who's That doubles the lure drop for that game.
- `wtp_potd_claimed` — stores today's date string; prevents double-claiming
- `getPokemonOfTheDay()` — hashes `new Date().toDateString()` to a POKEMON index
- Hub shows the PotD silhouette with a label

**Files:** `js/game.js` (`dropItems(mode, grade)` called from `endGame()` / `endTypeQuiz()`; `getPokemonOfTheDay()`; hub render), `index.html` (PotD hub slot, `wtp_potd_claimed`), `tests/helpers.js` (add `wtp_potd_claimed`).

---

## Chunk 5 — Difficulty Help Button

**Depends on: Chunk 1 (hard mode buttons), Chunk 4 (drop values to show).**

Small `ℹ` icon button next to the "Difficulty" label on the game-settings screen. Opens a modal with two sections so players know exactly what each mode and difficulty gives them.

**Per-difficulty table:**

| | Easy | Normal | Hard |
|---|---|---|---|
| Answer method | Type name | Type name | 4-choice buttons |
| Timer | 15 s | 10 s | 6 s |
| Hint cost | Free | −5 pts | Eliminates 1 wrong (−10 pts) |
| Item drops | 1 lure | 1–2 lures | 2 lures guaranteed |

**Per game mode table:**

| Mode | Reward |
|---|---|
| Who's That — any game | Lures (1 / 1–2 / 2 by difficulty) |
| Type Quiz — Grade S | 1 Shiny Charm |
| Type Quiz — Grade A | 1 lure |
| Type Quiz — Grade B/C | Nothing |

Modal uses existing dark card styles. Closes on backdrop click or close button.

**Files:** `index.html` (ℹ button, modal markup + CSS), `js/game.js` (open/close listener).

---

## Chunk 6 — Daily Engagement

**Depends on: Chunk 4 (item drops, for streak milestone grants and PotD — PotD can ship with Chunk 4 itself; streak rewards need the drop pipeline).**

### Play Streak
`wtp_streak` — `{ count: 7, lastDate: "2026-08-31" }`. Displayed on hub as 🔥 N days.
- Increments when a game completes on a new calendar day
- Resets to 0 if a day is skipped
- One-time milestone rewards: 3 days → +1 lure each, 7 days → +1 Shiny Charm, 14 days → full top-up
- `updateStreak()` called at end of `endGame()` and `endTypeQuiz()`

### Familiarity Bonus
Naming an already-caught Pokémon correctly awards +5 pts, shown inline in round feedback (e.g. "+5 familiarity!"). No new storage — checks `caughtDex.has(current.id)` at answer time in `revealAnswer()`.

**Files:** `js/game.js`, `index.html` (hub streak badge), `tests/helpers.js` (add `wtp_streak`).

---

## Chunk 7 — Tasks / Achievements

**Depends on: Chunks 2–6 (hub card layout, streak, items all in place).**

17 one-time achievements across 6 categories, checked reactively (not polled).

### Storage
`wtp_tasks` — `{ "seen_10": 1693420800000, "shiny_1": 1693507200000 }` (task ID → completion timestamp)

### Task list

**Collection (5)**
| ID | Title | Condition |
|---|---|---|
| `seen_10` | Explorer | See 10 different Pokémon |
| `seen_50` | Field Researcher | See 50 different Pokémon |
| `caught_25` | Trainer | Correctly name 25 different Pokémon |
| `caught_75` | Ace Trainer | Correctly name 75 different Pokémon |
| `caught_151` | Pokémon Master | Correctly name all 151 Pokémon |

**Shiny (3)**
| ID | Title | Condition |
|---|---|---|
| `shiny_1` | Lucky Find | Register first shiny |
| `shiny_10` | Shiny Hunter | Register 10 shinies |
| `shiny_50` | Shiny Collector | Register 50 shinies |

**Scoring (3)**
| ID | Title | Condition |
|---|---|---|
| `score_100` | Getting Started | All-time best >= 100 |
| `score_500` | Sharpshooter | All-time best >= 500 |
| `score_1000` | Grand Champion | All-time best >= 1000 |

**In-game streak (2)**
| ID | Title | Condition |
|---|---|---|
| `streak_5` | On a Roll | 5-streak in a single game |
| `streak_10` | Unstoppable | 10-streak in a single game |

**Type Quiz (3)**
| ID | Title | Condition |
|---|---|---|
| `tq_grade_a` | Type Student | Grade A or better |
| `tq_grade_s` | Type Expert | Grade S |
| `tq_perfect` | Type Professor | 100% accuracy on 20+ rounds |

**Special (1)**
| ID | Title | Condition |
|---|---|---|
| `full_dex_seen` | Gotta See 'Em All | See every Pokémon at least once |

### UI
- 6th hub card: trophy icon → Tasks screen (Item Bag occupies the 5th)
- Tasks screen: "X / 17 completed" header, scrollable list grouped by category, gold border on completed rows
- Toast: slides in on unlock mid-game, auto-dismisses after 3 s, `pointer-events:none`; retroactive unlocks on first load are silent

### Check points in `game.js`
- `endGame()` — `{ bestStreakNow, roundCount }`
- `endTypeQuiz()` — `{ tqAccuracy, tqCorrect, tqTotal }`
- `revealAnswer()` correct block — `{ bestStreakNow }` for mid-game unlocks
- Once at init — retroactive award from existing localStorage data

**Files:** `index.html`, `js/game.js` (`TASK_DEFS`, `checkTasks()`, `showTaskNotification()`, `renderTasksScreen()`), `tests/helpers.js` (`wtp_tasks`), `tests/hub.spec.js` (card count), new `tests/tasks.spec.js`, `CLAUDE.md`.

---

## Chunk 8 — Gen 2 Unlock

**Depends on: Chunk 3 (Completion Badge — the Gen 1 badge award is the unlock trigger).**

Catching all 151 Gen 1 Pokémon unlocks Johto (Gen 2: IDs 152–251, 100 Pokémon) as a playable pool. A generation selector appears in both Who's That and Type Quiz settings. The Pokédex is gen-scoped — it shows whichever gen is currently selected. Gen 1 is always available; Gen 2 appears only after unlock.

### Why scoped rather than combined

Showing both gens at once in the Pokédex and game queue doubles the data surface without adding clarity. Players get a clean "start fresh with a new gen" moment, which is the intended progression feel.

### New Pokémon IDs

Gen 2 uses PokeAPI numeric IDs 152–251 (Chikorita → Celebi). Sprites, official artwork, Showdown GIFs, and cries are all available at the same CDN paths — just swap the ID. The existing `SPRITE_URL`, `SPRITE_OFFICIAL`, `CRY_LEGACY`, etc. functions already accept any numeric ID.

### Type chart change

Gen 2 introduces **Steel** and **Dark** types. The existing `TYPE_CHART` in `data.js` is Gen 1 only and does not include these. For Gen 2 Who's That this doesn't matter (no type-based mechanics). For Gen 2 Type Quiz, weakness computation must use a Gen 2-aware chart. Add `TYPE_CHART_GEN2` alongside the existing chart; `computeWeaknesses()` reads whichever chart matches the active gen.

### Storage

| Key | Shape | Purpose |
|---|---|---|
| `wtp_unlocked_gens` | `{ gen2: true }` | Which gens beyond Gen 1 are unlocked |
| `wtp_active_gen` | `"gen1"` or `"gen2"` | Persisted gen selection across sessions |

`wtp_seen_dex`, `wtp_caught_dex`, and `wtp_shiny_dex` already store raw PokeAPI IDs — Gen 2 IDs (152–251) accumulate into the same sets without any change to those keys.

### Unlock trigger

Inside `checkCompletionBadge()` (Chunk 3), after awarding the Gen 1 badge, also set `wtp_unlocked_gens.gen2 = true`. Show a toast: "🎉 Johto unlocked! Gen 2 is now available."

### Gen selector UI

A "Generation" row appears in both `game-settings-screen` and `tq-settings-screen`, below the existing Difficulty/Rounds rows. Same `.btn-row` button style:

```
[ Gen 1 ]  [ Gen 2 ★ ]   ← ★ only if unlocked; button disabled + dimmed otherwise
```

The selection is saved to `wtp_active_gen` on click and read at init. Setting the active gen updates a `currentGen` module-level variable (`'gen1'` or `'gen2'`).

### Data authoring (`js/data.js`)

Add alongside existing constants:

```js
const POKEMON_GEN2 = [/* 100 names, Chikorita … Celebi */];
const TYPES_GEN2   = [/* matching type strings, e.g. 'Grass', 'Fire/Flying' */];
const ALIASES_GEN2 = { /* alternate spellings */ };
const TYPE_CHART_GEN2 = { /* 17-type chart including Steel and Dark */ };
```

ID for entry at index `i` is `152 + i`. No other code needs changing to derive the sprite URL — `SPRITE_URL(152 + i)` works as-is.

Notable Gen 2 aliases: `Nidoran` is already in Gen 1 aliases. New ones: `Ho-Oh → HoOh`, `Porygon2 → Porygon 2`, `Umbreon / Espeon / etc.` (no special spelling). Confirm via playtest.

### `buildQueue()` changes

Currently: `const all = POKEMON.map((name, i) => ({ name, id: i + 1 }))`.

Change to:

```js
const pool   = currentGen === 'gen2' ? POKEMON_GEN2 : POKEMON;
const offset = currentGen === 'gen2' ? 151 : 0;
const all    = pool.map((name, i) => ({ name, id: offset + i + 1 }));
```

Lure logic (`seenDex`/`caughtDex` checks) already uses `.id` — no further change needed there.

### Pokédex screen changes

The dex grid currently iterates `POKEMON` (indices 0–150, IDs 1–151). Make it read from the active gen's array:

```js
const pool   = currentGen === 'gen2' ? POKEMON_GEN2 : POKEMON;
const offset = currentGen === 'gen2' ? 151 : 0;
// render pool.map((name, i) => ({ name, id: offset + i + 1 }))
```

Progress counter changes from `/ 151` to `/ ${pool.length}`. The gen selector on the dex screen updates `currentGen` and re-renders the grid — no separate dex-specific gen setting needed.

### `endGame()` / `goToMainMenu()`

After a game ends, `currentGen` stays as the player set it (don't reset). The player picks a gen in settings before each game, so there's no reason to clear it.

### Files

| File | Change |
|---|---|
| `js/data.js` | Add `POKEMON_GEN2`, `TYPES_GEN2`, `ALIASES_GEN2`, `TYPE_CHART_GEN2` |
| `js/game.js` | `currentGen` state + `wtp_active_gen` + `wtp_unlocked_gens`; update `buildQueue()`, Pokédex render, `checkCompletionBadge()` unlock; gen selector render fn; `computeWeaknesses()` chart switch |
| `index.html` | Gen selector rows in game-settings-screen and tq-settings-screen; Pokédex gen selector |
| `tests/helpers.js` | Add `wtp_unlocked_gens`, `wtp_active_gen` to `LS_KEYS` |
| `tests/gen2.spec.js` | New spec (see below) |
| `FUTURE-ENHANCEMENTS.md` | Remove this chunk when shipped |
| `README.md` | Add Gen 2 section |

### `tests/gen2.spec.js` coverage

- Gen 2 selector is hidden when `wtp_unlocked_gens` is empty
- Gen 2 selector is visible when `wtp_unlocked_gens = { gen2: true }`
- Selecting Gen 2 and starting a game produces Pokémon with IDs 152–251
- Selecting Gen 2 and starting Type Quiz produces Pokémon with IDs 152–251
- Pokédex shows 100 cards when Gen 2 is active
- Gen 2 catches accumulate into `wtp_caught_dex` with IDs 152–251
- Gen 1 play still works normally when Gen 1 is selected

### Verification

1. Fresh save (Gen 1 incomplete) — Gen 2 button absent from settings
2. Seed `wtp_caught_dex` with all 151 IDs, complete any Gen 1 game — toast fires, Gen 2 button appears
3. Select Gen 2, start Who's That — only Johto Pokémon appear
4. Select Gen 2, start Type Quiz — only Johto Pokémon, Steel/Dark weakness answers correct
5. Pokédex with Gen 2 active — 100 cards, IDs 152–251, progress counter says `/ 100`
6. `npm test` — all tests pass

---

## Long-term — Gen Unlock Progression

Chunk 8 implements Gen 2. Gen 3–9 follow the same pattern established there. Each additional gen requires its own data array in `data.js` and a corresponding TYPE_CHART variant if new types are introduced (Fairy added in Gen 6). No structural code changes beyond Chunk 8 — gen selector already reads from `wtp_unlocked_gens` generically.

- Unlocked gens stored in `localStorage`
- Settings screen gets a gen selector (unlocked gens only)
- Each gen needs its own POKEMON + TYPES array in `data.js`
- ID ranges: Gen1 1–151, Gen2 152–251, Gen3 252–386, Gen4 387–493, Gen5 494–649, Gen6 650–721, Gen7 722–809, Gen8 810–905, Gen9 906–1025
- PokeAPI: pixel art, official artwork, and Showdown GIFs confirmed available for all gens 1–9

---

## Long-term — Challenge Modes

- **Daily challenge** — fixed daily seed so all players play the same Pokémon; shareable result card
- **Friend challenge** — share a seed/link so friends play the same shuffle and compare scores

---

## Long-term — Cross-device Sync

Local tracking is fully functional (`wtp_seen_dex`, `wtp_caught_dex`, `wtp_shiny_dex`). Syncing across devices would require a backend (Supabase / Firebase), lightweight sign-in, and a merge strategy for the three ID sets. Optional enhancement — not blocking anything.
