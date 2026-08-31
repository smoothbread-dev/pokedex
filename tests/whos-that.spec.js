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
  test('shows four choice buttons instead of typed input', async ({ page }) => {
    await startWhosThat(page, { difficulty: 'hard', rounds: 10 });
    await expect(page.locator('#choices')).toBeVisible();
    await expect(page.locator('#type-area')).toBeHidden();
    await expect(page.locator('#choices .choice-btn')).toHaveCount(4);
  });

  test('a correct button click awards points', async ({ page }) => {
    await startWhosThat(page, { difficulty: 'hard', rounds: 10 });
    const scoreBefore = await page.evaluate(() => score);
    await answer(page, { correct: true });
    expect(await page.evaluate(() => score)).toBeGreaterThan(scoreBefore);
  });

  test('a wrong button goes red and the correct one goes green', async ({ page }) => {
    await startWhosThat(page, { difficulty: 'hard', rounds: 10 });
    await answer(page, { correct: false });
    await expect(page.locator('#choices .correct-ans')).toHaveCount(1);
    await expect(page.locator('#choices .wrong-ans')).toHaveCount(1);
  });

  test('the hint eliminates one wrong option without removing the answer', async ({ page }) => {
    await startWhosThat(page, { difficulty: 'hard', rounds: 10 });
    const target = await currentPokemon(page);
    await page.click('#hint-btn');
    await expect(page.locator('#choices .eliminated')).toHaveCount(1);
    const elimText = await page.locator('#choices .eliminated').textContent();
    expect(elimText.trim()).not.toBe(target.display);
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

  test('waits for the reveal cry before advancing when it runs long', async ({ page }) => {
    await startWhosThat(page, { rounds: 10 });
    await page.evaluate(() => {
      audioSettings.sound = true;
      audioSettings.voice = false;
      audioSettings.cries = true;
      window.__finishCry = null;
      window.playCry = (id, onDone) => { window.__finishCry = onDone; };
    });
    await answer(page, { correct: true });
    await page.waitForTimeout(3600);
    await expect(page.locator('#progress-label')).toHaveText('1 / 10');
    await page.evaluate(() => window.__finishCry());
    await waitForRound(page);
    await expect(page.locator('#progress-label')).toHaveText('2 / 10');
  });

  test('does not add extra delay after a short reveal cry', async ({ page }) => {
    await startWhosThat(page, { rounds: 10 });
    await page.evaluate(() => {
      audioSettings.sound = true;
      audioSettings.voice = false;
      audioSettings.cries = true;
      window.playCry = (id, onDone) => setTimeout(onDone, 500);
    });
    await answer(page, { correct: true });
    await page.waitForTimeout(3300);
    await expect(page.locator('#progress-label')).toHaveText('2 / 10');
  });

  test('caps cry waiting so trailing silence cannot stall the reveal', async ({ page }) => {
    await startWhosThat(page, { rounds: 10 });
    const elapsed = await page.evaluate(() => new Promise(resolve => {
      audioSettings.sound = true;
      audioSettings.cries = true;
      const OriginalAudio = Audio;
      window.Audio = function() {
        return {
          volume: 1,
          onended: null,
          onerror: null,
          play: () => Promise.resolve(),
        };
      };
      const started = performance.now();
      playCry(current.id, () => {
        window.Audio = OriginalAudio;
        resolve(performance.now() - started);
      });
    }));
    expect(elapsed).toBeGreaterThanOrEqual(1000);
    expect(elapsed).toBeLessThan(1800);
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
