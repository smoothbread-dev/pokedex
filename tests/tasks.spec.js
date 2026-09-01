const { test, expect } = require('@playwright/test');
const { openApp, activeScreen, readJson, startWhosThat, waitForRound, answer, answerAndAdvance, startTypeQuiz, answerTypeQuiz } = require('./helpers');

test.describe('tasks screen navigation', () => {
  test.beforeEach(async ({ page }) => openApp(page));

  test('opens from the Tasks hub card and returns', async ({ page }) => {
    await page.click('#hub-tasks-btn');
    expect(await activeScreen(page)).toBe('tasks-screen');
    await page.click('#tasks-back-btn');
    expect(await activeScreen(page)).toBe('hub-screen');
  });

  test('shows 0 / 17 completed with no tasks', async ({ page }) => {
    await page.click('#hub-tasks-btn');
    await expect(page.locator('#tasks-count')).toHaveText('0 / 17 completed');
  });

  test('renders all 6 category headers', async ({ page }) => {
    await page.click('#hub-tasks-btn');
    await expect(page.locator('.task-cat-header')).toHaveCount(6);
  });

  test('renders all 17 task rows', async ({ page }) => {
    await page.click('#hub-tasks-btn');
    await expect(page.locator('.task-row')).toHaveCount(17);
  });
});

test.describe('retroactive awards at boot', () => {
  test('awards seen_10 when 10+ Pokemon are in seen dex', async ({ page }) => {
    const ids = Array.from({ length: 10 }, (_, i) => i + 1);
    await openApp(page, { wtp_seen_dex: JSON.stringify(ids) });
    const tasks = await readJson(page, 'wtp_tasks');
    expect(tasks.seen_10).toBeTruthy();
  });

  test('awards seen_50 when 50+ Pokemon are in seen dex', async ({ page }) => {
    const ids = Array.from({ length: 50 }, (_, i) => i + 1);
    await openApp(page, { wtp_seen_dex: JSON.stringify(ids) });
    const tasks = await readJson(page, 'wtp_tasks');
    expect(tasks.seen_10).toBeTruthy();
    expect(tasks.seen_50).toBeTruthy();
  });

  test('awards caught_25 when 25+ Pokemon are in caught dex', async ({ page }) => {
    const ids = Array.from({ length: 25 }, (_, i) => i + 1);
    await openApp(page, { wtp_caught_dex: JSON.stringify(ids) });
    const tasks = await readJson(page, 'wtp_tasks');
    expect(tasks.caught_25).toBeTruthy();
  });

  test('awards shiny_1 when 1+ shinies exist', async ({ page }) => {
    await openApp(page, { wtp_shiny_dex: JSON.stringify([1]) });
    const tasks = await readJson(page, 'wtp_tasks');
    expect(tasks.shiny_1).toBeTruthy();
  });

  test('awards score_100 when best score >= 100', async ({ page }) => {
    await openApp(page, { wtp_best_score: '150' });
    const tasks = await readJson(page, 'wtp_tasks');
    expect(tasks.score_100).toBeTruthy();
  });

  test('awards full_dex_seen when all 151 seen', async ({ page }) => {
    const ids = Array.from({ length: 151 }, (_, i) => i + 1);
    await openApp(page, { wtp_seen_dex: JSON.stringify(ids) });
    const tasks = await readJson(page, 'wtp_tasks');
    expect(tasks.full_dex_seen).toBeTruthy();
  });

  test('does not show toast for retroactive awards', async ({ page }) => {
    const ids = Array.from({ length: 10 }, (_, i) => i + 1);
    await openApp(page, { wtp_seen_dex: JSON.stringify(ids) });
    await expect(page.locator('.toast')).not.toHaveClass(/visible/);
  });

  test('does not award tasks that are not met', async ({ page }) => {
    const ids = Array.from({ length: 9 }, (_, i) => i + 1);
    await openApp(page, { wtp_seen_dex: JSON.stringify(ids) });
    const tasks = await readJson(page, 'wtp_tasks');
    expect(tasks).toBeNull();
  });
});

test.describe('live unlock during gameplay', () => {
  test('awards seen_10 after seeing the 10th Pokemon and shows toast', async ({ page }) => {
    const ids = Array.from({ length: 9 }, (_, i) => i + 1);
    await openApp(page, { wtp_seen_dex: JSON.stringify(ids) });
    await startWhosThat(page, { rounds: 10 });
    await answer(page, { correct: false });
    await expect(page.locator('.toast')).toHaveClass(/visible/);
    const tasks = await readJson(page, 'wtp_tasks');
    expect(tasks.seen_10).toBeTruthy();
  });

  test('awards caught_25 after naming the 25th Pokemon', async ({ page }) => {
    const caughtIds = Array.from({ length: 24 }, (_, i) => i + 1);
    const seenIds = Array.from({ length: 25 }, (_, i) => i + 1);
    await openApp(page, {
      wtp_caught_dex: JSON.stringify(caughtIds),
      wtp_seen_dex: JSON.stringify(seenIds),
    });
    await startWhosThat(page, { rounds: 10 });
    await answer(page, { correct: true });
    const tasks = await readJson(page, 'wtp_tasks');
    expect(tasks.caught_25).toBeTruthy();
  });
});

