# Project conventions

Gen I Kanto PokéDex hub: silhouette guessing game, type quiz, and browsable Pokédex. Plain HTML/CSS/JS, no framework, no build step.

## Layout

- `index.html` — all markup and styles
- `js/data.js` — Pokémon list, types, aliases, type chart, sprite and cry URLs
- `js/audio.js` — audio settings, voice selection, stings, cries
- `js/game.js` — screen routing and all three sections
- `tests/` — Playwright suite plus a static server used only by tests

Scripts are classic (non-module) and share a global scope. Top-level `let`/`const` are reachable from `page.evaluate` by bare identifier, not via `window`.

## Conventions

- Screens are `.screen` divs toggled by `showScreen(id)`; exactly one is `.active`.
- Persisted state lives in `localStorage` and every read is wrapped in try/catch. Current keys: `wtp_best_score`, `wtp_seen_dex`, `wtp_caught_dex`, `wtp_shiny_dex`, `wtp_dex_settings`, `pokedex_audio_settings`.
- Sprites and cries come from the PokeAPI GitHub CDN; base stats from the PokeAPI REST API. Any new remote image needs an `onerror` fallback to the pixel sprite.
- Between-round waits must be cancellable so pause and quit work. Use `schedulePending` / `clearPending` (Who's That) or `tqSchedule` / `tqClearPending` (Type Quiz), never a bare `setTimeout`.
- Guard input handlers on both `roundActive` and `paused`.

## When changing behaviour

Update the Playwright suite and `README.md` in the same change. Fixed bugs get a regression test. Tests must stay offline — network calls are stubbed in `tests/helpers.js`. Run `npm test` before declaring done.

Ideas that are not built yet belong in `FUTURE-ENHANCEMENTS.md`; remove entries as they ship.
