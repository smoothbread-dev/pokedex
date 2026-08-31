const { test, expect } = require('@playwright/test');
const { openApp, activeScreen } = require('./helpers');

test.beforeEach(async ({ page }) => openApp(page));

test('hub shows the five sections', async ({ page }) => {
  await expect(page.locator('.hub-card')).toHaveCount(5);
  await expect(page.locator('#hub-game-btn')).toContainText("Who's That?");
  await expect(page.locator('#hub-typequiz-btn')).toContainText('Type Quiz');
  await expect(page.locator('#hub-dex-btn')).toContainText('Pokédex');
  await expect(page.locator('#hub-settings-btn')).toContainText('Settings');
  await expect(page.locator('#hub-items-btn')).toContainText('Item Bag');
});

test('exactly one screen is active at a time', async ({ page }) => {
  await page.click('#hub-dex-btn');
  await expect(page.locator('.screen.active')).toHaveCount(1);
});

const routes = [
  { name: "Who's That settings", open: '#hub-game-btn', screen: 'game-settings-screen', back: '#settings-back-btn' },
  { name: 'Type Quiz settings', open: '#hub-typequiz-btn', screen: 'tq-settings-screen', back: '#tq-settings-back-btn' },
  { name: 'Pokédex', open: '#hub-dex-btn', screen: 'pokedex-screen', back: '#dex-back-btn' },
  { name: 'Settings', open: '#hub-settings-btn', screen: 'settings-screen', back: '#global-settings-back-btn' },
  { name: 'Item Bag', open: '#hub-items-btn', screen: 'items-screen', back: '#items-back-btn' },
];

for (const route of routes) {
  test(`${route.name} opens and returns to the hub`, async ({ page }) => {
    await page.click(route.open);
    expect(await activeScreen(page)).toBe(route.screen);
    await page.click(route.back);
    expect(await activeScreen(page)).toBe('hub-screen');
  });
}

test('difficulty help button opens and closes the info modal', async ({ page }) => {
  await page.click('#hub-game-btn');
  await page.click('#diff-help-btn');
  await expect(page.locator('#diff-help-modal')).toHaveClass(/open/);
  await page.click('#diff-help-modal-close');
  await expect(page.locator('#diff-help-modal')).not.toHaveClass(/open/);
});

test('difficulty help modal closes on backdrop click', async ({ page }) => {
  await page.click('#hub-game-btn');
  await page.click('#diff-help-btn');
  await expect(page.locator('#diff-help-modal')).toHaveClass(/open/);
  await page.locator('#diff-help-modal').click({ position: { x: 5, y: 5 } });
  await expect(page.locator('#diff-help-modal')).not.toHaveClass(/open/);
});

test('type quiz help button opens and closes the rewards modal', async ({ page }) => {
  await page.click('#hub-typequiz-btn');
  await page.click('#tq-help-btn');
  await expect(page.locator('#tq-help-modal')).toHaveClass(/open/);
  await page.click('#tq-help-modal-close');
  await expect(page.locator('#tq-help-modal')).not.toHaveClass(/open/);
});

test('type quiz help modal closes on backdrop click', async ({ page }) => {
  await page.click('#hub-typequiz-btn');
  await page.click('#tq-help-btn');
  await expect(page.locator('#tq-help-modal')).toHaveClass(/open/);
  await page.locator('#tq-help-modal').click({ position: { x: 5, y: 5 } });
  await expect(page.locator('#tq-help-modal')).not.toHaveClass(/open/);
});
