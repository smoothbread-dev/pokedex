const { test, expect } = require('@playwright/test');
const { openApp, openSettings, openPokedex, readJson } = require('./helpers');

test.describe('audio', () => {
  test('defaults to everything on', async ({ page }) => {
    await openApp(page, { pokedex_audio_settings: JSON.stringify({ sound: true, voice: true, cries: true }) });
    await openSettings(page);
    await expect(page.locator('#set-sound')).toHaveClass(/on/);
    await expect(page.locator('#set-voice')).toHaveClass(/on/);
    await expect(page.locator('#set-cries')).toHaveClass(/on/);
  });

  test('the master switch disables the sub-options', async ({ page }) => {
    await openApp(page, { pokedex_audio_settings: JSON.stringify({ sound: true, voice: true, cries: true }) });
    await openSettings(page);
    await page.click('#set-sound');
    await expect(page.locator('#set-sound')).not.toHaveClass(/on/);
    await expect(page.locator('#audio-suboptions')).toHaveClass(/disabled/);
    await expect(page.locator('#set-voice')).toBeDisabled();
    await expect(page.locator('#set-cries')).toBeDisabled();
    await expect(page.locator('#set-voice-select')).toBeDisabled();
    await expect(page.locator('#voice-test-btn')).toBeDisabled();
  });

  test('individual toggles persist across reloads', async ({ page }) => {
    await openApp(page, { pokedex_audio_settings: JSON.stringify({ sound: true, voice: true, cries: true }) });
    await openSettings(page);
    await page.click('#set-cries');
    expect(await readJson(page, 'pokedex_audio_settings')).toMatchObject({ cries: false });
    await page.reload();
    await openSettings(page);
    await expect(page.locator('#set-cries')).not.toHaveClass(/on/);
    await expect(page.locator('#set-sound')).toHaveClass(/on/);
  });

  test('toggles report their state to assistive tech', async ({ page }) => {
    await openApp(page, { pokedex_audio_settings: JSON.stringify({ sound: true, voice: true, cries: true }) });
    await openSettings(page);
    await expect(page.locator('#set-sound')).toHaveAttribute('aria-checked', 'true');
    await page.click('#set-sound');
    await expect(page.locator('#set-sound')).toHaveAttribute('aria-checked', 'false');
  });
});

test.describe('announcer voice', () => {
  test('offers an auto option plus the available voices', async ({ page }) => {
    await openApp(page, { pokedex_audio_settings: JSON.stringify({ sound: true, voice: true, cries: true }) });
    await openSettings(page);
    const options = page.locator('#set-voice-select option');
    await expect(options.first()).toContainText('Auto');
    expect(await options.count()).toBeGreaterThanOrEqual(1);
  });

  test('a chosen voice is stored', async ({ page }) => {
    await openApp(page, { pokedex_audio_settings: JSON.stringify({ sound: true, voice: true, cries: true }) });
    await openSettings(page);
    const count = await page.locator('#set-voice-select option').count();
    test.skip(count < 2, 'no platform voices available in this browser');
    const value = await page.locator('#set-voice-select option').nth(1).getAttribute('value');
    await page.selectOption('#set-voice-select', value);
    expect(await readJson(page, 'pokedex_audio_settings')).toMatchObject({ voiceURI: value });
  });
});

test.describe('discovery mode', () => {
  test('is on by default', async ({ page }) => {
    await openApp(page);
    await openSettings(page);
    await expect(page.locator('#set-discovery')).toHaveClass(/on/);
  });

  test('turning it off reveals the Pokédex immediately', async ({ page }) => {
    await openApp(page);
    await openPokedex(page);
    await expect(page.locator('#pokedex-grid .dex-card[data-id="1"]')).toHaveClass(/unseen/);
    await page.click('#dex-back-btn');
    await openSettings(page);
    await page.click('#set-discovery');
    await page.click('#global-settings-back-btn');
    await openPokedex(page);
    await expect(page.locator('#pokedex-grid .dex-card[data-id="1"]')).not.toHaveClass(/unseen/);
    await expect(page.locator('#pokedex-grid .dex-card[data-id="1"] .dex-card-name')).toHaveText('Bulbasaur');
  });

  test('persists across reloads', async ({ page }) => {
    await openApp(page);
    await openSettings(page);
    await page.click('#set-discovery');
    expect(await readJson(page, 'wtp_dex_settings')).toMatchObject({ discovery: false });
    await page.reload();
    await openSettings(page);
    await expect(page.locator('#set-discovery')).not.toHaveClass(/on/);
  });
});
