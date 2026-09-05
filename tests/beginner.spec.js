const { test, expect } = require('@playwright/test');
const { openApp, startWhosThat, answer, answerAndAdvance, waitForRound, currentPokemon, readJson } = require('./helpers');

test.describe('beginner mode', () => {
  test('shows 2 choice buttons instead of 4', async ({ page }) => {
    await openApp(page);
    await startWhosThat(page, { difficulty: 'beginner', rounds: 10 });
    await expect(page.locator('#choices .choice-btn')).toHaveCount(2);
  });

  test('no timer runs in beginner mode', async ({ page }) => {
    await openApp(page);
    await startWhosThat(page, { difficulty: 'beginner', rounds: 10 });
    const barWidth = await page.locator('#timer-bar').evaluate(el => el.style.width);
    expect(barWidth).toBe('0%');
    await page.waitForTimeout(2000);
    const stillActive = await page.evaluate(() => roundActive);
    expect(stillActive).toBe(true);
  });

  test('auto-shows type and first letter hint at round start', async ({ page }) => {
    await openApp(page);
    await startWhosThat(page, { difficulty: 'beginner', rounds: 10 });
    const hintText = await page.locator('#hint-text').textContent();
    expect(hintText).toContain('Type:');
    expect(hintText).toContain('First letter:');
  });

  test('scoring applies 0.5x multiplier', async ({ page }) => {
    await openApp(page);
    await startWhosThat(page, { difficulty: 'beginner', rounds: 10 });
    const scoreBefore = await page.evaluate(() => score);
    await answer(page, { correct: true });
    const scoreAfter = await page.evaluate(() => score);
    const pts = scoreAfter - scoreBefore;
    expect(pts).toBeLessThanOrEqual(7);
    expect(pts).toBeGreaterThanOrEqual(5);
  });

  test('no item drops at end of game', async ({ page }) => {
    test.setTimeout(60000);
    await openApp(page);
    await startWhosThat(page, { difficulty: 'beginner', rounds: 10 });
    for (let i = 0; i < 10; i++) {
      await answerAndAdvance(page, { correct: true });
      if (i < 9) await waitForRound(page);
    }
    await expect(page.locator('#end-screen')).toHaveClass(/active/);
    const items = await readJson(page, 'wtp_items');
    expect(items === null || items.unseen_lure === 0).toBe(true);
    expect(items === null || items.uncaught_lure === 0).toBe(true);
  });

  test('progressive reveal brightens silhouette over time', async ({ page }) => {
    await openApp(page);
    await startWhosThat(page, { difficulty: 'beginner', rounds: 10 });
    const initialFilter = await page.locator('#pokemon-sil').evaluate(el => el.style.filter);
    expect(initialFilter).toContain('brightness(0)');
    await page.waitForTimeout(4500);
    const midFilter = await page.locator('#pokemon-sil').evaluate(el => el.style.filter);
    expect(midFilter).toContain('brightness(0.15)');
  });

  test('beginner button appears in difficulty selector', async ({ page }) => {
    await openApp(page);
    await page.click('#hub-game-btn');
    await expect(page.locator('.diff-btn[data-diff="beginner"]')).toBeVisible();
  });

  test('manual hint shows category', async ({ page }) => {
    await openApp(page);
    await startWhosThat(page, { difficulty: 'beginner', rounds: 10 });
    const autoHint = await page.locator('#hint-text').textContent();
    await page.click('#hint-btn');
    const hintAfter = await page.locator('#hint-text').textContent();
    expect(hintAfter).not.toBe(autoHint);
    expect(hintAfter).toContain('Pokémon');
  });

  test('help modal shows Beginner column', async ({ page }) => {
    await openApp(page);
    await page.click('#hub-game-btn');
    await page.click('#diff-help-btn');
    await expect(page.locator('#diff-help-modal')).toContainText('Beginner');
    await expect(page.locator('#diff-help-modal')).toContainText('2 random');
    await expect(page.locator('#diff-help-modal')).toContainText('Progressive reveal');
  });
});
