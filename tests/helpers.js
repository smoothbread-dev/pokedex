const { expect } = require('@playwright/test');

// 1x1 transparent PNG, used to satisfy every remote sprite request.
const BLANK_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

const STUB_STATS = {
  stats: [
    { stat: { name: 'hp' }, base_stat: 45 },
    { stat: { name: 'attack' }, base_stat: 49 },
    { stat: { name: 'defense' }, base_stat: 49 },
    { stat: { name: 'special-attack' }, base_stat: 65 },
    { stat: { name: 'special-defense' }, base_stat: 65 },
    { stat: { name: 'speed' }, base_stat: 45 },
  ],
};

const LS_KEYS = [
  'wtp_best_score',
  'wtp_seen_dex',
  'wtp_caught_dex',
  'wtp_shiny_dex',
  'wtp_dex_settings',
  'wtp_items',
  'wtp_completion_badges',
  'pokedex_audio_settings',
];

/**
 * Keeps the suite offline and deterministic: sprites and cries resolve
 * instantly, PokeAPI stats return a fixed payload.
 */
async function stubNetwork(page) {
  await page.route('**raw.githubusercontent.com/**', route =>
    route.fulfill({ status: 200, contentType: 'image/png', body: BLANK_PNG })
  );
  await page.route('**pokeapi.co/**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(STUB_STATS) })
  );
}

/**
 * Loads the app with a clean, known storage state.
 * Audio is off by default so tests do not trip the speech synthesis engine.
 * The seed runs once per context so page.reload() can verify persistence.
 */
async function openApp(page, storage = {}) {
  await stubNetwork(page);
  const initial = { pokedex_audio_settings: JSON.stringify({ sound: false }), ...storage };
  await page.addInitScript(state => {
    if (sessionStorage.getItem('__seeded')) return;
    sessionStorage.setItem('__seeded', '1');
    localStorage.clear();
    for (const [key, value] of Object.entries(state)) localStorage.setItem(key, value);
  }, initial);
  await page.goto('/');
  await expect(page.locator('#hub-screen')).toHaveClass(/active/);
}

function activeScreen(page) {
  return page.evaluate(() => document.querySelector('.screen.active').id);
}

function readStorage(page, key) {
  return page.evaluate(k => localStorage.getItem(k), key);
}

function readJson(page, key) {
  return page.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), key);
}

/** Starts Who's That Pokemon from the hub with the given settings. */
async function startWhosThat(page, { difficulty = 'easy', rounds } = {}) {
  await page.click('#hub-game-btn');
  if (rounds) await page.click(`.round-btn[data-rounds="${rounds}"]`);
  await page.click(`.diff-btn[data-diff="${difficulty}"]`);
  await page.click('#start-btn');
  await expect(page.locator('#game-screen')).toHaveClass(/active/);
  await waitForRound(page);
}

/** Waits until a round is accepting input. */
function waitForRound(page) {
  return page.waitForFunction(() => roundActive === true);
}

function currentPokemon(page) {
  return page.evaluate(() => ({ id: current.id, name: current.name, display: displayName(current.name) }));
}

/** Answers the current round by clicking a choice button. */
async function answer(page, { correct = true } = {}) {
  await page.evaluate(right => {
    const target = displayName(current.name);
    const buttons = [...document.querySelectorAll('#choices .choice-btn')];
    const btn = right
      ? buttons.find(b => b.textContent === target)
      : buttons.find(b => b.textContent !== target && !b.disabled);
    btn.click();
  }, correct);
}

/** Answers and waits for the next round (or the end screen) to settle. */
async function answerAndAdvance(page, options) {
  await answer(page, options);
  await page.waitForFunction(() => roundActive === false);
}

/** Forces the round timer to expire instead of answering. */
async function timeoutRound(page) {
  await page.evaluate(() => { timeLeft = 0.1; });
  await page.waitForFunction(() => roundActive === false);
}

/** Marks the round in progress as a shiny encounter. */
function forceShiny(page) {
  return page.evaluate(() => { currentShiny = true; });
}

/** Starts a fresh round that is guaranteed to be a shiny encounter. */
function startShinyRound(page) {
  return page.evaluate(() => {
    const random = Math.random;
    Math.random = () => 0; // forces Math.random() < SHINY_RATE inside nextRound
    try { nextRound(); } finally { Math.random = random; }
  });
}

async function startTypeQuiz(page, { mode = 'type', rounds = 10 } = {}) {
  await page.click('#hub-typequiz-btn');
  await page.click(`.tq-mode-btn[data-mode="${mode}"]`);
  await page.click(`.tq-round-btn[data-rounds="${rounds}"]`);
  await page.click('#tq-start-btn');
  await expect(page.locator('#tq-screen')).toHaveClass(/active/);
  await page.waitForFunction(() => tqRoundActive === true);
}

/**
 * Answers the current Type Quiz round.
 * The round's correct answer is a closure local, so it is re-derived from the
 * type chart: on weakness rounds exactly one option is a 2x weakness.
 */
async function answerTypeQuiz(page, { correct = true } = {}) {
  await page.evaluate(right => {
    const typeStr = TYPES[tqCurrent.id - 1] || 'Normal';
    const wk = computeWeaknesses(typeStr);
    const weakList = Object.keys(wk).filter(t => wk[t] >= 2);
    const buttons = [...document.querySelectorAll('#tq-choices .tq-choice-btn')];
    const correctBtn = tqRoundIsWeakness
      ? buttons.find(b => weakList.includes(b.dataset.type))
      : buttons.find(b => b.dataset.type === typeStr);
    const btn = right ? correctBtn : buttons.find(b => b !== correctBtn);
    btn.click();
  }, correct);
  await page.waitForFunction(() => tqRoundActive === false);
}

async function openPokedex(page) {
  await page.click('#hub-dex-btn');
  await expect(page.locator('#pokedex-screen')).toHaveClass(/active/);
}

async function openSettings(page) {
  await page.click('#hub-settings-btn');
  await expect(page.locator('#settings-screen')).toHaveClass(/active/);
}

module.exports = {
  LS_KEYS,
  openApp,
  stubNetwork,
  activeScreen,
  readStorage,
  readJson,
  startWhosThat,
  waitForRound,
  currentPokemon,
  answer,
  answerAndAdvance,
  timeoutRound,
  forceShiny,
  startShinyRound,
  startTypeQuiz,
  answerTypeQuiz,
  openPokedex,
  openSettings,
};
