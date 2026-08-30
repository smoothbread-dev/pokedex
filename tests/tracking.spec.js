const { test, expect } = require('@playwright/test');
const {
  openApp, startWhosThat, answer, answerAndAdvance, timeoutRound,
  startTypeQuiz, answerTypeQuiz, forceShiny, startShinyRound, currentPokemon, openPokedex, readJson,
} = require('./helpers');

test('a correct answer registers the Pokémon as seen and named', async ({ page }) => {
  await openApp(page);
  await startWhosThat(page, { rounds: 10 });
  const target = await currentPokemon(page);
  await answer(page, { correct: true });
  expect(await readJson(page, 'wtp_seen_dex')).toContain(target.id);
  expect(await readJson(page, 'wtp_caught_dex')).toContain(target.id);
});

test('a wrong answer registers seen but not named', async ({ page }) => {
  await openApp(page);
  await startWhosThat(page, { rounds: 10 });
  const target = await currentPokemon(page);
  await answer(page, { correct: false });
  expect(await readJson(page, 'wtp_seen_dex')).toContain(target.id);
  expect(await readJson(page, 'wtp_caught_dex') || []).not.toContain(target.id);
});

test('a timeout still registers the Pokémon as seen', async ({ page }) => {
  await openApp(page);
  await startWhosThat(page, { rounds: 10 });
  const target = await currentPokemon(page);
  await timeoutRound(page);
  expect(await readJson(page, 'wtp_seen_dex')).toContain(target.id);
});

test('Type Quiz registers seen only', async ({ page }) => {
  await openApp(page);
  await startTypeQuiz(page, { rounds: 10 });
  const id = await page.evaluate(() => tqCurrent.id);
  await answerTypeQuiz(page, { correct: true });
  expect(await readJson(page, 'wtp_seen_dex')).toContain(id);
  expect(await readJson(page, 'wtp_caught_dex') || []).not.toContain(id);
  expect(await readJson(page, 'wtp_shiny_dex') || []).not.toContain(id);
});

test('every Who\'s That mode contributes the same way', async ({ page }) => {
  await openApp(page);
  for (const mode of ['normal', 'lives', 'timeattack']) {
    await page.evaluate(() => { if (typeof goToMainMenu === 'function') goToMainMenu(); });
    await startWhosThat(page, { mode });
    const target = await currentPokemon(page);
    await answerAndAdvance(page, { correct: true });
    expect(await readJson(page, 'wtp_caught_dex')).toContain(target.id);
  }
});

test.describe('shiny', () => {
  test.beforeEach(async ({ page }) => openApp(page));

  test('naming a shiny registers it', async ({ page }) => {
    await startWhosThat(page, { rounds: 10 });
    const target = await currentPokemon(page);
    await forceShiny(page);
    await answer(page, { correct: true });
    await expect(page.locator('#shiny-badge')).toBeVisible();
    await expect(page.locator('#feedback')).toContainText('Shiny registered');
    expect(await readJson(page, 'wtp_shiny_dex')).toContain(target.id);
  });

  test('missing a shiny does not register it', async ({ page }) => {
    await startWhosThat(page, { rounds: 10 });
    const target = await currentPokemon(page);
    await forceShiny(page);
    await answer(page, { correct: false });
    await expect(page.locator('#shiny-badge')).toBeVisible();
    expect(await readJson(page, 'wtp_shiny_dex') || []).not.toContain(target.id);
  });

  test('a shiny round loads shiny sprites', async ({ page }) => {
    await startWhosThat(page, { rounds: 10 });
    await startShinyRound(page);
    expect(await page.evaluate(() => currentShiny)).toBe(true);
    await expect(page.locator('#pokemon-sil')).toHaveAttribute('src', /showdown\/shiny/);
    await expect(page.locator('#pokemon-art')).toHaveAttribute('src', /official-artwork\/shiny/);
  });

  test('the badge is cleared on the next round', async ({ page }) => {
    await startWhosThat(page, { rounds: 10 });
    await forceShiny(page);
    await answerAndAdvance(page, { correct: true });
    await expect(page.locator('#shiny-badge')).toBeVisible();
    await page.waitForFunction(() => roundActive === true);
    await expect(page.locator('#shiny-badge')).toBeHidden();
  });
});

test.describe('Pokédex marks', () => {
  test('the counter reflects stored progress', async ({ page }) => {
    await openApp(page, {
      wtp_seen_dex: JSON.stringify([1, 2, 3]),
      wtp_caught_dex: JSON.stringify([1, 2]),
      wtp_shiny_dex: JSON.stringify([1]),
    });
    await openPokedex(page);
    await expect(page.locator('#dex-progress')).toContainText('3 / 151 seen');
    await expect(page.locator('#dex-progress')).toContainText('2 named');
    await expect(page.locator('#dex-progress')).toContainText('1 shiny');
  });

  test('cards carry the right marks per state', async ({ page }) => {
    await openApp(page, {
      wtp_seen_dex: JSON.stringify([1, 2, 3]),
      wtp_caught_dex: JSON.stringify([1, 2]),
      wtp_shiny_dex: JSON.stringify([1]),
    });
    await openPokedex(page);
    const shiny = page.locator('#pokedex-grid .dex-card[data-id="1"]');
    const named = page.locator('#pokedex-grid .dex-card[data-id="2"]');
    const seenOnly = page.locator('#pokedex-grid .dex-card[data-id="3"]');
    const unseen = page.locator('#pokedex-grid .dex-card[data-id="4"]');

    await expect(shiny).toHaveClass(/has-shiny/);
    await expect(shiny).toHaveClass(/caught/);
    await expect(named).toHaveClass(/caught/);
    await expect(named).not.toHaveClass(/has-shiny/);
    await expect(seenOnly).not.toHaveClass(/caught/);
    await expect(seenOnly).not.toHaveClass(/unseen/);
    await expect(unseen).toHaveClass(/unseen/);
  });

  test('progress from a game shows up in the Pokédex', async ({ page }) => {
    await openApp(page);
    await startWhosThat(page, { rounds: 10 });
    const target = await currentPokemon(page);
    await answer(page, { correct: true });
    await page.evaluate(() => { queue = []; endGame(); });
    await page.click('#main-menu-btn');
    await openPokedex(page);
    const card = page.locator(`#pokedex-grid .dex-card[data-id="${target.id}"]`);
    await expect(card).toHaveClass(/caught/);
    await expect(card.locator('.dex-card-name')).toHaveText(target.display);
  });

  test('legacy named progress counts as seen', async ({ page }) => {
    await openApp(page, { wtp_caught_dex: JSON.stringify([25]) });
    await openPokedex(page);
    const pikachu = page.locator('#pokedex-grid .dex-card[data-id="25"]');
    await expect(pikachu).not.toHaveClass(/unseen/);
    await expect(pikachu.locator('.dex-card-name')).toHaveText('Pikachu');
  });

  test('progress survives a reload', async ({ page }) => {
    await openApp(page);
    await startWhosThat(page, { rounds: 10 });
    const target = await currentPokemon(page);
    await answer(page, { correct: true });
    await page.reload();
    expect(await page.evaluate(id => caughtDex.has(id), target.id)).toBe(true);
    expect(await page.evaluate(id => seenDex.has(id), target.id)).toBe(true);
  });
});
