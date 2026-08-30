# Future Enhancements

Ideas not built yet. Remove or rewrite entries as they ship.

## Gen Unlock Progression
Completing the Pokédex for a generation (correctly naming every Pokémon in that gen) unlocks the next generation as a playable pool. Gen unlock requires only base-form completion — no shiny completion needed.

- Store unlocked gens in `localStorage` (no backend needed)
- Completion can read the existing `wtp_caught_dex` set — already tracked per Pokémon ID
- Settings screen gets a gen selector showing only unlocked gens
- Each gen needs its own POKEMON list and TYPES array in `data.js`
- ID ranges: Gen1 1–151, Gen2 152–251, Gen3 252–386, Gen4 387–493, Gen5 494–649, Gen6 650–721, Gen7 722–809, Gen8 810–905, Gen9 906–1025
- PokeAPI confirmed: pixel, official artwork, and Showdown GIFs all available for all gens 1–9

## Cross-device Sync (Pokédex tracking is done locally)
Local tracking is implemented — seen, correctly-named, and shiny-registered Pokémon persist in `localStorage` (`wtp_seen_dex`, `wtp_caught_dex`, `wtp_shiny_dex`) and drive the Pokédex card marks and Discovery Mode silhouettes.

Still open: syncing that progress across devices. Would need a backend (Supabase/Firebase) plus a lightweight sign-in, and a merge strategy for the three ID sets. Optional — the local version is fully functional without it.

## Challenge Modes
- **Daily challenge** — fixed daily seed so everyone plays the same Pokémon that day; shareable result card.
- **Friend challenge** — share a seed/link so friends play the same shuffle and compare scores.

## Tasks / Achievements

A milestone system giving players a sense of progression. 18 one-time achievements across 6 categories, checked reactively (not polled).

### Storage

New localStorage key `wtp_tasks` — object mapping task ID to completion timestamp:
```json
{ "seen_10": 1693420800000, "shiny_1": 1693507200000 }
```

### Task List (18 tasks)

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
| `score_100` | Getting Started | All-time best score >= 100 |
| `score_500` | Sharpshooter | All-time best score >= 500 |
| `score_1000` | Grand Champion | All-time best score >= 1000 |

**Streak (2)**
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

- **Hub**: 5th card (trophy icon) linking to a new Tasks screen. Existing CSS auto-centers the odd last child.
- **Tasks screen**: Header with back button, "X / 18 completed" summary, scrollable list grouped by category. Each row shows icon, title, description, progress bar (for countable tasks), and lock/check status. Completed tasks get the gold accent border (`#f5c842`).
- **Toast notification**: Fixed bottom-center toast slides in when a task unlocks mid-game, auto-dismisses after 3 seconds. `pointer-events: none` so it never blocks gameplay input. No toasts on first load — retroactive unlocks are silent; user discovers them on the Tasks screen.

### Check Logic

Reactive — call `checkTasks(context)` at these hook points in `game.js`:
- `endGame()` — pass `{ bestStreakNow, roundCount }`
- `endTypeQuiz()` — pass `{ tqAccuracy, tqCorrect, tqTotal }`
- `revealAnswer()` (correct answer block) — pass `{ bestStreakNow }` for mid-game collection/streak unlocks
- Once at init — retroactive unlock from existing localStorage data

### Implementation files

- `index.html` — hub card, tasks screen markup, toast element, CSS
- `js/game.js` — `TASK_DEFS` array, `checkTasks()`, `showTaskNotification()`, `renderTasksScreen()`, hook calls
- `tests/helpers.js` — add `wtp_tasks` to `LS_KEYS`
- `tests/hub.spec.js` — update hub card count from 4 to 5
- New `tests/tasks.spec.js` — retroactive unlock, mid-game unlock, toast, persistence across reload
- `CLAUDE.md` — add `wtp_tasks` to localStorage keys list
