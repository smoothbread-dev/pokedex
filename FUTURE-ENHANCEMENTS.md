# Future Enhancements

Ideas not built yet. Remove or rewrite entries as they ship.

Features are ordered by dependency — each chunk can be built and tested independently before the next begins.

## TODO: Edit here to add a chunk, basically I want to remove the "All" option from the game, it should only be 10, 25, 50

## Chunk 3 — Completion Badge

**Depends on: Chunk 2 (items infrastructure, `getShinyRate`).**

Awarded when all 151 Pokémon IDs for the active gen are present in `wtp_caught_dex`. Permanently sets shiny rate to 1/64 for that gen (between base 1/128 and Shiny Charm 1/32).

### Storage
- `wtp_completion_badges` — `{ gen1: true }` (keyed per gen for Gen 2/3 readiness)

### Shiny rate hierarchy (full picture)
- Base: 1/128
- Gen badge (permanent): 1/64
- Shiny Charm active (one game): 1/32 — overrides badge, does not stack

### Logic
- `checkCompletionBadge()` — called in `endGame()` after `registerCaught`, and once at init for retroactive award
- Badge displayed in the items screen (gold border, glow)

**Files:** `js/game.js`, `index.html` (badge row in items screen), `tests/items.spec.js` (seed all 151 IDs, verify badge awarded and rate changes).

---

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

18 one-time achievements across 6 categories, checked reactively (not polled).

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

**Special (2)**
| ID | Title | Condition |
|---|---|---|
| `play_marathon` | Marathon Runner | Complete a 151-round game |
| `full_dex_seen` | Gotta See 'Em All | See every Pokémon at least once |

### UI
- 6th hub card: trophy icon → Tasks screen (Item Bag occupies the 5th)
- Tasks screen: "X / 18 completed" header, scrollable list grouped by category, gold border on completed rows
- Toast: slides in on unlock mid-game, auto-dismisses after 3 s, `pointer-events:none`; retroactive unlocks on first load are silent

### Check points in `game.js`
- `endGame()` — `{ bestStreakNow, roundCount }`
- `endTypeQuiz()` — `{ tqAccuracy, tqCorrect, tqTotal }`
- `revealAnswer()` correct block — `{ bestStreakNow }` for mid-game unlocks
- Once at init — retroactive award from existing localStorage data

**Files:** `index.html`, `js/game.js` (`TASK_DEFS`, `checkTasks()`, `showTaskNotification()`, `renderTasksScreen()`), `tests/helpers.js` (`wtp_tasks`), `tests/hub.spec.js` (card count), new `tests/tasks.spec.js`, `CLAUDE.md`.

---

## Long-term — Gen Unlock Progression

Completing the Pokédex for a generation (all IDs in `wtp_caught_dex`) unlocks the next gen as a playable pool. Reuses the Completion Badge check from Chunk 3.

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
