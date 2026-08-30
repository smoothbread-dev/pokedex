const { test, expect } = require('@playwright/test');
const {
  openApp, startWhosThat, answer, answerAndAdvance, timeoutRound,
  waitForRound, activeScreen, currentPokemon,
} = require('./helpers');

test.beforeEach(async ({ page }) => openApp(page));

test.describe('scoring', () => {
  test('a correct answer awards points and shows positive feedback', async ({ page }) => {
    await startWhosThat(page, { rounds: 10 });
    await answer(page, { correct: true });
    await expect(page.locator('#feedback')).toHaveClass(/correct/);
    await expect(page.locator('#feedback')).toContainText('Correct!');
    expect(await page.evaluate(() => score)).toBeGreaterThanOrEqual(10);
    expect(await page.evaluate(() => streak)).toBe(1);
  });

  test('a wrong answer resets the streak and names the Pokémon', async ({ page }) => {
    await startWhosThat(page, { rounds: 10 });
    await answer(page, { correct: true });
    await waitForRound(page);
    const target = await currentPokemon(page);
    await answer(page, { correct: false });
    await expect(page.locator('#feedback')).toHaveClass(/wrong/);
    await expect(page.locator('#feedback')).toContainText(target.display);
    expect(await page.evaluate(() => streak)).toBe(0);
  });

  test('a timeout counts as a wrong answer', async ({ page }) => {
    await startWhosThat(page, { rounds: 10 });
    await timeoutRound(page);
    await expect(page.locator('#feedback')).toHaveClass(/wrong/);
    expect(await page.evaluate(() => missedPokemon.length)).toBe(1);
  });

  test('the streak multiplier badge appears at five in a row', async ({ page }) => {
    await startWhosThat(page, { rounds: 10 });
    for (let i = 0; i < 4; i++) {
      await answerAndAdvance(page, { correct: true });
      await waitForRound(page);
    }
    await expect(page.locator('#mult-badge')).toBeHidden();
    await answer(page, { correct: true });
    await expect(page.locator('#mult-badge')).toBeVisible();
    await expect(page.locator('#mult-badge')).toHaveText('x2');
  });

  test('the all-time best score persists across reloads', async ({ page }) => {
    await startWhosThat(page, { rounds: 10 });
    await answer(page, { correct: true });
    await page.evaluate(() => endGame());
    const best = await page.evaluate(() => allTimeBest);
    expect(best).toBeGreaterThan(0);
    await page.reload();
    await expect(page.locator('#best-val')).toHaveText(String(best));
  });
});

test.describe('hints', () => {
  test('easy difficulty always reveals the first letter', async ({ page }) => {
    await startWhosThat(page, { difficulty: 'easy', rounds: 10 });
    const target = await currentPokemon(page);
    await expect(page.locator('#hint-text')).toHaveText(`First letter: ${target.display[0].toUpperCase()}`);
  });

  test('a hint costs points, reveals the type and cannot be reused', async ({ page }) => {
    await startWhosThat(page, { difficulty: 'normal', rounds: 10 });
    const target = await currentPokemon(page);
    await page.click('#hint-btn');
    expect(await page.evaluate(() => score)).toBe(-5);
    await expect(page.locator('#hint-text')).toContainText('Type:');
    await expect(page.locator('#hint-text')).toContainText(target.display[0].toUpperCase());
    await expect(page.locator('#hint-btn')).toBeDisabled();
  });
});

