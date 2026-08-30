---
description: "Sync the Playwright suite and README with the latest code changes in this project"
name: "Sync tests and docs"
argument-hint: "Optionally name the feature or files you changed"
agent: "agent"
---

Bring the Playwright suite and the documentation back in sync with the current state of the code.

## Scope

Work only inside this project folder. Do not touch sibling projects in the workspace.

Key files:
- [index.html](../../index.html) — markup and styles
- [js/data.js](../../js/data.js) — Pokémon data, type chart, sprite and cry URLs
- [js/audio.js](../../js/audio.js) — audio settings, voice selection, stings, cries
- [js/game.js](../../js/game.js) — screen routing and all three sections
- [tests/](../../tests) — Playwright suite and its helpers
- [README.md](../../README.md) — user-facing documentation
- [FUTURE-ENHANCEMENTS.md](../../FUTURE-ENHANCEMENTS.md) — ideas not yet built

## Steps

1. **Find what changed.** Run `git diff HEAD` and `git status` to see uncommitted work, and `git log --oneline -10` for recent commits. If the user named a feature above, focus there but still scan for related changes.

2. **Inventory the behaviour.** For each change, identify: new or renamed DOM ids and CSS classes, new `localStorage` keys, new game state or settings, changed scoring or progression rules, and anything that alters an existing user-visible flow.

3. **Update the tests.**
   - Add coverage for new behaviour, and update assertions that the change invalidated.
   - Reuse the helpers in [tests/helpers.js](../../tests/helpers.js). Extend them rather than duplicating setup inside specs.
   - Put specs in the file that matches the area: `hub`, `whos-that`, `type-quiz`, `pokedex`, `tracking`, `settings`. Create a new spec file only for a genuinely new area.
   - Seed state through `openApp(page, storage)` instead of playing through rounds to reach a state.
   - Keep tests offline — all network calls must stay stubbed. Never add a test that depends on the live PokeAPI or GitHub CDN.
   - Every bug fixed in this round of changes gets a regression test that would have caught it.

4. **Update the README.** Reflect changed behaviour in the relevant sections (modes, scoring, Pokédex, tracking, settings, tests, file layout). Correct anything the change made inaccurate — do not just append. Keep the existing tone and table style.

5. **Update FUTURE-ENHANCEMENTS.md.** Remove or rewrite any entry that is now implemented. If something was only partly built, say what is done and what is still open.

6. **Verify.** Run `npm test` and make it pass. Report the pass count. If a test fails, decide whether the test or the app is wrong before changing either, and say which you concluded.

## Output

Summarise briefly:
- Which behaviours changed
- Tests added or updated, and what each protects against
- Documentation sections corrected
- Final test result

Do not create extra markdown files to describe the work.
