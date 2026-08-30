# PokéDex — Gen I Kanto Edition

A browser-based Pokémon hub featuring all 151 Gen 1 Pokémon: a silhouette guessing game, a type/weakness quiz, and a browsable Pokédex.

## Play

Open `index.html` in any modern browser — no server, build step, or installation needed.

## Contents

The hub screen has four sections:

| Section | What it is |
|---------|-----------|
| **Who's That?** | Guess the Pokémon from its silhouette |
| **Type Quiz** | Guess each Pokémon's type or its weaknesses |
| **Pokédex** | Browse all 151, filter/search, view stats and weaknesses |
| **Settings** | Site-wide audio and Pokédex options |

## Who's That Pokémon?

**Modes**

- **Normal** — fixed number of rounds
- **Lives ❤️** — three lives, run until you lose them all
- **Time Attack ⚡** — 60 seconds, as many as you can get

**Difficulty**

| Difficulty | Timer | Answering | Hint cost |
|------------|-------|-----------|-----------|
| Easy | 15s | Multiple choice | Free (first letter always shown) |
| Normal | 10s | Multiple choice | 5 pts |
| Hard | 8s | Type the name | 10 pts |

**Scoring**

| Event | Points |
|-------|--------|
| Correct answer | +10 |
| Speed bonus (answered within 3s) | +5 |
| Streak ×2 multiplier | at 5 correct in a row |
| Streak ×3 multiplier | at 10 correct in a row |
| Wrong answer or timeout | 0, streak resets |

Round count is 10 / 25 / 50 / All (151). Best score persists in `localStorage`. The end screen shows an accuracy grade (S/A/B/C) and a **Missed** grid listing every Pokémon you got wrong, with its types, 2× weaknesses, and what you guessed — tap any card to open its Pokédex entry.

Alternate spellings are accepted (e.g. "Nidoran", "Farfetch'd", "Mr Mime").

## Type Quiz

Guess Type, Guess Weakness, or Mixed, over 10 / 20 / 40 rounds. The results screen has a **Round Review** list — filterable to wrong answers only or all rounds — showing each Pokémon, the question asked, your answer, and the correct one.

## Pokédex

- All 151 with pixel sprites, filterable by type and searchable by name
- Detail modal with official artwork, type badges, a **Weaknesses** tab (4× / 2× / ½× / ¼× / 0×) and a **Stats** tab (base stats from PokeAPI, cached per session)
- **Shiny toggle** on the detail card swaps between normal and shiny official artwork
- **Discovery Mode** silhouettes Pokémon you haven't encountered yet (see below)
- Cry playback per Pokémon

## Shiny Encounters

Each round of Who's That Pokémon has a **1/128** chance of showing a shiny. The silhouette hides it, so it's a surprise on reveal — a glowing `✨ SHINY` badge appears over the artwork. Naming it correctly registers it to your shiny Pokédex.

## Progress Tracking

Three sets are tracked and persisted in `localStorage`:

| Key | Tracks | Shown as |
|-----|--------|----------|
| `wtp_seen_dex` | Pokémon that have appeared in any round | Entry unlocked in the Pokédex |
| `wtp_caught_dex` | Pokémon you've correctly named at least once | Green ✓ on the Pokédex card |
| `wtp_shiny_dex` | Shinies you've encountered and named | Gold border + ✨ on the card |

**Seen vs named** — seen means the Pokémon has been in front of you, which unlocks its entry. Named means you actually got the answer right in Who's That Pokémon.

What contributes:

| Where | Seen | Named | Shiny |
|-------|:----:|:-----:|:-----:|
| Who's That — Normal / Lives / Time Attack | ✓ | ✓ | ✓ |
| Type Quiz | ✓ | — | — |
| Browsing the Pokédex | — | — | — |

All Who's That modes count identically — difficulty and round count make no difference. Type Quiz only marks a Pokémon as seen, because it shows you the name. The `?` button on the Pokédex screen opens this same legend in-app.

The Pokédex screen shows a running `👁 n / 151 seen · ✓ n named · ✨ n shiny` counter, and the detail modal flags the named and shiny states.

Progress is **per-device** — cross-device sync would require a backend and is not implemented.

## Discovery Mode

On by default. Pokémon you haven't encountered yet appear in the Pokédex as black silhouettes named `???`, with their types hidden; opening one shows a locked entry instead of stats and weaknesses. Unseen entries are also excluded from name search and type filtering, so the dex can't be used to look up an answer mid-game.

