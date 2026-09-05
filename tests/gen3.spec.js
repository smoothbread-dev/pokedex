const { test, expect } = require('@playwright/test');
const { openApp, activeScreen, readJson, startWhosThat, waitForRound, answer, startTypeQuiz, answerTypeQuiz, openPokedex } = require('./helpers');

const ALL_GEN1 = Array.from({ length: 151 }, (_, i) => i + 1);
const ALL_GEN2 = Array.from({ length: 100 }, (_, i) => 152 + i);

function gen3Unlocked() {
  return {
    wtp_caught_dex: JSON.stringify([...ALL_GEN1, ...ALL_GEN2]),
    wtp_seen_dex: JSON.stringify([...ALL_GEN1, ...ALL_GEN2]),
    wtp_unlocked_gens: JSON.stringify({ gen2: true, gen3: true }),
    wtp_completion_badges: JSON.stringify({ gen1: true, gen2: true }),
  };
}

test.describe('gen selector visibility', () => {
  test('gen selectors hidden when only gen1 available', async ({ page }) => {
    await openApp(page);
    await page.click('#hub-game-btn');
    await expect(page.locator('#wtp-gen-section')).not.toBeVisible();
    await page.click('#settings-back-btn');
    await page.click('#hub-typequiz-btn');
    await expect(page.locator('#tq-gen-section')).not.toBeVisible();
  });

  test('gen3 button visible when gen3 is unlocked', async ({ page }) => {
    await openApp(page, gen3Unlocked());
    await page.click('#hub-game-btn');
    await expect(page.locator('#wtp-gen-section')).toBeVisible();
    const btn = page.locator('#wtp-gen-section .gen-btn[data-gen="gen3"]');
    await expect(btn).toBeVisible();
    await expect(btn).not.toBeDisabled();
  });

  test('gen3 button disabled when gen3 is locked', async ({ page }) => {
    await openApp(page, {
      wtp_caught_dex: JSON.stringify(ALL_GEN1),
      wtp_seen_dex: JSON.stringify(ALL_GEN1),
      wtp_unlocked_gens: JSON.stringify({ gen2: true }),
      wtp_completion_badges: JSON.stringify({ gen1: true }),
    });
    await page.click('#hub-game-btn');
    const btn = page.locator('#wtp-gen-section .gen-btn[data-gen="gen3"]');
    await expect(btn).toBeDisabled();
  });
});

test.describe('unlock trigger', () => {
  test('catching all 100 gen2 unlocks gen3', async ({ page }) => {
    await openApp(page, {
      wtp_caught_dex: JSON.stringify([...ALL_GEN1, ...ALL_GEN2.slice(0, 99)]),
      wtp_seen_dex: JSON.stringify([...ALL_GEN1, ...ALL_GEN2]),
      wtp_unlocked_gens: JSON.stringify({ gen2: true }),
      wtp_completion_badges: JSON.stringify({ gen1: true }),
    });
    await page.evaluate(() => {
      caughtDex.add(251);
      localStorage.setItem('wtp_caught_dex', JSON.stringify([...caughtDex]));
      checkCompletionBadge();
    });
    const gens = await readJson(page, 'wtp_unlocked_gens');
    expect(gens.gen3).toBe(true);
  });

  test('gen3 not unlocked without gen2 badge', async ({ page }) => {
    await openApp(page, {
      wtp_caught_dex: JSON.stringify(ALL_GEN1),
      wtp_unlocked_gens: JSON.stringify({ gen2: true }),
      wtp_completion_badges: JSON.stringify({ gen1: true }),
    });
    const gens = await readJson(page, 'wtp_unlocked_gens');
    expect(gens.gen3).toBeUndefined();
  });
});

test.describe('WTP with gen3', () => {
  test('gen3 game uses IDs 252-386', async ({ page }) => {
    await openApp(page, {
      ...gen3Unlocked(),
      wtp_active_gen: 'gen3',
    });
    await startWhosThat(page, { rounds: 10 });
    const poke = await page.evaluate(() => ({ id: current.id, name: current.name }));
    expect(poke.id).toBeGreaterThanOrEqual(252);
    expect(poke.id).toBeLessThanOrEqual(386);
  });

  test('correct answer in gen3 adds to caught dex', async ({ page }) => {
    await openApp(page, {
      ...gen3Unlocked(),
      wtp_active_gen: 'gen3',
    });
    await startWhosThat(page, { rounds: 10 });
    const before = await readJson(page, 'wtp_caught_dex');
    await answer(page, { correct: true });
    const after = await readJson(page, 'wtp_caught_dex');
    expect(after.length).toBeGreaterThan((before || []).length);
  });
});

test.describe('type quiz with gen3', () => {
  test('gen3 type quiz uses IDs 252-386', async ({ page }) => {
    await openApp(page, {
      ...gen3Unlocked(),
      wtp_active_gen: 'gen3',
    });
    await startTypeQuiz(page, { rounds: 10 });
    const id = await page.evaluate(() => tqCurrent.id);
    expect(id).toBeGreaterThanOrEqual(252);
    expect(id).toBeLessThanOrEqual(386);
  });

  test('gen3 type quiz accepts correct answers', async ({ page }) => {
    await openApp(page, {
      ...gen3Unlocked(),
      wtp_active_gen: 'gen3',
    });
    await startTypeQuiz(page, { rounds: 10 });
    await answerTypeQuiz(page, { correct: true });
    const score = await page.evaluate(() => tqScore);
    expect(score).toBeGreaterThanOrEqual(1);
  });
});

