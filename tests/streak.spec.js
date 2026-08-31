const { test, expect } = require('@playwright/test');
const { openApp, startWhosThat, waitForRound, answer, answerAndAdvance, readJson, startTypeQuiz, answerTypeQuiz, currentPokemon } = require('./helpers');

test.describe('play streak', () => {
  test('streak badge is hidden with no streak data', async ({ page }) => {
    await openApp(page);
    await expect(page.locator('#streak-slot')).toBeHidden();
  });

  test('streak badge shows count when streak data exists', async ({ page }) => {
    await openApp(page, {
      wtp_streak: JSON.stringify({ count: 5, lastDate: new Date().toISOString().slice(0, 10) }),
    });
    await expect(page.locator('#streak-slot')).toBeVisible();
    await expect(page.locator('#streak-count')).toHaveText('5');
  });

  test('completing a WTP game sets streak to 1 on first play', async ({ page }) => {
    await openApp(page);
    await startWhosThat(page, { difficulty: 'easy', rounds: 10 });
    await answer(page, { correct: true });
    await page.evaluate(() => { queue = []; endGame(); });
    await expect(page.locator('#end-screen')).toHaveClass(/active/);
    const streak = await readJson(page, 'wtp_streak');
    expect(streak.count).toBe(1);
    expect(streak.lastDate).toBe(new Date().toISOString().slice(0, 10));
  });

  test('completing a TQ game sets streak to 1 on first play', async ({ page }) => {
    await openApp(page);
    await startTypeQuiz(page, { mode: 'type', rounds: 10 });
    await page.evaluate(() => { tqQueue = []; });
    await answerTypeQuiz(page, { correct: true });
    await expect(page.locator('#tq-end-screen')).toHaveClass(/active/, { timeout: 10000 });
    const streak = await readJson(page, 'wtp_streak');
    expect(streak.count).toBe(1);
  });

  test('streak does not increment twice on same day', async ({ page }) => {
    const today = new Date().toISOString().slice(0, 10);
    await openApp(page, {
      wtp_streak: JSON.stringify({ count: 3, lastDate: today }),
    });
    await startWhosThat(page, { difficulty: 'easy', rounds: 10 });
    await answer(page, { correct: true });
    await page.evaluate(() => { queue = []; endGame(); });
    await expect(page.locator('#end-screen')).toHaveClass(/active/);
    const streak = await readJson(page, 'wtp_streak');
    expect(streak.count).toBe(3);
  });

  test('streak increments from yesterday', async ({ page }) => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    await openApp(page, {
      wtp_streak: JSON.stringify({ count: 2, lastDate: yesterday }),
    });
    await startWhosThat(page, { difficulty: 'easy', rounds: 10 });
    await answer(page, { correct: true });
    await page.evaluate(() => { queue = []; endGame(); });
    await expect(page.locator('#end-screen')).toHaveClass(/active/);
    const streak = await readJson(page, 'wtp_streak');
    expect(streak.count).toBe(3);
  });

  test('streak resets if a day was skipped', async ({ page }) => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
    await openApp(page, {
      wtp_streak: JSON.stringify({ count: 5, lastDate: twoDaysAgo }),
    });
    await startWhosThat(page, { difficulty: 'easy', rounds: 10 });
    await answer(page, { correct: true });
    await page.evaluate(() => { queue = []; endGame(); });
    await expect(page.locator('#end-screen')).toHaveClass(/active/);
    const streak = await readJson(page, 'wtp_streak');
    expect(streak.count).toBe(1);
  });

  test('3-day milestone grants lures', async ({ page }) => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    await openApp(page, {
      wtp_streak: JSON.stringify({ count: 2, lastDate: yesterday }),
      wtp_items: JSON.stringify({ unseen_lure: 0, uncaught_lure: 0, shiny_charm: 0 }),
    });
    await startWhosThat(page, { difficulty: 'easy', rounds: 10 });
    await answer(page, { correct: true });
    await page.evaluate(() => { queue = []; endGame(); });
    await expect(page.locator('#end-screen')).toHaveClass(/active/);
    await expect(page.locator('#end-drops')).toContainText('3-day streak');
    const items = await readJson(page, 'wtp_items');
    expect(items.unseen_lure).toBeGreaterThanOrEqual(1);
    expect(items.uncaught_lure).toBeGreaterThanOrEqual(1);
  });

  test('streak badge shows next milestone reward', async ({ page }) => {
    await openApp(page, {
      wtp_streak: JSON.stringify({ count: 1, lastDate: new Date().toISOString().slice(0, 10) }),
    });
    await expect(page.locator('#streak-next')).toContainText('3 days');
  });

  test('streak badge shows shiny charm milestone at count 5', async ({ page }) => {
    await openApp(page, {
      wtp_streak: JSON.stringify({ count: 5, lastDate: new Date().toISOString().slice(0, 10) }),
    });
    await expect(page.locator('#streak-next')).toContainText('7 days');
  });

  test('streak badge shows all milestones reached past 14', async ({ page }) => {
    await openApp(page, {
      wtp_streak: JSON.stringify({ count: 15, lastDate: new Date().toISOString().slice(0, 10) }),
    });
    await expect(page.locator('#streak-next')).toContainText('All milestones reached');
  });

  test('streak badge updates after returning to hub', async ({ page }) => {
    await openApp(page);
    await startWhosThat(page, { difficulty: 'easy', rounds: 10 });
    await answer(page, { correct: true });
    await page.evaluate(() => { queue = []; endGame(); });
    await expect(page.locator('#end-screen')).toHaveClass(/active/);
    await page.click('#main-menu-btn');
    await expect(page.locator('#streak-slot')).toBeVisible();
    await expect(page.locator('#streak-count')).toHaveText('1');
  });
});

test.describe('familiarity bonus', () => {
  test('already-caught Pokémon awards +5 familiarity', async ({ page }) => {
    await openApp(page, {
      wtp_caught_dex: JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
        21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
        41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
        61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80,
        81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100,
        101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120,
        121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140,
        141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151]),
    });
    await startWhosThat(page, { difficulty: 'easy', rounds: 10 });
    await waitForRound(page);
    await answer(page, { correct: true });
    await expect(page.locator('#feedback')).toContainText('familiarity');
  });

  test('first-time catch does not show familiarity bonus', async ({ page }) => {
    await openApp(page);
    await startWhosThat(page, { difficulty: 'easy', rounds: 10 });
    await waitForRound(page);
    await answer(page, { correct: true });
    await expect(page.locator('#feedback')).not.toContainText('familiarity');
  });
});
