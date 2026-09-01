# Future Enhancements

Ideas not built yet. Remove or rewrite entries as they ship.

Features are ordered by dependency — each chunk can be built and tested independently before the next begins.

## Chunk 9 — Bag Size Scaling

**Depends on: Chunk 8 (Gen 2 Unlock — shipped).**

Item bag capacity increases as the player earns gen completion badges. Each badge adds +1 to the per-item cap, rewarding long-term progression.

| Badges earned | Cap per item |
|---|---|
| 0 | 3 (base) |
| 1 (Gen 1 complete) | 4 |
| 2 (Gen 2 complete) | 5 |
| N | 3 + N |

### Implementation

- Replace `const ITEM_CAP = 3` with a function: `function getItemCap() { return 3 + Object.keys(completionBadges).length; }`
- Update all references from `ITEM_CAP` to `getItemCap()` (in `dropItems()`, item bag rendering, equip logic)
- Item Bag screen shows current cap per item (e.g. "2 / 4")
- No new localStorage keys — reads existing `wtp_completion_badges`

**Files:** `js/game.js` (`getItemCap()`, update all `ITEM_CAP` refs), `index.html` (cap display in item bag), `README.md` (document scaling), `FUTURE-ENHANCEMENTS.md` (remove when shipped).

---

## Chunk 10 — Shiny Bonus Points

**Depends on: nothing (current codebase).**

Correctly naming a shiny Pokémon awards bonus points. First-time shiny registrations are worth more than repeats.

### Scoring

| Scenario | Bonus |
|---|---|
| Correct answer on a **new** shiny (not yet in `shinyDex`) | +50 |
| Correct answer on a **repeat** shiny (already in `shinyDex`) | +25 |
| Wrong answer on a shiny | +0 (shiny is not registered either) |

### Implementation

In `revealAnswer()` correct block (`js/game.js`), after the existing shiny registration logic:

```js
if (capturedShiny) {
  const isNew = registerShiny(capturedId);
  const shinyPts = isNew ? 50 : 25;
  score += shinyPts;
  msg += isNew
    ? ' ✨ Shiny registered! +' + shinyPts
    : ' ✨ Shiny! +' + shinyPts;
}
```

This replaces the current inline `registerShiny(capturedId) ? ' ✨ Shiny registered!' : ' ✨ Shiny (already caught)'` that awards no points.

### Help modal updates

**Difficulty help modal** (`index.html`, `#diff-help-modal`): add a note below the table:
> ✨ Shiny encounters: +50 pts (new shiny) or +25 pts (repeat shiny) on correct answers.

