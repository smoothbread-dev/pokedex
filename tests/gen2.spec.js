const { test, expect } = require('@playwright/test');
const { openApp, activeScreen, readJson, startWhosThat, waitForRound, answer, startTypeQuiz, answerTypeQuiz, openPokedex } = require('./helpers');

const ALL_GEN1 = Array.from({ length: 151 }, (_, i) => i + 1);

function gen2Unlocked() {
  return {
    wtp_caught_dex: JSON.stringify(ALL_GEN1),
    wtp_seen_dex: JSON.stringify(ALL_GEN1),
    wtp_unlocked_gens: JSON.stringify({ gen2: true }),
    wtp_completion_badges: JSON.stringify({ gen1: true }),
  };
}

test.describe('gen selector visibility', () => {
  test('gen selectors hidden when gen2 is locked', async ({ page }) => {
    await openApp(page);
    await page.click('#hub-game-btn');
    await expect(page.locator('#wtp-gen-section')).not.toBeVisible();
    await page.click('#settings-back-btn');
    await page.click('#hub-typequiz-btn');
    await expect(page.locator('#tq-gen-section')).not.toBeVisible();
  });

  test('gen selectors visible when gen2 is unlocked', async ({ page }) => {
    await openApp(page, gen2Unlocked());
    await page.click('#hub-game-btn');
    await expect(page.locator('#wtp-gen-section')).toBeVisible();
    await page.click('#settings-back-btn');
    await page.click('#hub-typequiz-btn');
    await expect(page.locator('#tq-gen-section')).toBeVisible();
  });

  test('gen2 button enabled when unlocked', async ({ page }) => {
    await openApp(page, gen2Unlocked());
    await page.click('#hub-game-btn');
    const btn = page.locator('#wtp-gen-section .gen-btn[data-gen="gen2"]');
    await expect(btn).not.toBeDisabled();
  });
});

test.describe('unlock trigger', () => {
  test('catching all 151 gen1 unlocks gen2', async ({ page }) => {
    await openApp(page, {
      wtp_caught_dex: JSON.stringify(ALL_GEN1.slice(0, 150)),
      wtp_seen_dex: JSON.stringify(ALL_GEN1),
    });
    await page.evaluate(() => {
      caughtDex.add(151);
      localStorage.setItem('wtp_caught_dex', JSON.stringify([...caughtDex]));
      checkCompletionBadge();
    });
    const gens = await readJson(page, 'wtp_unlocked_gens');
    expect(gens.gen2).toBe(true);
  });

  test('gen2 not unlocked with only 150 caught', async ({ page }) => {
    await openApp(page, {
      wtp_caught_dex: JSON.stringify(ALL_GEN1.slice(0, 150)),
    });
    const gens = await readJson(page, 'wtp_unlocked_gens');
    expect(gens).toBeNull();
  });
});

test.describe('WTP with gen2', () => {
  test('gen2 game uses IDs 152-251', async ({ page }) => {
    await openApp(page, {
      ...gen2Unlocked(),
      wtp_active_gen: 'gen2',
    });
    await startWhosThat(page, { rounds: 10 });
    const poke = await page.evaluate(() => ({ id: current.id, name: current.name }));
    expect(poke.id).toBeGreaterThanOrEqual(152);
    expect(poke.id).toBeLessThanOrEqual(251);
  });

  test('correct answer in gen2 adds to caught dex', async ({ page }) => {
    await openApp(page, {
      ...gen2Unlocked(),
      wtp_active_gen: 'gen2',
    });
    await startWhosThat(page, { rounds: 10 });
    const before = await readJson(page, 'wtp_caught_dex');
    await answer(page, { correct: true });
    const after = await readJson(page, 'wtp_caught_dex');
    expect(after.length).toBeGreaterThan((before || []).length);
  });
});

test.describe('type quiz with gen2', () => {
  test('gen2 type quiz uses IDs 152-251', async ({ page }) => {
    await openApp(page, {
      ...gen2Unlocked(),
      wtp_active_gen: 'gen2',
    });
    await startTypeQuiz(page, { rounds: 10 });
    const id = await page.evaluate(() => tqCurrent.id);
    expect(id).toBeGreaterThanOrEqual(152);
    expect(id).toBeLessThanOrEqual(251);
  });

  test('gen2 type quiz accepts correct answers', async ({ page }) => {
    await openApp(page, {
      ...gen2Unlocked(),
      wtp_active_gen: 'gen2',
    });
    await startTypeQuiz(page, { rounds: 10 });
    await answerTypeQuiz(page, { correct: true });
    const score = await page.evaluate(() => tqScore);
    expect(score).toBeGreaterThanOrEqual(1);
  });
});

