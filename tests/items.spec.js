const { test, expect } = require('@playwright/test');
const { openApp, startWhosThat, waitForRound, activeScreen, answer, answerAndAdvance } = require('./helpers');

test.describe('items screen navigation', () => {
  test.beforeEach(async ({ page }) => openApp(page));

  test('opens from the Item Bag hub card and returns', async ({ page }) => {
    await page.click('#hub-items-btn');
    expect(await activeScreen(page)).toBe('items-screen');
    await page.click('#items-back-btn');
    expect(await activeScreen(page)).toBe('hub-screen');
  });

  test('shows all three items even when counts are zero', async ({ page }) => {
    await page.click('#hub-items-btn');
    await expect(page.locator('.item-row')).toHaveCount(3);
  });

  test('item count shows count / cap format', async ({ page }) => {
    await page.click('#hub-items-btn');
    await expect(page.locator('.item-count').first()).toHaveText('0 / 3');
  });
});

test.describe('item equipping', () => {
  test.beforeEach(async ({ page }) => openApp(page, {
    wtp_items: JSON.stringify({ unseen_lure: 1, uncaught_lure: 1, shiny_charm: 1 }),
  }));

  test('Equip sets the active item and toggling unequips it', async ({ page }) => {
    await page.click('#hub-items-btn');
    await page.locator('.equip-btn').first().click();
    expect(await page.evaluate(() => activeItem)).toBe('unseen_lure');
    await expect(page.locator('.equip-btn').first()).toHaveText('Unequip');
    await page.locator('.equip-btn').first().click();
    expect(await page.evaluate(() => activeItem)).toBeNull();
  });

  test('equipping a second item replaces the first', async ({ page }) => {
    await page.click('#hub-items-btn');
    await page.locator('.equip-btn').first().click();
    await page.locator('.equip-btn').nth(1).click();
    expect(await page.evaluate(() => activeItem)).toBe('uncaught_lure');
  });

  test('equipped item appears in game settings active item row', async ({ page }) => {
    await page.click('#hub-items-btn');
    await page.locator('.equip-btn').first().click();
    await page.click('#items-back-btn');
    await page.click('#hub-game-btn');
    await expect(page.locator('#active-item-row')).toContainText('Unseen Lure');
  });
});

test.describe('zero-count items', () => {
  test.beforeEach(async ({ page }) => openApp(page, {
    wtp_items: JSON.stringify({ unseen_lure: 0, uncaught_lure: 0, shiny_charm: 0 }),
  }));

  test('cannot be equipped when count is zero', async ({ page }) => {
    await page.click('#hub-items-btn');
    const btns = page.locator('.equip-btn');
    for (let i = 0; i < 3; i++) {
      await expect(btns.nth(i)).toBeDisabled();
    }
  });
});

test.describe('item consumption', () => {
  test.beforeEach(async ({ page }) => openApp(page, {
    wtp_items: JSON.stringify({ unseen_lure: 2, uncaught_lure: 0, shiny_charm: 0 }),
  }));

  test('item count decrements by 1 when a game starts', async ({ page }) => {
    await page.click('#hub-items-btn');
    await page.locator('.equip-btn').first().click();
    await page.click('#items-back-btn');
    await startWhosThat(page, { rounds: 10 });
    const stored = JSON.parse(await page.evaluate(() => localStorage.getItem('wtp_items')));
    expect(stored.unseen_lure).toBe(1);
  });

  test('item count persists across reload', async ({ page }) => {
    await page.click('#hub-items-btn');
    await page.locator('.equip-btn').first().click();
    await page.click('#items-back-btn');
    await startWhosThat(page, { rounds: 10 });
    await page.reload();
    const stored = JSON.parse(await page.evaluate(() => localStorage.getItem('wtp_items')));
    expect(stored.unseen_lure).toBe(1);
  });
});

