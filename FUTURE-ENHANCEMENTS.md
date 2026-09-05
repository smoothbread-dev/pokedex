# Future Enhancements

Ideas not built yet. Remove or rewrite entries as they ship.

Features are ordered by dependency — each chunk can be built and tested independently before the next begins.

## Chunk 12 — Points Shop

**Depends on: Chunk 7 (Tasks/Achievements — hub card layout with 6 cards established).**

A shop screen where players spend lifetime accumulated points on items, giving the scoring system a long-term purpose. Prices are deliberately high so drops and streaks remain the primary item acquisition path — the shop is a grind-reward fallback.

### Storage

| Key | Shape | Purpose |
|---|---|---|
| `wtp_total_points` | `number` | Lifetime cumulative points earned (never decreases) |
| `wtp_spent_points` | `number` | Total points spent in shop |

Balance = `wtp_total_points - wtp_spent_points`. Displayed as "🪙 X pts" on the shop screen.

Points accumulate from all sources: Who's That Pokémon score (including shiny bonuses from Chunk 10), Type Quiz does not award points (it awards items directly).

### Shop inventory and pricing

Prices are high — a perfect 25-round Easy game with full streaks yields ~1000 pts. The shop requires sustained grinding.

| Item | Price | Cap | Source note |
|---|---|---|---|
| Unseen Lure | 3,000 | `ITEM_CAP` | Also dropped from WTP |
| Uncaught Lure | 3,000 | `ITEM_CAP` | Also dropped from WTP |
| Shiny Charm | 7,500 | `ITEM_CAP` | Also dropped from Type Quiz Grade S |
| Reveal Lens *(new)* | 5,000 | `ITEM_CAP` | Shop exclusive |
| Second Chance *(new)* | 10,000 | `ITEM_CAP` | Shop exclusive |

### New items

**Reveal Lens** — when equipped and consumed at game start, the Pokémon's type is displayed in the game header for every round (e.g. "Fire / Flying"). Helps with elimination even if you don't know the specific Pokémon.

**Second Chance** — when equipped and consumed at game start, the first wrong answer per game does not end the round. Instead, the incorrect choice is greyed out and the player can pick again. Only triggers once per game (not per round).

### UI

- **7th hub card**: shop/coin icon → Shop screen
- **Shop screen layout**: "🪙 X pts" balance header; scrollable list of items with icon, name, description, price, and Buy button; Buy button disabled when balance < price or item at cap; shows current count / cap per item
- **Toast**: "Purchased [item name]!" slides in for 2 s on successful buy

### Point accumulation

In `endGame()`, after computing `score`, add to lifetime total:
```js
let totalPts = parseInt(localStorage.getItem('wtp_total_points') || '0', 10);
totalPts += score;
localStorage.setItem('wtp_total_points', String(totalPts));
```

### Implementation

**`js/game.js`**:
- Add `SHOP_PRICES` constant with per-item prices
- Add Reveal Lens and Second Chance to `ITEM_META`
- `renderShopScreen()`: builds item cards with buy buttons, reads balance
- `buyItem(id)`: validates balance and cap, deducts from spent, increments item count, saves, re-renders
- `endGame()`: accumulate `score` into `wtp_total_points`
- `startGame()`: handle Reveal Lens effect (show type in `#game-active-item`), handle Second Chance effect (set `secondChanceAvailable = true`)
- `revealAnswer()`: if wrong and `secondChanceAvailable`, grey out the wrong choice, reset `roundActive = true`, set `secondChanceAvailable = false` instead of ending the round

**`index.html`**:
- Shop screen markup (`#shop-screen`) with balance header, items list, back button
- Hub card for shop (`#hub-shop-btn`)
- CSS for shop layout (reuse `.item-row` pattern from items screen)

### Files

| File | Change |
|---|---|
| `js/game.js` | `SHOP_PRICES`, new items in `ITEM_META`, `renderShopScreen()`, `buyItem()`, point accumulation in `endGame()`, Reveal Lens and Second Chance effects in `startGame()` / `revealAnswer()` |
| `index.html` | Shop screen markup, hub card, CSS |
| `tests/helpers.js` | Add `wtp_total_points`, `wtp_spent_points` to `LS_KEYS` |
| `tests/shop.spec.js` | New spec |
| `tests/hub.spec.js` | Update hub card count |
| `README.md` | Document shop, new items, point system |
| `FUTURE-ENHANCEMENTS.md` | Remove this chunk when shipped |

### `tests/shop.spec.js` coverage

