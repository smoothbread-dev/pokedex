const { test, expect } = require('@playwright/test');
const { openApp, startWhosThat, answer, forceShiny, currentPokemon, readJson } = require('./helpers');

test.describe('shiny bonus points', () => {
  test('correct answer on new shiny awards +50 bonus points', async ({ page }) => {
    await openApp(page);
    await startWhosThat(page, { rounds: 10 });
    await forceShiny(page);
    const scoreBefore = await page.evaluate(() => score);
    await answer(page, { correct: true });
    const scoreAfter = await page.evaluate(() => score);
    expect(scoreAfter - scoreBefore).toBeGreaterThanOrEqual(50);
  });

  test('correct answer on repeat shiny awards +25 bonus points', async ({ page }) => {
    await openApp(page);
    await startWhosThat(page, { rounds: 10 });
    const target = await currentPokemon(page);
    await page.evaluate((id) => {
      shinyDex.add(id);
      localStorage.setItem('wtp_shiny_dex', JSON.stringify([...shinyDex]));
    }, target.id);
    await forceShiny(page);
    const scoreBefore = await page.evaluate(() => score);
    await answer(page, { correct: true });
    const scoreAfter = await page.evaluate(() => score);
    const baseMin = 10;
    expect(scoreAfter - scoreBefore).toBeGreaterThanOrEqual(baseMin + 25);
    expect(scoreAfter - scoreBefore).toBeLessThan(baseMin + 50);
  });

  test('wrong answer on shiny awards no bonus and does not register', async ({ page }) => {
    await openApp(page);
    await startWhosThat(page, { rounds: 10 });
    const target = await currentPokemon(page);
    await forceShiny(page);
    await answer(page, { correct: false });
    const scoreAfter = await page.evaluate(() => score);
    expect(scoreAfter).toBe(0);
    expect(await readJson(page, 'wtp_shiny_dex') || []).not.toContain(target.id);
  });

  test('feedback message includes +50 for new shiny', async ({ page }) => {
    await openApp(page);
    await startWhosThat(page, { rounds: 10 });
    await forceShiny(page);
    await answer(page, { correct: true });
    await expect(page.locator('#feedback')).toContainText('Shiny registered! +50');
  });

  test('feedback message includes +25 for repeat shiny', async ({ page }) => {
    await openApp(page);
    await startWhosThat(page, { rounds: 10 });
    const target = await currentPokemon(page);
    await page.evaluate((id) => {
      shinyDex.add(id);
      localStorage.setItem('wtp_shiny_dex', JSON.stringify([...shinyDex]));
    }, target.id);
    await forceShiny(page);
    await answer(page, { correct: true });
    await expect(page.locator('#feedback')).toContainText('Shiny! +25');
  });

  test('help modals mention shiny bonus', async ({ page }) => {
    await openApp(page);
    await page.click('#hub-dex-btn');
    await page.click('#dex-help-btn');
    await expect(page.locator('#help-modal')).toContainText('+50 bonus points');
    await page.click('#help-modal-close');
    await page.click('#dex-back-btn');
    await page.click('#hub-game-btn');
    await page.click('#diff-help-btn');
    await expect(page.locator('#diff-help-modal')).toContainText('+50 pts (new shiny)');
  });
});