test.describe('score tasks via endGame', () => {
  test('awards score_100 when best score crosses 100', async ({ page }) => {
    await openApp(page, { wtp_best_score: '99' });
    await startWhosThat(page, { rounds: 10 });
    await answer(page, { correct: true });
    await page.evaluate(() => { score = 101; endGame(); });
    const tasks = await readJson(page, 'wtp_tasks');
    expect(tasks.score_100).toBeTruthy();
  });
});

test.describe('streak tasks', () => {
  test('awards streak_5 after 5 correct in a row', async ({ page }) => {
    await openApp(page);
    await startWhosThat(page, { rounds: 10 });
    for (let i = 0; i < 5; i++) {
      await answer(page, { correct: true });
      if (i < 4) await waitForRound(page);
    }
    const tasks = await readJson(page, 'wtp_tasks');
    expect(tasks.streak_5).toBeTruthy();
  });
});

test.describe('type quiz tasks', () => {
  test('awards tq_grade_a and tq_grade_s on all-correct 10-round quiz', async ({ page }) => {
    await openApp(page);
    await startTypeQuiz(page, { rounds: 10 });
    for (let i = 0; i < 10; i++) {
      await answerTypeQuiz(page, { correct: true });
      if (i < 9) await page.waitForFunction(() => tqRoundActive === true);
    }
    await expect(page.locator('#tq-end-screen')).toHaveClass(/active/);
    const tasks = await readJson(page, 'wtp_tasks');
    expect(tasks.tq_grade_a).toBeTruthy();
    expect(tasks.tq_grade_s).toBeTruthy();
  });

  test('awards tq_perfect on 100% accuracy with 20+ rounds', async ({ page }) => {
    test.setTimeout(90000);
    await openApp(page);
    await startTypeQuiz(page, { rounds: 20 });
    for (let i = 0; i < 20; i++) {
      await answerTypeQuiz(page, { correct: true });
      if (i < 19) await page.waitForFunction(() => tqRoundActive === true, null, { timeout: 5000 });
    }
    await expect(page.locator('#tq-end-screen')).toHaveClass(/active/);
    const tasks = await readJson(page, 'wtp_tasks');
    expect(tasks.tq_perfect).toBeTruthy();
  });
});

test.describe('idempotency', () => {
  test('does not overwrite existing task timestamp', async ({ page }) => {
    const ids = Array.from({ length: 10 }, (_, i) => i + 1);
    await openApp(page, {
      wtp_seen_dex: JSON.stringify(ids),
      wtp_tasks: JSON.stringify({ seen_10: 1000 }),
    });
    const tasks = await readJson(page, 'wtp_tasks');
    expect(tasks.seen_10).toBe(1000);
  });
});

test.describe('tasks screen rendering', () => {
  test('shows completed tasks with gold styling', async ({ page }) => {
    const ids = Array.from({ length: 10 }, (_, i) => i + 1);
    await openApp(page, {
      wtp_seen_dex: JSON.stringify(ids),
      wtp_shiny_dex: JSON.stringify([1]),
    });
    await page.click('#hub-tasks-btn');
    await expect(page.locator('.task-done')).toHaveCount(2);
    await expect(page.locator('#tasks-count')).toHaveText('2 / 17 completed');
  });
});

test.describe('hub card badge', () => {
  test('shows completion count on hub card', async ({ page }) => {
    await openApp(page, {
      wtp_tasks: JSON.stringify({ seen_10: 1000, shiny_1: 2000, score_100: 3000 }),
      wtp_seen_dex: JSON.stringify(Array.from({ length: 10 }, (_, i) => i + 1)),
      wtp_shiny_dex: JSON.stringify([1]),
      wtp_best_score: '100',
    });
    await expect(page.locator('#hub-tasks-desc')).toHaveText('3 / 17 completed');
  });

  test('updates count when returning to hub after a game', async ({ page }) => {
    const ids = Array.from({ length: 9 }, (_, i) => i + 1);
    await openApp(page, { wtp_seen_dex: JSON.stringify(ids) });
    await expect(page.locator('#hub-tasks-desc')).toHaveText('0 / 17 completed');
    await startWhosThat(page, { rounds: 10 });
    await answer(page, { correct: false });
    await page.evaluate(() => endGame());
    await page.evaluate(() => showScreen('hub-screen'));
    await expect(page.locator('#hub-tasks-desc')).toHaveText('1 / 17 completed');
  });
});