test.describe('hard difficulty', () => {
  test('uses the typed input instead of choices', async ({ page }) => {
    await startWhosThat(page, { difficulty: 'hard', rounds: 10 });
    await expect(page.locator('#type-area')).toBeVisible();
    await expect(page.locator('#choices')).toBeHidden();
  });

  test('accepts an alternate spelling', async ({ page }) => {
    await startWhosThat(page, { difficulty: 'hard', rounds: 10 });
    // Force a Pokémon with known aliases, then answer with one of them.
    await page.evaluate(() => { current = { name: 'mr-mime', id: 122 }; });
    await page.fill('#answer-input', 'mr. mime');
    await page.click('#submit-btn');
    await expect(page.locator('#feedback')).toHaveClass(/correct/);
  });

  test('rejects an empty submission', async ({ page }) => {
    await startWhosThat(page, { difficulty: 'hard', rounds: 10 });
    await page.fill('#answer-input', '   ');
    await page.click('#submit-btn');
    expect(await page.evaluate(() => roundActive)).toBe(true);
  });
});

test.describe('normal mode', () => {
  test('progress counts up and the game ends after the chosen rounds', async ({ page }) => {
    await startWhosThat(page, { rounds: 10 });
    await expect(page.locator('#progress-label')).toHaveText('1 / 10');
    await answerAndAdvance(page, { correct: true });
    await waitForRound(page);
    await expect(page.locator('#progress-label')).toHaveText('2 / 10');

    await page.evaluate(() => { queue = []; });
    await answer(page, { correct: true });
    await expect(page.locator('#end-screen')).toHaveClass(/active/, { timeout: 10000 });
    await expect(page.locator('#end-correct')).toContainText('/ 10');
  });

  test('missed Pokémon appear on the end screen', async ({ page }) => {
    await startWhosThat(page, { rounds: 10 });
    const target = await currentPokemon(page);
    await answer(page, { correct: false });
    await page.evaluate(() => { queue = []; endGame(); });
    await expect(page.locator('#missed-section')).toBeVisible();
    await expect(page.locator('#missed-grid .missed-card')).toHaveCount(1);
    await expect(page.locator('#missed-grid .missed-card')).toContainText(target.display);
    await expect(page.locator('#missed-grid .missed-card')).toContainText('You said:');
  });
});

test.describe('lives mode', () => {
  test('hides the rounds selector and shows three hearts', async ({ page }) => {
    await page.click('#hub-game-btn');
    await page.click('.mode-btn[data-mode="lives"]');
    await expect(page.locator('#rounds-section')).toBeHidden();
    await page.click('#start-btn');
    await expect(page.locator('#lives-row')).toBeVisible();
    await expect(page.locator('#lives-row .lost')).toHaveCount(0);
  });

  test('labels progress by round number rather than a fixed total', async ({ page }) => {
    await startWhosThat(page, { mode: 'lives' });
    await expect(page.locator('#progress-label')).toHaveText('Round 1');
    await answerAndAdvance(page, { correct: true });
    await waitForRound(page);
    await expect(page.locator('#progress-label')).toHaveText('Round 2');
  });

  test('loses a heart per wrong answer and ends at zero', async ({ page }) => {
    await startWhosThat(page, { mode: 'lives' });
    await answerAndAdvance(page, { correct: false });
    await expect(page.locator('#lives-row .lost')).toHaveCount(1);
    await waitForRound(page);
    await answerAndAdvance(page, { correct: false });
    await expect(page.locator('#lives-row .lost')).toHaveCount(2);
    await waitForRound(page);
    await answerAndAdvance(page, { correct: false });
    await expect(page.locator('#end-screen')).toHaveClass(/active/, { timeout: 10000 });
  });

  test('end totals count rounds played, not the rounds setting', async ({ page }) => {
    await startWhosThat(page, { mode: 'lives', rounds: 25 });
    await answerAndAdvance(page, { correct: true });
    await waitForRound(page);
    await answerAndAdvance(page, { correct: false });
    await waitForRound(page);
    await answerAndAdvance(page, { correct: false });
    await waitForRound(page);
    await answerAndAdvance(page, { correct: false });
    await expect(page.locator('#end-screen')).toHaveClass(/active/, { timeout: 10000 });
    await expect(page.locator('#end-correct')).toHaveText('1 / 4');
    await expect(page.locator('#end-accuracy')).toHaveText('25%');
  });
});