test.describe('shiny rate', () => {
  test.beforeEach(async ({ page }) => openApp(page, {
    wtp_items: JSON.stringify({ unseen_lure: 0, uncaught_lure: 0, shiny_charm: 1 }),
  }));

  test('getShinyRate returns 1/128 with no active item', async ({ page }) => {
    const rate = await page.evaluate(() => getShinyRate());
    expect(rate).toBeCloseTo(1 / 128);
  });

  test('getShinyRate returns 1/32 when Shiny Charm is active during a game', async ({ page }) => {
    await page.click('#hub-items-btn');
    await page.locator('.equip-btn').nth(2).click();
    await page.click('#items-back-btn');
    await startWhosThat(page, { rounds: 10 });
    const rate = await page.evaluate(() => getShinyRate());
    expect(rate).toBeCloseTo(1 / 32);
  });

  test('shiny rate resets to 1/128 after game ends', async ({ page }) => {
    await page.click('#hub-items-btn');
    await page.locator('.equip-btn').nth(2).click();
    await page.click('#items-back-btn');
    await startWhosThat(page, { rounds: 10 });
    await page.evaluate(() => endGame());
    const rate = await page.evaluate(() => getShinyRate());
    expect(rate).toBeCloseTo(1 / 128);
  });
});

test.describe('completion badge', () => {
  const allIds = Array.from({ length: 151 }, (_, i) => i + 1);

  test('badge not awarded when fewer than 151 caught', async ({ page }) => {
    await openApp(page, {
      wtp_caught_dex: JSON.stringify(allIds.slice(0, 150)),
    });
    const badges = JSON.parse(await page.evaluate(() => localStorage.getItem('wtp_completion_badges') || '{}'));
    expect(badges.gen1).toBeFalsy();
  });

  test('badge awarded retroactively at init when all 151 are caught', async ({ page }) => {
    await openApp(page, {
      wtp_caught_dex: JSON.stringify(allIds),
    });
    const badges = JSON.parse(await page.evaluate(() => localStorage.getItem('wtp_completion_badges') || '{}'));
    expect(badges.gen1).toBe(true);
  });

  test('getShinyRate returns 1/64 when badge is earned with no active item', async ({ page }) => {
    await openApp(page, {
      wtp_caught_dex: JSON.stringify(allIds),
    });
    const rate = await page.evaluate(() => getShinyRate());
    expect(rate).toBeCloseTo(1 / 64);
  });

  test('shiny charm stacks with badge for 1/16 rate', async ({ page }) => {
    await openApp(page, {
      wtp_caught_dex: JSON.stringify(allIds),
      wtp_items: JSON.stringify({ unseen_lure: 0, uncaught_lure: 0, shiny_charm: 1 }),
    });
    await page.click('#hub-items-btn');
    await page.locator('.equip-btn').nth(2).click();
    await page.click('#items-back-btn');
    await startWhosThat(page, { rounds: 10 });
    const rate = await page.evaluate(() => getShinyRate());
    expect(rate).toBeCloseTo(1 / 16);
  });

  test('badge awarded via checkCompletionBadge after final catch', async ({ page }) => {
    await openApp(page, {
      wtp_caught_dex: JSON.stringify(allIds.slice(0, 150)),
    });
    await page.evaluate(() => {
      caughtDex.add(151);
      localStorage.setItem('wtp_caught_dex', JSON.stringify([...caughtDex]));
      checkCompletionBadge();
    });
    const badges = JSON.parse(await page.evaluate(() => localStorage.getItem('wtp_completion_badges') || '{}'));
    expect(badges.gen1).toBe(true);
  });

  test('badge section shows earned state in items screen', async ({ page }) => {
    await openApp(page, {
      wtp_caught_dex: JSON.stringify(allIds),
    });
    await page.click('#hub-items-btn');
    await expect(page.locator('.badge-earned')).toBeVisible();
  });

  test('badge section shows placeholder when not earned', async ({ page }) => {
    await openApp(page);
    await page.click('#hub-items-btn');
    await expect(page.locator('#badge-gen1.badge-placeholder')).toBeVisible();
    await expect(page.locator('#badge-gen1.badge-earned')).toHaveCount(0);
  });
});

test.describe('item bag freshness via settings link', () => {
  test('navigating to items via "choose in Item Bag" link shows updated counts', async ({ page }) => {
    await openApp(page);
    await page.click('#hub-game-btn');
    await page.evaluate(() => {
      items.unseen_lure = 2;
      items.uncaught_lure = 1;
      saveItems();
    });
    await page.click('#go-to-items-btn');
    await expect(page.locator('.item-count').first()).toHaveText('2 / 3');
  });
});
