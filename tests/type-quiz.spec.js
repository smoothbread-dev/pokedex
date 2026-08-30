const { test, expect } = require('@playwright/test');
const { openApp, startTypeQuiz, answerTypeQuiz, activeScreen } = require('./helpers');

test.beforeEach(async ({ page }) => openApp(page));

test('shows the Pokémon name and four type choices', async ({ page }) => {
  await startTypeQuiz(page, { rounds: 10 });
  await expect(page.locator('#tq-name')).not.toHaveText('');
  await expect(page.locator('#tq-choices .tq-choice-btn')).toHaveCount(4);
  await expect(page.locator('#tq-progress')).toHaveText('1 / 10');
});

test('"guess type" rounds ask for the type', async ({ page }) => {
  await startTypeQuiz(page, { mode: 'type', rounds: 10 });
  await expect(page.locator('#tq-question-label')).toHaveText('What type?');
});

test('"guess weakness" rounds ask for a weakness', async ({ page }) => {
  await startTypeQuiz(page, { mode: 'weakness', rounds: 10 });
  await expect(page.locator('#tq-question-label')).toHaveText('Weak to?');
});

test('a correct answer scores 10 and marks the chosen option', async ({ page }) => {
  await startTypeQuiz(page, { rounds: 10 });
  await answerTypeQuiz(page, { correct: true });
  await expect(page.locator('#tq-feedback')).toHaveClass(/correct/);
  await expect(page.locator('#tq-score-val')).toHaveText('10');
  await expect(page.locator('#tq-choices .correct-ans')).toHaveCount(1);
});

test('a wrong answer highlights both the pick and the answer', async ({ page }) => {
  await startTypeQuiz(page, { rounds: 10 });
  await answerTypeQuiz(page, { correct: false });
  await expect(page.locator('#tq-feedback')).toHaveClass(/wrong/);
  await expect(page.locator('#tq-score-val')).toHaveText('0');
  await expect(page.locator('#tq-choices .correct-ans')).toHaveCount(1);
  await expect(page.locator('#tq-choices .wrong-ans')).toHaveCount(1);
});

test('all choices lock after answering', async ({ page }) => {
  await startTypeQuiz(page, { rounds: 10 });
  await answerTypeQuiz(page, { correct: true });
  const enabled = await page.locator('#tq-choices .tq-choice-btn:not([disabled])').count();
  expect(enabled).toBe(0);
});

test.describe('pause', () => {
  test('freezes the round advance and resumes it', async ({ page }) => {
    await startTypeQuiz(page, { rounds: 10 });
    await answerTypeQuiz(page, { correct: true });
    await page.click('#tq-pause-btn');
    await expect(page.locator('#tq-pause-overlay')).toBeVisible();
    await page.waitForTimeout(3200);
    await expect(page.locator('#tq-progress')).toHaveText('1 / 10');
    await page.click('#tq-resume-btn');
    await page.waitForFunction(() => tqRoundActive === true);
    await expect(page.locator('#tq-progress')).toHaveText('2 / 10');
  });

  test('quitting mid-reveal stays on the hub', async ({ page }) => {
    await startTypeQuiz(page, { rounds: 10 });
    await page.evaluate(() => { tqQueue = []; });
    await answerTypeQuiz(page, { correct: true });
    await page.click('#tq-pause-btn');
    await page.click('#tq-pause-menu-btn');
    expect(await activeScreen(page)).toBe('hub-screen');
    await page.waitForTimeout(3200);
    expect(await activeScreen(page)).toBe('hub-screen');
  });

  test('a stale advance does not leak into a new quiz', async ({ page }) => {
    await startTypeQuiz(page, { rounds: 10 });
    await answerTypeQuiz(page, { correct: true });
    await page.click('#tq-pause-btn');
    await page.click('#tq-pause-menu-btn');
    await startTypeQuiz(page, { rounds: 10 });
    await page.waitForTimeout(3200);
    await expect(page.locator('#tq-progress')).toHaveText('1 / 10');
  });
});

test.describe('results', () => {
  test.beforeEach(async ({ page }) => {
    await startTypeQuiz(page, { rounds: 10 });
    await page.evaluate(() => { tqQueue = []; });
    await answerTypeQuiz(page, { correct: false });
    await expect(page.locator('#tq-end-screen')).toHaveClass(/active/, { timeout: 10000 });
  });

  test('shows score, accuracy and a grade', async ({ page }) => {
    await expect(page.locator('#tqe-score')).toHaveText('0');
    await expect(page.locator('#tqe-correct')).toHaveText('0 / 10');
    await expect(page.locator('#tqe-accuracy')).toHaveText('0%');
    await expect(page.locator('#tqe-grade')).toHaveText('C');
  });

  test('the review list defaults to wrong answers only', async ({ page }) => {
    await expect(page.locator('#tqe-review-section')).toBeVisible();
    await expect(page.locator('#tq-review-list .tq-review-row')).toHaveCount(1);
    await expect(page.locator('#tq-review-list .wrong-row')).toHaveCount(1);
  });

  test('the review filter switches between wrong and all', async ({ page }) => {
    await page.click('#tqr-all-btn');
    await expect(page.locator('#tqr-all-btn')).toHaveClass(/selected/);
    await expect(page.locator('#tq-review-list .tq-review-row')).toHaveCount(1);
    await page.click('#tqr-wrong-btn');
    await expect(page.locator('#tqr-wrong-btn')).toHaveClass(/selected/);
  });

  test('a review row opens the Pokédex entry', async ({ page }) => {
    await page.click('#tq-review-list .tq-review-row');
    await expect(page.locator('#dex-modal')).toHaveClass(/open/);
    await expect(page.locator('#modal-name')).not.toHaveText('???');
  });

  test('play again restarts the quiz', async ({ page }) => {
    await page.click('#tqe-play-again-btn');
    await expect(page.locator('#tq-screen')).toHaveClass(/active/);
    await expect(page.locator('#tq-score-val')).toHaveText('0');
  });

  test('main menu returns to the hub', async ({ page }) => {
    await page.click('#tqe-menu-btn');
    expect(await activeScreen(page)).toBe('hub-screen');
  });
});