- Shop screen opens from hub card and returns
- Balance shows 0 when no points earned
- Buy button disabled when balance insufficient
- Buy button disabled when item at cap
- Successful purchase decrements balance and increments item count
- Points accumulate into `wtp_total_points` after a WTP game
- Reveal Lens effect: type is shown during gameplay when equipped
- Second Chance effect: first wrong answer allows retry, second wrong answer ends the round
- Second Chance only triggers once per game
- Purchase toast appears on successful buy

### Verification

1. Play several games — `wtp_total_points` accumulates in localStorage
2. Open shop — balance shows correctly
3. Buy an Unseen Lure (need 3,000+ pts) — balance decreases, item count increases
4. Buy button disabled when at cap or insufficient balance
5. Equip Reveal Lens, start game — type shown in header
6. Equip Second Chance, answer wrong — choice greyed out, can pick again; second wrong ends round normally
7. `npm test` — all tests pass

---

## Chunk 16 — Lure Drop Rate Rework

**Depends on: nothing (current codebase).**

Currently, lures are guaranteed after every WTP game — the item bag fills up quickly and lures feel like a freebie rather than a reward. Change to a probability-based system where higher difficulty means higher drop chance, making lure drops feel more meaningful.

### Current behavior

In `dropItems()` (`js/game.js`):
- Easy: always 1 lure
- Normal: always 1 lure (30% chance of 2)
- Hard: always 2 lures
- Lures are split evenly between Unseen Lure and Uncaught Lure

### New behavior

| Difficulty | Drop chance | Quantity (if triggered) |
|---|---|---|
| Easy | 50% | 1 lure |
| Normal | 75% | 1 lure (30% chance of 2) |
| Hard | 100% | 2 lures |

When the drop does not trigger, no lures are awarded. The PotD doubling bonus still applies when drops trigger. Distribution between Unseen/Uncaught Lure stays the same.

### Implementation

In `dropItems()` (`js/game.js`), wrap the lure assignment in a probability check:

```js
let lures = 0;
const dropChance = difficulty === 'easy' ? 0.5 : difficulty === 'normal' ? 0.75 : 1;
if (Math.random() < dropChance) {
  if (difficulty === 'easy') lures = 1;
  else if (difficulty === 'normal') lures = Math.random() < 0.3 ? 2 : 1;
  else if (difficulty === 'hard') lures = 2;
}
```

### End-of-game feedback

Update the drops display to show "No items dropped" when `lures === 0`, so the player understands they didn't earn drops this round.

### Files

| File | Change |
|---|---|
| `js/game.js` | `dropItems()` — add probability gate before lure assignment |
| `index.html` | "No items dropped" message styling (if needed) |
| `tests/items.spec.js` | Test: Easy drops lures ~50% of the time; Normal ~75%; Hard always; no-drop case shows no items |
| `README.md` | Update item drop documentation |
| `FUTURE-ENHANCEMENTS.md` | Remove this chunk when shipped |

### Verification

1. Play 10+ Easy games — lures drop roughly half the time
2. Play 10+ Normal games — lures drop roughly 3/4 of the time
3. Play Hard — lures always drop
4. When no lures drop, end screen shows "No items dropped" (or similar)
5. PotD bonus still doubles lures when drops trigger
6. `npm test` — all tests pass

---

## Chunk 18 — Gen 4 Unlock (Sinnoh)

**Depends on: Chunk 13 (Gen 3 Unlock — shipped).**

Adds Gen 4 (Sinnoh, 107 Pokémon, IDs 387–493). Earning the Gen 3 completion badge unlocks Gen 4, following the `GEN_CONFIG` pattern established by Chunk 13. No structural refactoring needed — just data, a config entry, and markup.

### Gen 4 data arrays — `js/data.js`

- **`POKEMON_GEN4`** — 107 lowercase hyphenated names: turtwig through arceus (IDs 387–493)
- **`TYPES_GEN4`** — 107 parallel type strings with modern typing (no Fairy — Gen 6 introduced it)
- **`ALIASES_GEN4`** — alternate spellings (e.g. `"wormadam": ["wormadam-plant"]`, `"giratina": ["giratina-altered"]`, `"shaymin": ["shaymin-land"]`, `"deoxys-speed"` etc.)
- Update `CATEGORIES` with Gen 4 starters (387–395), fossils (408–411), legendaries (480–484, 485–488), mythicals (489–493)
- Update `getCategory()` for IDs 387–493 → "Sinnoh Pokémon"

