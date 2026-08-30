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

## Sound Effects
Add a short "wrong" buzz via Web Audio on a missed answer (currently only the reveal sting plays).

## Save Data Export / Import
Manual backup and restore of game progress (all 6 `localStorage` keys) as a downloadable JSON file. Useful as a safety net for transferring progress across devices or recovering from storage loss. Would add Export/Import buttons to the Settings screen.