A Pokémon counts as seen once it has been revealed in a Who's That round (right or wrong) or shown in a Type Quiz round. Turn Discovery Mode off in Settings to use the Pokédex as a plain reference.

Shiny artwork is gated the same way: while Discovery Mode is on, an entry's shiny toggle only appears once you've actually found that shiny (or are viewing one you just encountered from the end-screen Missed grid).

## Settings

Audio controls, persisted in `localStorage` under `pokedex_audio_settings`:

- **Sound** — master switch for all audio
- **Announcer** — spoken "Who's that Pokémon!" and reveals
- **Pokémon Cries** — cry playback in games and the Pokédex
- **Announcer Voice** — dropdown of available English voices, with a Test button

Pokédex controls, persisted under `wtp_dex_settings`:

- **Discovery Mode** — hide unencountered Pokémon as silhouettes

Voice selection defaults to `Auto`, which scores the device's voices to pick the closest deep English voice. This exists because platforms expose completely different voice sets — Windows has named voices like "David", while Android typically only exposes locale-named female voices. When no male voice is available the announcer pitch is lowered to compensate. Use the dropdown to pin a specific voice.

## Tests

A Playwright suite covers all three sections plus tracking and settings. It runs against a bundled static server and stubs every network call, so it needs no internet access after install.

**No terminal needed:** double-click [run-tests.bat](run-tests.bat). It installs dependencies and the Chromium browser on first run, then gives you a menu to run the suite, watch it in a visible browser, open interactive UI mode, view the last report, or just serve the app.

From a terminal instead:

```bash
npm install
npm run setup   # downloads the Chromium binary (one time)
npm test
```

| Command | What it does |
|---------|--------------|
| `npm run setup` | Install the Chromium browser Playwright drives |
| `npm test` | Full suite, desktop + mobile viewports |
| `npm run test:desktop` | Chromium only |
| `npm run test:mobile` | Pixel 5 viewport only |
| `npm run test:headed` | Watch it run in a visible browser |
| `npm run test:ui` | Playwright's interactive UI mode |
| `npm run report` | Open the HTML report from the last run |
| `npm run serve` | Just serve the app at `http://127.0.0.1:4173` |

Spec layout:

| File | Covers |
|------|--------|
| `tests/hub.spec.js` | Screen routing and back navigation |
| `tests/whos-that.spec.js` | Scoring, multipliers, hints, all three modes, pause, end screen |
| `tests/type-quiz.spec.js` | Type/weakness rounds, pause, results and round review |
| `tests/pokedex.spec.js` | Grid, search, filters, detail modal, discovery and shiny gating, help |
| `tests/tracking.spec.js` | Seen / named / shiny registration, marks and persistence |
| `tests/settings.spec.js` | Audio toggles, announcer voice, discovery mode |

Helpers live in `tests/helpers.js`. `openApp(page, storage)` seeds `localStorage` before the app boots, which is how tests set up a given Pokédex state without playing through it.

## Tech

- Plain HTML/CSS/JS — no frameworks, no build step
- `index.html` holds markup and styles; logic is split across `js/data.js` (Pokémon data, type chart, sprite URLs), `js/audio.js` (speech, stings, cries), and `js/game.js` (all screens and game loops)
- Sprites and cries served from the PokeAPI GitHub CDN; base stats from the PokeAPI REST API (no API key needed)
- Silhouettes via CSS `filter: brightness(0)`; stings synthesised with the Web Audio API; announcer via the Web Speech API

## Files

```
index.html                       markup + styles
js/data.js                       Pokémon list, types, aliases, type chart, sprite/cry URLs
js/audio.js                      audio settings, voice selection, stings, cries
js/game.js                       screen routing, Who's That, Type Quiz, Pokédex, settings
tests/                           Playwright suite + static server
run-tests.bat                    double-click to run tests, no terminal needed
.github/prompts/                 reusable chat prompts (see below)
.github/copilot-instructions.md  project conventions, picked up automatically
FUTURE-ENHANCEMENTS.md           ideas not built yet
```

## Keeping tests and docs in sync

After finishing a batch of changes, run the bundled prompt in chat:

```
/sync-tests-and-docs
```

It reads the diff, updates the Playwright specs and this README to match, prunes anything now implemented from `FUTURE-ENHANCEMENTS.md`, and runs the suite.

The prompt lives in [.github/prompts/sync-tests-and-docs.prompt.md](.github/prompts/sync-tests-and-docs.prompt.md) — edit it there, or copy its body if you want to paste it somewhere else. `.github/copilot-instructions.md` carries the project conventions and is applied automatically, so the rules hold even without invoking the prompt.