test.describe('time attack', () => {
  test('shows the clock and hides the per-round timer bar', async ({ page }) => {
    await startWhosThat(page, { mode: 'timeattack' });
    await expect(page.locator('#ta-clock')).toBeVisible();
    await expect(page.locator('#timer-bar-wrap')).toBeHidden();
    await expect(page.locator('#progress-label')).toBeHidden();
  });

  test('ends when the clock runs out', async ({ page }) => {
    await startWhosThat(page, { mode: 'timeattack' });
    await page.evaluate(() => { taTimeLeft = 0.3; });
    await expect(page.locator('#end-screen')).toHaveClass(/active/, { timeout: 10000 });
  });

  test('a round still on screen when time expires is not counted', async ({ page }) => {
    await startWhosThat(page, { mode: 'timeattack' });
    await page.evaluate(() => { taTimeLeft = 0.3; });
    await expect(page.locator('#end-screen')).toHaveClass(/active/, { timeout: 10000 });
    await expect(page.locator('#end-correct')).toHaveText('0 / 0');
  });

  test('the clock pauses and resumes', async ({ page }) => {
    await startWhosThat(page, { mode: 'timeattack' });
    await page.click('#pause-btn');
    await expect(page.locator('#pause-overlay')).toBeVisible();
    const held = await page.evaluate(() => taTimeLeft);
    await page.waitForTimeout(1200);
    expect(await page.evaluate(() => taTimeLeft)).toBe(held);
    await page.click('#resume-btn');
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => taTimeLeft)).toBeLessThan(held);
  });
});

test.describe('pause', () => {
  test('stops the round timer and blocks answering', async ({ page }) => {
    await startWhosThat(page, { difficulty: 'hard', rounds: 10 });
    await page.click('#pause-btn');
    const held = await page.evaluate(() => timeLeft);
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => timeLeft)).toBe(held);

    const scoreBefore = await page.evaluate(() => score);
    await page.evaluate(() => {
      document.getElementById('answer-input').value = current.name;
      submitAnswer();
      useHint();
    });
    expect(await page.evaluate(() => score)).toBe(scoreBefore);
    expect(await page.evaluate(() => roundActive)).toBe(true);
  });

  test('works during the between-round reveal', async ({ page }) => {
    await startWhosThat(page, { rounds: 10 });
    await answerAndAdvance(page, { correct: true });
    await page.click('#pause-btn');
    await expect(page.locator('#pause-overlay')).toBeVisible();
    await page.waitForTimeout(3500);
    await expect(page.locator('#progress-label')).toHaveText('1 / 10');
    await page.click('#resume-btn');
    await waitForRound(page);
    await expect(page.locator('#progress-label')).toHaveText('2 / 10');
  });

  test('returns to the hub and stops the game', async ({ page }) => {
    await startWhosThat(page, { rounds: 10 });
    await page.click('#pause-btn');
    await page.click('#pause-menu-btn');
    expect(await activeScreen(page)).toBe('hub-screen');
    expect(await page.evaluate(() => roundActive)).toBe(false);
    await page.waitForTimeout(3500);
    expect(await activeScreen(page)).toBe('hub-screen');
  });
});

test.describe('end screen', () => {
  test('play again starts a fresh run', async ({ page }) => {
    await startWhosThat(page, { rounds: 10 });
    await answer(page, { correct: true });
    await page.evaluate(() => { queue = []; endGame(); });
    await page.click('#play-again-btn');
    await expect(page.locator('#game-screen')).toHaveClass(/active/);
    expect(await page.evaluate(() => score)).toBe(0);
    expect(await page.evaluate(() => answered)).toBe(1);
  });

  test('main menu returns to the hub', async ({ page }) => {
    await startWhosThat(page, { rounds: 10 });
    await page.evaluate(() => { queue = []; endGame(); });
    await page.click('#main-menu-btn');
    expect(await activeScreen(page)).toBe('hub-screen');
  });
});
