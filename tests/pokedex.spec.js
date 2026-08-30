const { test, expect } = require('@playwright/test');
const { openApp, openPokedex } = require('./helpers');

const ALL_SEEN = JSON.stringify(Array.from({ length: 151 }, (_, i) => i + 1));

test.describe('grid', () => {
  test('renders all 151 entries', async ({ page }) => {
    await openApp(page);
    await openPokedex(page);
    await expect(page.locator('#pokedex-grid .dex-card')).toHaveCount(151);
  });

  test('shows a type filter for every Gen 1 type plus All', async ({ page }) => {
    await openApp(page);
    await openPokedex(page);
    await expect(page.locator('#pokedex-filter .type-filter-btn')).toHaveCount(16);
  });
});

test.describe('discovery mode on (default)', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page, { wtp_seen_dex: JSON.stringify([1, 4]) });
    await openPokedex(page);
  });

  test('unseen entries are silhouetted and unnamed', async ({ page }) => {
    const bulbasaur = page.locator('#pokedex-grid .dex-card[data-id="1"]');
    const mewtwo = page.locator('#pokedex-grid .dex-card[data-id="150"]');
    await expect(bulbasaur).not.toHaveClass(/unseen/);
    await expect(bulbasaur.locator('.dex-card-name')).toHaveText('Bulbasaur');
    await expect(mewtwo).toHaveClass(/unseen/);
    await expect(mewtwo.locator('.dex-card-name')).toHaveText('???');
  });

  test('search only matches seen entries', async ({ page }) => {
    await page.fill('#dex-search', 'mewtwo');
    await expect(page.locator('#pokedex-grid .dex-card:visible')).toHaveCount(0);
    await page.fill('#dex-search', 'bulbasaur');
    await expect(page.locator('#pokedex-grid .dex-card:visible')).toHaveCount(1);
  });

  test('type filtering excludes unseen entries', async ({ page }) => {
    await page.click('.type-filter-btn.type-psychic');
    // Mewtwo, Mew, Abra line etc are Psychic but unseen, so nothing shows.
    await expect(page.locator('#pokedex-grid .dex-card:visible')).toHaveCount(0);
  });

  test('an unseen entry opens as a locked card', async ({ page }) => {
    await page.click('#pokedex-grid .dex-card[data-id="150"]');
    await expect(page.locator('#dex-modal')).toHaveClass(/open/);
    await expect(page.locator('#modal-name')).toHaveText('???');
    await expect(page.locator('#modal-id')).toHaveText('#150');
    await expect(page.locator('#modal-locked')).toBeVisible();
    await expect(page.locator('#modal-tabs')).toBeHidden();
    await expect(page.locator('#modal-shiny-btn')).toBeHidden();
  });

  test('a seen entry opens with full details', async ({ page }) => {
    await page.click('#pokedex-grid .dex-card[data-id="1"]');
    await expect(page.locator('#modal-name')).toHaveText('Bulbasaur');
    await expect(page.locator('#modal-locked')).toBeHidden();
    await expect(page.locator('#modal-tabs')).toBeVisible();
    await expect(page.locator('#modal-types .type-badge')).toHaveCount(2);
  });
});

test.describe('discovery mode off', () => {
  test('every entry is browsable and searchable', async ({ page }) => {
    await openApp(page, { wtp_dex_settings: JSON.stringify({ discovery: false }) });
    await openPokedex(page);
    await expect(page.locator('#pokedex-grid .dex-card.unseen')).toHaveCount(0);
    await page.fill('#dex-search', 'mewtwo');
    await expect(page.locator('#pokedex-grid .dex-card:visible')).toHaveCount(1);
  });
});

test.describe('detail modal', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page, { wtp_seen_dex: ALL_SEEN });
    await openPokedex(page);
    await page.click('#pokedex-grid .dex-card[data-id="6"]');
    await expect(page.locator('#dex-modal')).toHaveClass(/open/);
  });

  test('defaults to the weaknesses tab and lists multipliers', async ({ page }) => {
    await expect(page.locator('.modal-tab[data-tab="weaknesses"]')).toHaveClass(/active/);
    await expect(page.locator('#modal-tab-weaknesses')).toBeVisible();
    // Charizard is Fire/Flying: 4x Rock.
    await expect(page.locator('#weak-4x')).toBeVisible();
    await expect(page.locator('#weak-4x .wk-badges')).toContainText('Rock');
  });

  test('the stats tab loads base stats', async ({ page }) => {
    await page.click('.modal-tab[data-tab="stats"]');
    await expect(page.locator('#modal-tab-stats')).toBeVisible();
    await expect(page.locator('#modal-stats .modal-stat-row')).toHaveCount(6);
    await expect(page.locator('#modal-loading')).toBeHidden();
  });

  test('closes via the close button and the backdrop', async ({ page }) => {
    await page.click('#dex-modal-close');
    await expect(page.locator('#dex-modal')).not.toHaveClass(/open/);
    await page.click('#pokedex-grid .dex-card[data-id="6"]');
    await page.locator('#dex-modal').click({ position: { x: 5, y: 5 } });
    await expect(page.locator('#dex-modal')).not.toHaveClass(/open/);
  });
});

test.describe('shiny gating', () => {
  test('the toggle is hidden until the shiny is found', async ({ page }) => {
    await openApp(page, { wtp_seen_dex: ALL_SEEN });
    await openPokedex(page);
    await page.click('#pokedex-grid .dex-card[data-id="6"]');
    await expect(page.locator('#modal-shiny-btn')).toBeHidden();
    await expect(page.locator('#modal-shiny-locked')).toBeVisible();
  });

  test('a registered shiny unlocks the toggle and swaps the artwork', async ({ page }) => {
    await openApp(page, { wtp_seen_dex: ALL_SEEN, wtp_shiny_dex: JSON.stringify([6]) });
    await openPokedex(page);
    await page.click('#pokedex-grid .dex-card[data-id="6"]');
    await expect(page.locator('#modal-shiny-btn')).toBeVisible();
    await expect(page.locator('#modal-shiny-caught')).toBeVisible();
    await expect(page.locator('#modal-artwork')).not.toHaveAttribute('src', /shiny/);
    await page.click('#modal-shiny-btn');
    await expect(page.locator('#modal-artwork')).toHaveAttribute('src', /official-artwork\/shiny/);
    await expect(page.locator('#modal-shiny-btn')).toHaveClass(/on/);
    await page.click('#modal-shiny-btn');
    await expect(page.locator('#modal-artwork')).not.toHaveAttribute('src', /shiny/);
  });

  test('discovery mode off exposes the toggle for everything', async ({ page }) => {
    await openApp(page, { wtp_dex_settings: JSON.stringify({ discovery: false }) });
    await openPokedex(page);
    await page.click('#pokedex-grid .dex-card[data-id="6"]');
    await expect(page.locator('#modal-shiny-btn')).toBeVisible();
  });
});

test.describe('help', () => {
  test('opens the legend and closes again', async ({ page }) => {
    await openApp(page);
    await openPokedex(page);
    await page.click('#dex-help-btn');
    await expect(page.locator('#help-modal')).toHaveClass(/open/);
    await expect(page.locator('#help-modal')).toContainText('Seen');
    await expect(page.locator('#help-modal')).toContainText('Named');
    await expect(page.locator('#help-modal')).toContainText('Shiny');
    await expect(page.locator('#help-modal .help-table tbody tr')).toHaveCount(5);
    await page.click('#help-modal-close');
    await expect(page.locator('#help-modal')).not.toHaveClass(/open/);
  });
});