**Pokédex help modal** (`index.html`, `#help-modal`): update the Shiny description to mention the point bonus:
> You met its shiny form (a 1 in 128 chance each round) and named it correctly — earning +50 bonus points (or +25 if you've caught that shiny before).

### Files

| File | Change |
|---|---|
| `js/game.js` | `revealAnswer()` — add shiny bonus points logic |
| `index.html` | Update difficulty help modal and Pokédex help modal text |
| `tests/items.spec.js` or new `tests/shiny-bonus.spec.js` | Test +50 new shiny, +25 repeat shiny, +0 wrong answer |
| `README.md` | Document shiny bonus scoring |
| `FUTURE-ENHANCEMENTS.md` | Remove this chunk when shipped |

### `tests/shiny-bonus.spec.js` coverage

- Correct answer on new shiny awards +50 bonus points
- Correct answer on repeat shiny (already in `shinyDex`) awards +25 bonus points
- Wrong answer on shiny awards no bonus and does not register shiny
- Feedback message includes point amount for new shiny
- Feedback message includes point amount for repeat shiny
- Help modals mention shiny bonus

### Verification

1. Start a game, force a shiny round, answer correctly — score includes +50 and feedback says "✨ Shiny registered! +50"
2. Same shiny appears again, answer correctly — score includes +25 and feedback says "✨ Shiny! +25"
3. Shiny round, answer wrong — no bonus, shiny not registered
4. Difficulty help modal mentions shiny bonus
5. Pokédex help modal mentions shiny bonus
6. `npm test` — all tests pass

---

## Chunk 11 — Beginner Mode

**Depends on: nothing (current codebase).**

A 4th difficulty tier below Easy, designed for players with zero Pokémon knowledge. Removes barriers so new players can learn Pokémon names while playing.

### Difficulty settings

| Setting | Beginner | Easy (current) |
|---|---|---|
| Choices | 2 | 4 |
| Timer | None | 15 s |
| Auto-hint | Type + first letter | First letter |
| Manual hint | Shows Pokémon's generation/category | Type + first letter (free) |
| Scoring | 0.5× multiplier on all points | Normal |
| Item drops | None | 1 lure |
| Silhouette | Progressive reveal (unblurs in 3 stages) | Static |

### Progressive silhouette reveal

The silhouette starts fully blacked out (`brightness(0)`) and progressively unblurs in 3 stages over ~10 seconds:
- 0 s: full silhouette (brightness 0)
- 4 s: dark shadow with faint color (brightness 0.15)
- 7 s: dim but recognizable (brightness 0.3)

Since there is no timer, the stages are driven by `setInterval`. The reveal is purely visual — no additional information is surfaced beyond the image itself.

### Storage

No new localStorage keys. Difficulty is already ephemeral (`difficulty` variable, not persisted).

### Implementation

**`js/data.js`**: add `DIFF.beginner`:
```js
beginner: { time: 0, hint: 0, choices: 2 }
```

**`js/game.js`**:
- `buildChoices()`: when `DIFF[difficulty].choices === 2`, generate only 1 correct + 1 random distractor
- `nextRound()`: skip timer setup when `timerSecs === 0`; show type hint automatically; start progressive reveal interval
- `revealAnswer()`: apply `Math.floor(pts * 0.5)` when `difficulty === 'beginner'`
- `dropItems()`: return empty drops when `difficulty === 'beginner'`
- `useHint()`: show generation/category hint (e.g. "Starter Pokémon", "Legendary") — needs a small category map in `data.js`
- Progressive reveal: `setInterval` updates `#pokemon-sil` brightness at 4 s and 7 s; cleared in `revealAnswer()` and `clearPending()`

**`index.html`**:
- Add Beginner button to `.diff-btn` row in `game-settings-screen`
- Difficulty help modal: add Beginner column to the table
- CSS: transition for `#pokemon-sil` filter changes (`transition: filter 1s ease`)

### Files

| File | Change |
|---|---|
| `js/data.js` | Add `DIFF.beginner` entry |
| `js/game.js` | 2-choice building, no-timer logic, progressive reveal, 0.5× scoring, no drops, beginner hint |
| `index.html` | Beginner button in settings, help modal column, CSS transition |
| `tests/whos-that.spec.js` or new `tests/beginner.spec.js` | New spec |
| `README.md` | Document Beginner mode |
| `FUTURE-ENHANCEMENTS.md` | Remove this chunk when shipped |

### `tests/beginner.spec.js` coverage

- Beginner difficulty shows 2 choice buttons (not 4)
- No timer bar is displayed / timer does not count down
- Type hint is automatically shown at round start
- Scoring applies 0.5× multiplier
- No item drops at end of game
- Progressive reveal changes silhouette brightness over time
- Beginner button appears in difficulty selector

### Verification

1. Select Beginner difficulty — only 2 choices shown, no timer bar
2. Type hint displayed automatically (e.g. "Fire type")
3. Wait 7+ seconds — silhouette progressively brightens
4. Answer correctly — score shows ~half of normal Easy points
5. End game — no item drops shown
6. Difficulty help modal shows Beginner column
7. `npm test` — all tests pass

---

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

## Chunk 13 — Gen 3 Unlock (Hoenn)

**Depends on: Chunk 8 (Gen 2 Unlock — shipped).**

Adds Gen 3 (Hoenn, 135 Pokémon, IDs 252–386). Earning the Gen 2 completion badge unlocks Gen 3, following the same pattern as Gen 1 → Gen 2. Dynamic Pokédex hub card description already shipped — `updateDexHubDesc()` in `game.js` updates the count based on unlocked gens.

### Architectural refactor: GEN_CONFIG lookup table

The current gen helpers (`genPool()`, `genTypes()`, `genOffset()`, `genAliases()`) use hardcoded gen1/gen2 ternaries. Adding Gen 3 as another ternary layer would be fragile. Refactor to a config lookup:

```js
const GEN_CONFIG = {
  gen1: { pool: POKEMON, types: TYPES, offset: 0, aliases: ALIASES, filterTypes: GEN1_TYPES, count: 151, region: 'Kanto' },
  gen2: { pool: POKEMON_GEN2, types: TYPES_GEN2, offset: 151, aliases: ALIASES_GEN2, filterTypes: GEN2_TYPES, count: 100, region: 'Johto' },
  gen3: { pool: POKEMON_GEN3, types: TYPES_GEN3, offset: 251, aliases: ALIASES_GEN3, filterTypes: GEN3_TYPES, count: 135, region: 'Hoenn' },
};
function genPool()    { return GEN_CONFIG[currentGen].pool; }
function genTypes()   { return GEN_CONFIG[currentGen].types; }
function genOffset()  { return GEN_CONFIG[currentGen].offset; }
function genAliases() { return GEN_CONFIG[currentGen].aliases; }
```

Update the stale-gen guard to be generic:
```js
if (currentGen !== 'gen1' && !unlockedGens[currentGen]) currentGen = 'gen1';
```

Update `buildPokedex()` filter bar to use `GEN_CONFIG[currentGen].filterTypes`.

### Gen 3 data arrays — `js/data.js`

- **`POKEMON_GEN3`** — 135 names: treecko through deoxys (IDs 252–386)
- **`TYPES_GEN3`** — 135 parallel type strings with modern typing
- **`ALIASES_GEN3`** — alternate spellings (e.g. `"deoxys": ["deoxys-normal"]`)
- **`GEN3_TYPES`** — same as `GEN2_TYPES` (Dark, Steel present; Fairy is Gen 6). Placed in `js/game.js` alongside `GEN1_TYPES` and `GEN2_TYPES`.

### Generic `renderGenSelectors()`

Replace the hardcoded `unlockedGens.gen2` show/hide with a generic check:

```js
function renderGenSelectors() {
  const anyUnlocked = Object.keys(unlockedGens).length > 0;
  ['wtp-gen-section', 'tq-gen-section', 'dex-gen-section'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = anyUnlocked ? '' : 'none';
  });
  document.querySelectorAll('.gen-btn').forEach(btn => {
    const gen = btn.dataset.gen;
    btn.classList.toggle('selected', gen === currentGen);
    if (gen !== 'gen1') {
      btn.disabled = !unlockedGens[gen];
      btn.textContent = unlockedGens[gen]
        ? 'Gen ' + gen.slice(3)
        : 'Gen ' + gen.slice(3) + ' 🔒';
    }
  });
  updateDexHubDesc();
}
```

### `checkCompletionBadge()` — Gen 3 unlock + badge

After the existing Gen 2 badge check, add:
- If `completionBadges.gen2` and gen3 not unlocked → unlock gen3, show toast "🎉 Hoenn unlocked!"
- If gen3 unlocked and no gen3 badge → check if all 135 Gen 3 Pokémon caught → award badge, show toast "🏆 Gen III badge earned!"

### Gen selector markup — `index.html`

Add a Gen 3 button to each of the 3 gen selector sections (`wtp-gen-section`, `tq-gen-section`, `dex-gen-section`):
```html
<button class="gen-btn" data-gen="gen3" disabled>Gen 3 🔒</button>
```

### Items screen — Gen 3 badge

Add `<div id="badge-gen3" style="display:none"></div>` after `#badge-gen2` in `index.html`.

In `renderItemsScreen()`, add Gen 3 badge block after Gen 2 (same pattern):
- Hidden when gen3 locked
- Placeholder: "Catch all 135 Gen III Pokémon to earn the Gen III badge"
- Earned: "🏆 Gen III — Hoenn Master"

### Files

| File | Change |
|---|---|
| `js/data.js` | `POKEMON_GEN3`, `TYPES_GEN3`, `ALIASES_GEN3` arrays (135 entries each) |
| `js/game.js` | `GEN_CONFIG` lookup table replacing ternary helpers, `GEN3_TYPES`, generic `renderGenSelectors()`, Gen 3 blocks in `checkCompletionBadge()`, Gen 3 badge in `renderItemsScreen()`, extend `updateDexHubDesc()` for gen3 |
| `index.html` | Gen 3 buttons in 3 gen-section divs, `#badge-gen3` div |
| `tests/gen3.spec.js` | New spec mirroring gen2.spec.js structure |
| `README.md` | Update to "Gen I, II & III Edition", document Gen 3 unlock, update Pokédex description |
| `FUTURE-ENHANCEMENTS.md` | Remove this chunk when shipped |
| `sw.js` | Bump `CACHE_NAME` to `pokedex-cache-v3` |

### `tests/gen3.spec.js` coverage

- Gen selector: gen3 button enabled when unlocked, hidden when locked
- Unlock trigger: catching all 100 gen2 Pokémon unlocks gen3
- WTP with gen3: uses IDs 252–386, correct answer adds to caught dex
- Type quiz with gen3: uses IDs 252–386, correct answers accepted
- Pokedex with gen3: 135 cards, /135 denominator, Dark/Steel filter buttons
- Gen1 unaffected: still 151 cards when switching back
- Items screen gen3 badge: hidden/placeholder/earned states
- Hub card description: "Browse all 151" → "Browse all 251" → "Browse all 386" as gens unlock

### Verification

1. Fresh save — no gen selectors, hub card says "Browse all 151"
2. Seed all 151 caught → gen1 badge + gen2 unlock, hub card says "Browse all 251"
3. Seed all 251 caught → gen2 badge + gen3 unlock, hub card says "Browse all 386"
4. Select Gen 3 in WTP — only Hoenn Pokémon (IDs 252–386)
5. Select Gen 3 in Type Quiz — correct answers accepted
6. Pokedex with Gen 3 — 135 cards, Dark/Steel filter buttons
7. Switch back to Gen 1 — 151 cards, original filter bar
8. Items screen — Gen 3 badge hidden/placeholder/earned states correct
9. `npm test` — all existing + new tests pass

---

## Long-term — Gen 4–9 Unlock Progression

Chunks 8 and 13 establish the gen unlock pattern. Gen 4–9 follow the same structure — each requires its own data arrays in `data.js`, a `GEN_CONFIG` entry, and markup for the gen button and badge. No structural code changes beyond what Chunk 13 introduces with `GEN_CONFIG`.

- ID ranges: Gen4 387–493, Gen5 494–649, Gen6 650–721, Gen7 722–809, Gen8 810–905, Gen9 906–1025
- Fairy type introduced in Gen 6 — `filterTypes` for Gen 6+ needs to include Fairy
- PokeAPI: pixel art, official artwork, and Showdown GIFs confirmed available for all gens 1–9

---

## Long-term — Challenge Modes

- **Daily challenge** — fixed daily seed so all players play the same Pokémon; shareable result card
- **Friend challenge** — share a seed/link so friends play the same shuffle and compare scores

---

## Long-term — Cross-device Sync

Local tracking is fully functional (`wtp_seen_dex`, `wtp_caught_dex`, `wtp_shiny_dex`). Syncing across devices would require a backend (Supabase / Firebase), lightweight sign-in, and a merge strategy for the three ID sets. Optional enhancement — not blocking anything.