test.describe('pokedex with gen2', () => {
  test('gen2 pokedex shows 100 cards', async ({ page }) => {
    await openApp(page, {
      ...gen2Unlocked(),
      wtp_active_gen: 'gen2',
    });
    await openPokedex(page);
    await expect(page.locator('.dex-card')).toHaveCount(100);
  });

  test('gen2 pokedex progress uses /100 denominator', async ({ page }) => {
    await openApp(page, {
      ...gen2Unlocked(),
      wtp_active_gen: 'gen2',
    });
    await openPokedex(page);
    const text = await page.locator('#dex-progress').textContent();
    expect(text).toContain('/ 100');
  });

  test('gen2 pokedex has Dark and Steel filter buttons', async ({ page }) => {
    await openApp(page, {
      ...gen2Unlocked(),
      wtp_active_gen: 'gen2',
    });
    await openPokedex(page);
    await expect(page.locator('.type-filter-btn:text("Dark")')).toBeVisible();
    await expect(page.locator('.type-filter-btn:text("Steel")')).toBeVisible();
  });

  test('gen2 pokemon modal shows correct type, not Normal fallback', async ({ page }) => {
    const gen2Seen = Array.from({ length: 100 }, (_, i) => 152 + i);
    await openApp(page, {
      ...gen2Unlocked(),
      wtp_active_gen: 'gen2',
      wtp_seen_dex: JSON.stringify([...ALL_GEN1, ...gen2Seen]),
    });
    await openPokedex(page);
    await page.click('.dex-card[data-id="155"]');
    await expect(page.locator('#dex-modal')).toHaveClass(/open/);
    await expect(page.locator('#modal-types')).toContainText('Fire');
    await expect(page.locator('#modal-types')).not.toContainText('Normal');
  });

  test('switching to gen1 in pokedex shows 151 cards', async ({ page }) => {
    await openApp(page, {
      ...gen2Unlocked(),
      wtp_active_gen: 'gen2',
    });
    await openPokedex(page);
    await page.click('#dex-gen-section .gen-btn[data-gen="gen1"]');
    await expect(page.locator('.dex-card')).toHaveCount(151);
  });
});

test.describe('gen1 unaffected', () => {
  test('gen1 game still uses IDs 1-151', async ({ page }) => {
    await openApp(page, gen2Unlocked());
    await startWhosThat(page, { rounds: 10 });
    const poke = await page.evaluate(() => ({ id: current.id }));
    expect(poke.id).toBeGreaterThanOrEqual(1);
    expect(poke.id).toBeLessThanOrEqual(151);
  });

  test('gen1 pokedex still shows 151 cards', async ({ page }) => {
    await openApp(page, gen2Unlocked());
    await openPokedex(page);
    await expect(page.locator('.dex-card')).toHaveCount(151);
  });
});

test.describe('items screen gen2 badge', () => {
  test('gen2 badge hidden when gen2 is locked', async ({ page }) => {
    await openApp(page);
    await page.click('#hub-items-btn');
    await expect(page.locator('#badge-gen2')).not.toBeVisible();
  });

  test('gen2 badge visible as placeholder when unlocked but not earned', async ({ page }) => {
    await openApp(page, gen2Unlocked());
    await page.click('#hub-items-btn');
    await expect(page.locator('#badge-gen2')).toBeVisible();
    await expect(page.locator('#badge-gen2.badge-earned')).toHaveCount(0);
  });

  test('gen2 badge earned when all 100 gen2 pokemon caught', async ({ page }) => {
    const gen2Ids = Array.from({ length: 100 }, (_, i) => 152 + i);
    await openApp(page, {
      ...gen2Unlocked(),
      wtp_caught_dex: JSON.stringify([...ALL_GEN1, ...gen2Ids]),
    });
    await page.click('#hub-items-btn');
    await expect(page.locator('#badge-gen2.badge-earned')).toBeVisible();
  });

  test('gen2 badge appears without refresh after earning', async ({ page }) => {
    const gen2Almost = Array.from({ length: 99 }, (_, i) => 152 + i);
    await openApp(page, {
      ...gen2Unlocked(),
      wtp_caught_dex: JSON.stringify([...ALL_GEN1, ...gen2Almost]),
    });
    await page.evaluate(() => {
      caughtDex.add(251);
      localStorage.setItem('wtp_caught_dex', JSON.stringify([...caughtDex]));
      checkCompletionBadge();
    });
    await page.click('#hub-items-btn');
    await expect(page.locator('#badge-gen2.badge-earned')).toBeVisible();
  });
});
