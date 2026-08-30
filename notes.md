# Future Enhancement Ideas

## Gen Unlock Progression
Completing the Pokédex for a generation (correctly naming every Pokémon in that gen) unlocks the next generation as a playable pool. Gen unlock requires only base-form completion — no shiny completion needed.

- Store unlocked gens in `localStorage` (no backend needed)
- Settings screen gets a gen selector showing only unlocked gens
- Each gen needs its own POKEMON list and TYPES array in `data.js`
- ID ranges: Gen1 1–151, Gen2 152–251, Gen3 252–386, Gen4 387–493, Gen5 494–649, Gen6 650–721, Gen7 722–809, Gen8 810–905, Gen9 906–1025
- PokeAPI confirmed: pixel, official artwork, and Showdown GIFs all available for all gens 1–9

## Shiny Pokédex & Encounters
Two connected features:

**Pokédex modal** — toggle between normal and shiny official artwork on the detail card. PokeAPI shiny sprites: `sprites/pokemon/other/official-artwork/shiny/{id}.png` and `sprites/pokemon/other/showdown/shiny/{id}.gif`.

**In-game shiny encounters** — rare chance (e.g. 1/128) that a shiny appears during a game round. Answering correctly logs it to the shiny Pokédex entry in `localStorage`. Completing the shiny Pokédex for a gen could earn a badge (TBD — not a hard requirement).

## Pokédex Tracking
Show a small checkmark on each Pokédex card for every Pokémon the player has correctly named. Straightforward with `localStorage`; cross-device sync would need a backend (Supabase/Firebase) but is optional.

## Challenge Modes
- **Daily challenge** — fixed daily seed so everyone plays the same Pokémon that day; shareable result card.
- **Friend challenge** — share a seed/link so friends play the same shuffle and compare scores.

## Sound Effects
Add a short "wrong" buzz via Web Audio on a missed answer (currently only the reveal sting plays).