### `js/game.js`

- **`GEN4_TYPES`** — same as `GEN3_TYPES` (Dark, Steel present; Fairy is Gen 6)
- **`GEN_CONFIG`** — add `gen4` entry: `{ pool: POKEMON_GEN4, types: TYPES_GEN4, offset: 386, aliases: ALIASES_GEN4, filterTypes: GEN4_TYPES, count: 107, region: 'Sinnoh' }`
- **`checkCompletionBadge()`** — add Gen 4 unlock (when gen3 badge earned) and Gen 4 badge check (when all 107 caught)
- **`renderItemsScreen()`** — add Gen 4 badge block after Gen 3 (same pattern)
- **`updateDexHubDesc()`** — add `if (unlockedGens.gen4) total += 107;` and `gens.push('IV'); regions.push('Sinnoh');`

### `index.html`

- Gen 4 button in all 3 gen selector sections: `<button class="gen-btn" data-gen="gen4" disabled>Gen 4 🔒</button>`
- `<div id="badge-gen4" style="display:none"></div>` after `#badge-gen3`

### `tests/helpers.js`

- Update `answerTypeQuiz` to handle IDs > 386 for `TYPES_GEN4`

### Files

| File | Change |
|---|---|
| `js/data.js` | `POKEMON_GEN4`, `TYPES_GEN4`, `ALIASES_GEN4` arrays (107 entries each), CATEGORIES + getCategory Gen 4 entries |
| `js/game.js` | `GEN4_TYPES`, `GEN_CONFIG` gen4 entry, Gen 4 blocks in `checkCompletionBadge()`, `renderItemsScreen()`, `updateDexHubDesc()` |
| `index.html` | Gen 4 buttons in 3 gen-section divs, `#badge-gen4` div |
| `tests/helpers.js` | `answerTypeQuiz` Gen 4 ID handling |
| `tests/gen4.spec.js` | New spec mirroring gen3.spec.js structure |
| `sw.js` | Bump `CACHE_NAME` |
| `README.md` | Update to "Gen I, II, III & IV Edition", document Gen 4 unlock |
| `FUTURE-ENHANCEMENTS.md` | Remove this chunk when shipped |

### `tests/gen4.spec.js` coverage

- Gen selector: gen4 button enabled when unlocked, disabled when locked
- Unlock trigger: catching all 135 gen3 Pokémon unlocks gen4
- WTP with gen4: uses IDs 387–493, correct answer adds to caught dex
- Type quiz with gen4: uses IDs 387–493, correct answers accepted
- Pokedex with gen4: 107 cards, /107 denominator, Dark/Steel filter buttons
- Gen1 unaffected: still 151 cards when switching back
- Items screen gen4 badge: hidden/placeholder/earned states
- Hub card description: "Browse all 493" when gen4 unlocked

### Verification

1. Fresh save — no gen selectors, hub card says "Browse all 151"
2. Seed all 386 caught → gen3 badge + gen4 unlock, hub card says "Browse all 493"
3. Select Gen 4 in WTP — only Sinnoh Pokémon (IDs 387–493)
4. Pokedex with Gen 4 — 107 cards, Dark/Steel filter
5. Items screen — Gen 4 badge states correct
6. `npm test` — all existing + new tests pass

---

## Long-term — Gen 5–9 Unlock Progression

Chunks 8, 13, and 18 establish the gen unlock pattern. Gen 5–9 follow the same structure — each requires its own data arrays in `data.js`, a `GEN_CONFIG` entry, and markup for the gen button and badge. No structural code changes beyond what Chunk 13 introduces with `GEN_CONFIG`.

- ID ranges: Gen5 494–649, Gen6 650–721, Gen7 722–809, Gen8 810–905, Gen9 906–1025
- Fairy type introduced in Gen 6 — `filterTypes` for Gen 6+ needs to include Fairy
- PokeAPI: pixel art, official artwork, and Showdown GIFs confirmed available for all gens 1–9

---

## Long-term — Challenge Modes

- **Daily challenge** — fixed daily seed so all players play the same Pokémon; shareable result card
- **Friend challenge** — share a seed/link so friends play the same shuffle and compare scores

---

## Long-term — Cross-device Sync

Local tracking is fully functional (`wtp_seen_dex`, `wtp_caught_dex`, `wtp_shiny_dex`). Syncing across devices would require a backend (Supabase / Firebase), lightweight sign-in, and a merge strategy for the three ID sets. Optional enhancement — not blocking anything.
