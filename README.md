# Who's That Pokemon?

A browser-based guessing game featuring all 151 Gen 1 Pokemon.

## Play

Open `index.html` in any modern browser — no server or installation needed.

## Features

- All 151 Gen 1 Pokemon, shuffled randomly each game
- **Two modes** — type the name or pick from 4 multiple-choice options (switchable mid-game)
- **Silhouette reveal** — sprite shown as a black silhouette, revealed on answer
- **10-second countdown timer** per Pokemon, shown as a colour-coded progress bar
- **Speed bonus** — +5 extra points if you answer within 3 seconds
- Score, streak, and best streak tracked throughout the game
- Accepts alternate spellings (e.g. "Nidoran", "Farfetch'd", "Mr Mime")
- Final score screen with accuracy grade

## Scoring

| Event | Points |
|-------|--------|
| Correct answer | +10 |
| Speed bonus (answered in under 3 seconds) | +5 |
| Wrong answer or timeout | 0, streak resets |

## Controls

| Action | Input |
|--------|-------|
| Submit answer (type mode) | Enter or GO button |
| Pick answer (choice mode) | Click a button |
| Next Pokemon | NEXT button or wait 1.8 seconds |
| Switch mode | Type / Choice buttons in top-right |

## Tech

- Single self-contained HTML file — no frameworks, no build step
- Sprites served directly from the PokeAPI GitHub CDN (no API key needed)
- Pure JavaScript — Fisher-Yates shuffle, CSS `filter: brightness(0)` silhouette effect