test.describe('pokedex with gen3', () => {
  test('gen3 pokedex shows 135 cards', async ({ page }) => {
    await openApp(page, {
      ...gen3Unlocked(),
      wtp_active_gen: 'gen3',
    });
    await openPokedex(page);
    await expect(page.locator('.dex-card')).toHaveCount(135);
  });

  test('gen3 pokedex progress uses /135 denominator', async ({ page }) => {
    await openApp(page, {
      ...gen3Unlocked(),
      wtp_active_gen: 'gen3',
    });
    await openPokedex(page);
    const text = await page.locator('#dex-progress').textContent();
    expect(text).toContain('/ 135');
  });

  test('gen3 pokedex has Dark and Steel type options in dropdown', async ({ page }) => {
    await openApp(page, {
      ...gen3Unlocked(),
      wtp_active_gen: 'gen3',
    });
    await openPokedex(page);
    await page.click('#type-dropdown-trigger');
    await expect(page.locator('#type-dropdown-panel .type-option[data-type="Dark"]')).toBeVisible();
    await expect(page.locator('#type-dropdown-panel .type-option[data-type="Steel"]')).toBeVisible();
  });

  test('gen3 pokemon modal shows correct type, not Normal fallback', async ({ page }) => {
    const gen3Seen = Array.from({ length: 135 }, (_, i) => 252 + i);
    await openApp(page, {
      ...gen3Unlocked(),
      wtp_active_gen: 'gen3',
      wtp_seen_dex: JSON.stringify([...ALL_GEN1, ...ALL_GEN2, ...gen3Seen]),
    });
    await openPokedex(page);
    await page.click('.dex-card[data-id="255"]');
    await expect(page.locator('#dex-modal')).toHaveClass(/open/);
    await expect(page.locator('#modal-types')).toContainText('Fire');
    await expect(page.locator('#modal-types')).not.toContainText('Normal');
  });

  test('switching to gen1 in pokedex shows 151 cards', async ({ page }) => {
    await openApp(page, {
      ...gen3Unlocked(),
      wtp_active_gen: 'gen3',
    });
    await openPokedex(page);
    await page.click('#dex-gen-section .gen-btn[data-gen="gen1"]');
    await expect(page.locator('.dex-card')).toHaveCount(151);
  });
});

test.describe('gen1 unaffected', () => {
  test('gen1 game still uses IDs 1-151', async ({ page }) => {
    await openApp(page, gen3Unlocked());
    await startWhosThat(page, { rounds: 10 });
    const poke = await page.evaluate(() => ({ id: current.id }));
    expect(poke.id).toBeGreaterThanOrEqual(1);
    expect(poke.id).toBeLessThanOrEqual(151);
  });

  test('gen1 pokedex still shows 151 cards', async ({ page }) => {
    await openApp(page, gen3Unlocked());
    await openPokedex(page);
    await expect(page.locator('.dex-card')).toHaveCount(151);
  });
});

test.describe('items screen gen3 badge', () => {
  test('gen3 badge hidden when gen3 is locked', async ({ page }) => {
    await openApp(page);
    await page.click('#hub-items-btn');
    await expect(page.locator('#badge-gen3')).not.toBeVisible();
  });

  test('gen3 badge visible as placeholder when unlocked but not earned', async ({ page }) => {
    await openApp(page, gen3Unlocked());
    await page.click('#hub-items-btn');
    await expect(page.locator('#badge-gen3')).toBeVisible();
    await expect(page.locator('#badge-gen3.badge-earned')).toHaveCount(0);
  });

  test('gen3 badge earned when all 135 gen3 pokemon caught', async ({ page }) => {
    const gen3Ids = Array.from({ length: 135 }, (_, i) => 252 + i);
    await openApp(page, {
      ...gen3Unlocked(),
      wtp_caught_dex: JSON.stringify([...ALL_GEN1, ...ALL_GEN2, ...gen3Ids]),
    });
    await page.click('#hub-items-btn');
    await expect(page.locator('#badge-gen3.badge-earned')).toBeVisible();
  });

  test('gen3 badge appears without refresh after earning', async ({ page }) => {
    const gen3Almost = Array.from({ length: 134 }, (_, i) => 252 + i);
    await openApp(page, {
      ...gen3Unlocked(),
      wtp_caught_dex: JSON.stringify([...ALL_GEN1, ...ALL_GEN2, ...gen3Almost]),
    });
    await page.evaluate(() => {
      caughtDex.add(386);
      localStorage.setItem('wtp_caught_dex', JSON.stringify([...caughtDex]));
      checkCompletionBadge();
    });
    await page.click('#hub-items-btn');
    await expect(page.locator('#badge-gen3.badge-earned')).toBeVisible();
  });
});

test.describe('hub card description', () => {
  test('hub shows Browse all 386 when gen3 unlocked', async ({ page }) => {
    await openApp(page, gen3Unlocked());
    const text = await page.locator('#hub-dex-desc').textContent();
    expect(text).toContain('386');
  });

  test('hub subtitle includes Hoenn when gen3 unlocked', async ({ page }) => {
    await openApp(page, gen3Unlocked());
    const text = await page.locator('#hub-subtitle').textContent();
    expect(text).toContain('III');
    expect(text).toContain('Hoenn');
  });
});
