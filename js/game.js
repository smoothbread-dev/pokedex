// ── Game state
let queue = [], current = null, score = 0, streak = 0, bestStreak = 0;
let correct = 0, answered = 0;
let timerInterval = null, advanceTimeout = null, timeLeft = 0, timerSecs = 10;
let difficulty = 'normal';
let roundActive = false, paused = false;
let roundCount = 25;
let hintUsed = false;
let missedPokemon = [];

const LS_KEY = 'wtp_best_score';
let allTimeBest = parseInt(localStorage.getItem(LS_KEY) || '0', 10);
document.getElementById('best-val').textContent = allTimeBest;

// ── Items
const ITEMS_LS_KEY = 'wtp_items';
const ITEM_CAP = 3;
let items = { unseen_lure: 0, uncaught_lure: 0, shiny_charm: 0 };
try { Object.assign(items, JSON.parse(localStorage.getItem(ITEMS_LS_KEY) || '{}')); } catch (e) {}
let activeItem = null;

// ── Play streak
const STREAK_LS_KEY = 'wtp_streak';
let playStreak = { count: 0, lastDate: '' };
try { Object.assign(playStreak, JSON.parse(localStorage.getItem(STREAK_LS_KEY) || '{}')); } catch (e) {}

function saveStreak() {
  try { localStorage.setItem(STREAK_LS_KEY, JSON.stringify(playStreak)); } catch (e) {}
}

// ── Pokémon of the Day
const POTD_LS_KEY = 'wtp_potd_claimed';
let potdCorrect = false;

function getPokemonOfTheDay() {
  const str = new Date().toDateString();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  const idx = ((hash % POKEMON.length) + POKEMON.length) % POKEMON.length;
  return { name: POKEMON[idx], id: idx + 1 };
}

function dropItems(mode, grade) {
  const drops = { unseen_lure: 0, uncaught_lure: 0, shiny_charm: 0 };
  if (mode === 'wtp') {
    let lures = 0;
    if (difficulty === 'easy') lures = 1;
    else if (difficulty === 'normal') lures = Math.random() < 0.3 ? 2 : 1;
    else if (difficulty === 'hard') lures = 2;
    if (potdCorrect) {
      const today = new Date().toDateString();
      let claimed;
      try { claimed = localStorage.getItem(POTD_LS_KEY); } catch (e) {}
      if (claimed !== today) {
        lures *= 2;
        try { localStorage.setItem(POTD_LS_KEY, today); } catch (e) {}
      }
    }
    const half = Math.floor(lures / 2);
    const remainder = lures - half * 2;
    drops.unseen_lure = half + remainder;
    drops.uncaught_lure = half;
  } else if (mode === 'tq') {
    if (tqTotal < 20) return drops;
    if (grade === 'S') {
      const guaranteed = tqTotal >= 40;
      if (items.shiny_charm < ITEM_CAP && (guaranteed || Math.random() < 0.5)) drops.shiny_charm = 1;
    } else if (grade === 'A') {
      drops.unseen_lure = 1;
    }
  }
  Object.keys(drops).forEach(k => {
    items[k] = Math.min(ITEM_CAP, items[k] + drops[k]);
  });
  saveItems();
  return drops;
}

function saveItems() {
  try { localStorage.setItem(ITEMS_LS_KEY, JSON.stringify(items)); } catch (e) {}
}

function updateStreak() {
  const today = new Date().toISOString().slice(0, 10);
  if (playStreak.lastDate === today) return null;

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  playStreak.count = playStreak.lastDate === yesterday ? playStreak.count + 1 : 1;
  playStreak.lastDate = today;
  saveStreak();

  const milestones = { 3: 'lure', 7: 'charm', 14: 'topup' };
  const milestone = milestones[playStreak.count];
  if (!milestone) return null;

  if (milestone === 'lure') {
    items.unseen_lure = Math.min(ITEM_CAP, items.unseen_lure + 1);
    items.uncaught_lure = Math.min(ITEM_CAP, items.uncaught_lure + 1);
    saveItems();
    return '\u{1F525} 3-day streak! +1 Unseen Lure, +1 Uncaught Lure';
  }
  if (milestone === 'charm') {
    items.shiny_charm = Math.min(ITEM_CAP, items.shiny_charm + 1);
    saveItems();
    return '\u{1F525} 7-day streak! +1 Shiny Charm';
  }
  if (milestone === 'topup') {
    items.unseen_lure = ITEM_CAP;
    items.uncaught_lure = ITEM_CAP;
    items.shiny_charm = ITEM_CAP;
    saveItems();
    return '\u{1F525} 14-day streak! All items topped up!';
  }
  return null;
}

const ITEM_META = {
  unseen_lure:   { icon: '🔭', name: 'Unseen Lure',   desc: '60% of rounds will be Pokémon you haven\'t seen yet', source: 'Who\'s That Pokémon — all difficulties' },
  uncaught_lure: { icon: '🎣', name: 'Uncaught Lure', desc: '60% of rounds will be Pokémon you haven\'t caught yet', source: 'Who\'s That Pokémon — all difficulties' },
  shiny_charm:   { icon: '✨', name: 'Shiny Charm',    desc: 'Shiny rate → 1/32 for one game (1/16 with Gen I badge)', source: 'Type Quiz — Grade S (20+ rounds)' },
};

// ── Completion badges
const BADGES_LS_KEY = 'wtp_completion_badges';
let completionBadges = {};
try { completionBadges = JSON.parse(localStorage.getItem(BADGES_LS_KEY) || '{}'); } catch (e) {}

// ── Shiny dex
const SHINY_LS_KEY = 'wtp_shiny_dex';
let shinyDex = new Set();
try { shinyDex = new Set(JSON.parse(localStorage.getItem(SHINY_LS_KEY) || '[]')); } catch (e) {}
let currentShiny = false;

function registerShiny(id) {
  if (shinyDex.has(id)) return false;
  shinyDex.add(id);
  try { localStorage.setItem(SHINY_LS_KEY, JSON.stringify([...shinyDex])); } catch (e) {}
  return true;
}

// ── Caught dex (correctly named at least once)
const CAUGHT_LS_KEY = 'wtp_caught_dex';
let caughtDex = new Set();
try { caughtDex = new Set(JSON.parse(localStorage.getItem(CAUGHT_LS_KEY) || '[]')); } catch (e) {}

function registerCaught(id) {
  if (caughtDex.has(id)) return false;
  caughtDex.add(id);
  try { localStorage.setItem(CAUGHT_LS_KEY, JSON.stringify([...caughtDex])); } catch (e) {}
  return true;
}

// ── Seen dex (shown in any round, named or not)
const SEEN_LS_KEY = 'wtp_seen_dex';
let seenDex = new Set();
try { seenDex = new Set(JSON.parse(localStorage.getItem(SEEN_LS_KEY) || '[]')); } catch (e) {}
// Anything already named counts as seen, for players whose progress predates seen-tracking.
caughtDex.forEach(id => seenDex.add(id));

function registerSeen(id) {
  if (seenDex.has(id)) return false;
  seenDex.add(id);
  try { localStorage.setItem(SEEN_LS_KEY, JSON.stringify([...seenDex])); } catch (e) {}
  return true;
}

// ── Pokédex display settings
const DEX_LS_KEY = 'wtp_dex_settings';
const dexSettings = { discovery: true };
try { Object.assign(dexSettings, JSON.parse(localStorage.getItem(DEX_LS_KEY) || '{}')); } catch (e) {}

function saveDexSettings() {
  try { localStorage.setItem(DEX_LS_KEY, JSON.stringify(dexSettings)); } catch (e) {}
}

function isHidden(id) { return dexSettings.discovery && !seenDex.has(id); }

// ── Type quiz state
let tqQueue = [], tqCurrent = null, tqScore = 0, tqCorrect = 0, tqTotal = 20;
let tqRoundActive = false;
let tqRoundIsWeakness = false;
let tqMode = 'mixed';
let tqReview = [];
let tqReviewFilter = 'wrong';
let tqAdvanceTimeout = null, tqPendingAction = null, tqPendingDelay = 0, tqPausedRoundActive = false;

function tqSchedule(fn, ms) {
  clearTimeout(tqAdvanceTimeout);
  tqPendingAction = fn;
  tqPendingDelay = ms;
  tqAdvanceTimeout = setTimeout(() => { tqPendingAction = null; fn(); }, ms);
}

function tqClearPending() {
  clearTimeout(tqAdvanceTimeout);
  tqPendingAction = null;
}

const GEN1_TYPES = ['Normal','Fire','Water','Electric','Grass','Ice',
  'Fighting','Poison','Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon'];

// ── Utilities
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getMultiplier() { return streak >= 10 ? 3 : streak >= 5 ? 2 : 1; }
function normalise(str) { return str.toLowerCase().trim().replace(/[^a-z0-9\-]/g, ''); }

function isCorrect(guess) {
  const g = normalise(guess);
  if (g === normalise(current.name)) return true;
  const alts = ALIASES[current.name] || [];
  return alts.some(a => normalise(a) === g);
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'hub-screen') { renderPotdHub(); renderStreakHub(); }
}

function updateStats() {
  document.getElementById('score-val').textContent = score;
  document.getElementById('streak-val').textContent = streak;
  document.getElementById('best-val').textContent = allTimeBest;
  const mult = getMultiplier();
  const badge = document.getElementById('mult-badge');
  badge.style.display = mult > 1 ? 'inline' : 'none';
  badge.textContent = 'x' + mult;
}

function hintBtnLabel() {
  const cost = DIFF[difficulty].hintCost;
  return cost === 0 ? 'Hint (free)' : 'Hint (-' + cost + ' pts)';
}

function useHint() {
  if (hintUsed || !roundActive || paused || !current) return;
  hintUsed = true;
  const cost = DIFF[difficulty].hintCost;
  if (cost > 0) { score -= cost; updateStats(); }
  if (difficulty === 'hard') {
    const container = document.getElementById('choices');
    const wrong = [...container.querySelectorAll('.choice-btn')]
      .filter(b => b.textContent !== displayName(current.name) && !b.disabled);
    if (wrong.length) {
      const target = wrong[Math.floor(Math.random() * wrong.length)];
      target.disabled = true;
      target.classList.add('eliminated');
    }
  } else {
    const type   = TYPES[current.id - 1] || '?';
    const letter = displayName(current.name)[0].toUpperCase();
    document.getElementById('hint-text').textContent = 'Type: ' + type + '  |  First letter: ' + letter;
  }
  const btn = document.getElementById('hint-btn');
  btn.disabled = true;
  btn.textContent = cost === 0 ? 'Hint used' : 'Hint used (-' + cost + ' pts)';
}

// Between-round waits are re-armable so pausing works outside an active round.
let pendingAction = null, pendingDelay = 0, pendingReady = true, pendingDeadline = 0;

function runPending() {
  const fn = pendingAction;
  clearPending();
  if (fn) fn();
}

function schedulePending(fn, ms) {
  clearTimeout(advanceTimeout);
  pendingAction = fn;
  pendingDelay = ms;
  pendingReady = true;
  pendingDeadline = Date.now() + ms;
  advanceTimeout = setTimeout(runPending, ms);
}

function schedulePendingAfter(fn, ms, waitForReady) {
  clearPending();
  pendingAction = fn;
  pendingDelay = ms;
  pendingReady = false;
  pendingDeadline = Date.now() + ms;
  try {
    waitForReady(() => {
      if (!pendingAction) return;
      pendingReady = true;
      if (!paused) {
        const remaining = Math.max(0, pendingDeadline - Date.now());
        advanceTimeout = setTimeout(runPending, remaining);
      }
    });
  } catch (e) {
    schedulePending(fn, ms);
  }
}

function clearPending() {
  clearTimeout(advanceTimeout);
  pendingAction = null;
  pendingReady = true;
  pendingDeadline = 0;
}

function getShinyRate() {
  if (activeItem === 'shiny_charm' && completionBadges.gen1) return 1 / 16;
  if (activeItem === 'shiny_charm') return 1 / 32;
  if (completionBadges.gen1) return 1 / 64;
  return 1 / 128;
}

function checkCompletionBadge(silent) {
  if (completionBadges.gen1) return;
  const allCaught = POKEMON.every((_, i) => caughtDex.has(i + 1));
  if (!allCaught) return;
  completionBadges.gen1 = true;
  try { localStorage.setItem(BADGES_LS_KEY, JSON.stringify(completionBadges)); } catch (e) {}
  if (!silent) showToast('🏆 Gen I badge earned! Shiny rate → 1/64 permanently.');
  renderItemsScreen();
}

function buildQueue(count) {
  const all = POKEMON.map((name, i) => ({ name, id: i + 1 }));
  if (activeItem === 'unseen_lure' || activeItem === 'uncaught_lure') {
    const dex = activeItem === 'unseen_lure' ? seenDex : caughtDex;
    const priority = shuffle(all.filter(p => !dex.has(p.id)));
    const rest     = shuffle(all.filter(p =>  dex.has(p.id)));
    const n = Math.min(priority.length, Math.floor(count * 0.6));
    return shuffle([...priority.slice(0, n), ...rest.slice(0, count - n)]);
  }
  return shuffle(all).slice(0, count);
}

function renderActiveItemRow() {
  const row = document.getElementById('active-item-row');
  if (!row) return;
  if (activeItem) {
    const meta = ITEM_META[activeItem];
    row.textContent = meta.icon + ' ' + meta.name + ' equipped';
  } else {
    row.innerHTML = 'None — <button id="go-to-items-btn" class="link-btn">choose in Item Bag →</button>';
    const goBtn = document.getElementById('go-to-items-btn');
    if (goBtn) goBtn.addEventListener('click', () => showScreen('items-screen'));
  }
}

function setActiveItem(id) {
  activeItem = activeItem === id ? null : id;
  renderItemsScreen();
  renderActiveItemRow();
}

function renderItemsScreen() {
  const list = document.getElementById('items-list');
  if (!list) return;
  list.innerHTML = '';
  Object.entries(ITEM_META).forEach(([id, meta]) => {
    const count = items[id] || 0;
    const isEquipped = activeItem === id;
    const row = document.createElement('div');
    row.className = 'item-row' + (isEquipped ? ' equipped' : '');
    const equip = document.createElement('button');
    equip.className = 'equip-btn' + (isEquipped ? ' equipped' : '');
    equip.textContent = isEquipped ? 'Unequip' : 'Equip';
    if (count === 0 && !isEquipped) equip.disabled = true;
    equip.addEventListener('click', () => setActiveItem(id));
    row.innerHTML = `
      <div class="item-icon">${meta.icon}</div>
      <div class="item-info">
        <div class="item-name">${meta.name}</div>
        <div class="item-desc">${meta.desc}</div>
        <div class="item-source">${meta.source}</div>
      </div>
      <div class="item-count">${count} / ${ITEM_CAP}</div>
    `;
    row.appendChild(equip);
    list.appendChild(row);
  });

  const badgeEl = document.getElementById('badge-gen1');
  if (badgeEl) {
    if (completionBadges.gen1) {
      badgeEl.className = 'badge-earned';
      badgeEl.innerHTML = '🏆 Gen I — Pokémon Master<br><small>Shiny rate: 1/64 (1/16 with Shiny Charm)</small>';
    } else {
      badgeEl.className = 'badge-placeholder';
      badgeEl.textContent = 'Catch all 151 Pokémon to earn the Gen I badge';
    }
  }
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 3000);
}

function startGame() {
  score = 0; streak = 0; bestStreak = 0; correct = 0; answered = 0; paused = false;
  missedPokemon = [];
  potdCorrect = false;
  timerSecs = DIFF[difficulty].timer;
  clearPending();

  if (activeItem && (items[activeItem] || 0) > 0) {
    items[activeItem] = Math.max(0, items[activeItem] - 1);
    saveItems();
  } else {
    activeItem = null;
  }
  queue = buildQueue(roundCount);

  updateStats();
  showScreen('game-screen');
  const itemPill = document.getElementById('game-active-item');
  if (activeItem) {
    const m = ITEM_META[activeItem];
    itemPill.textContent = m.icon + ' ' + m.name + ' active';
  } else {
    itemPill.textContent = '';
  }
  nextRound();
}

function nextRound() {
  if (queue.length === 0) { endGame(); return; }
  current = queue.pop();

  clearPending();
  answered++;
  roundActive = true;
  paused = false;
  hintUsed = false;
  currentShiny = Math.random() < getShinyRate();
  document.getElementById('shiny-badge').style.display = 'none';

  const sil = document.getElementById('pokemon-sil');
  const art = document.getElementById('pokemon-art');
  // Hide both layers immediately; show sil only once new image loads
  sil.style.transition = 'none';
  art.style.transition = 'none';
  sil.style.opacity = '0';
  art.style.opacity = '0';
  void sil.offsetHeight;
  sil.onload = () => {
    sil.style.opacity = '1';
    requestAnimationFrame(() => { sil.style.transition = ''; });
  };
  const pixelFallback = () => (currentShiny ? SPRITE_URL_SHINY(current.id) : SPRITE_URL(current.id));
  sil.onerror = () => { sil.onerror = null; sil.src = pixelFallback(); };
  art.onerror = () => { art.onerror = null; art.src = pixelFallback(); };
  sil.src = currentShiny ? SPRITE_SHOWDOWN_SHINY(current.id) : SPRITE_SHOWDOWN(current.id);
  art.src = currentShiny ? SPRITE_OFFICIAL_SHINY(current.id) : SPRITE_OFFICIAL(current.id);
  requestAnimationFrame(() => { art.style.transition = ''; });

  document.getElementById('feedback').textContent = '';
  document.getElementById('feedback').className = '';

  document.getElementById('progress-label').textContent =
    (roundCount - queue.length) + ' / ' + roundCount;

  const hintBtn = document.getElementById('hint-btn');
  hintBtn.disabled = false;
  hintBtn.textContent = hintBtnLabel();
  const hintText = document.getElementById('hint-text');
  if (difficulty === 'easy') {
    hintText.textContent = 'First letter: ' + displayName(current.name)[0].toUpperCase();
  } else {
    hintText.textContent = '';
  }

  document.getElementById('type-area').style.display = 'none';
  if (difficulty === 'hard') {
    buildHardChoices();
  } else {
    buildChoices();
  }
  document.getElementById('choices').style.display = 'grid';

  startTimer();
  setTimeout(() => announceQuestion(), 150);
}

function startTimer() {
  clearInterval(timerInterval);
  timeLeft = timerSecs;
  updateTimerBar();
  resumeTimer();
}

function resumeTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft -= 0.1;
    updateTimerBar();
    if (timeLeft <= 0) { clearInterval(timerInterval); onTimeout(); }
  }, 100);
}

function updateTimerBar() {
  const bar = document.getElementById('timer-bar');
  const pct = Math.max(0, timeLeft / timerSecs * 100);
  bar.style.width = pct + '%';
  bar.style.background = pct > 50 ? '#f5c842' : pct > 25 ? '#e67e22' : '#e74c3c';
}

function onTimeout() {
  if (!roundActive) return;
  revealAnswer(false);
}

function togglePause() {
  if (!roundActive && !pendingAction) return;
  paused = !paused;
  if (paused) {
    clearInterval(timerInterval);
    clearTimeout(advanceTimeout);
    document.getElementById('pause-overlay').classList.add('active');
  } else {
    document.getElementById('pause-overlay').classList.remove('active');
    if (roundActive) resumeTimer();
    if (pendingAction && pendingReady) {
      const remaining = Math.max(0, pendingDeadline - Date.now());
      advanceTimeout = setTimeout(runPending, remaining || pendingDelay);
    }
  }
}

function goToMainMenu() {
  clearInterval(timerInterval);
  clearPending();
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  paused = false;
  roundActive = false;
  activeItem = null;
  document.getElementById('game-active-item').textContent = '';
  document.getElementById('pause-overlay').classList.remove('active');
  showScreen('hub-screen');
}

function submitAnswer() {
  if (!roundActive || paused) return;
  const guess = document.getElementById('answer-input').value;
  if (!guess.trim()) return;
  clearInterval(timerInterval);
  revealAnswer(isCorrect(guess), guess.trim());
}

function buildChoices() {
  const pool = POKEMON.filter(n => n !== current.name);
  shuffle(pool);
  const options = shuffle([current.name, ...pool.slice(0, 3)]);
  const container = document.getElementById('choices');
  container.innerHTML = '';
  options.forEach(name => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = displayName(name);
    btn.addEventListener('click', () => {
      if (!roundActive || paused) return;
      clearInterval(timerInterval);
      const isRight = name === current.name;
      container.querySelectorAll('.choice-btn').forEach(b => {
        b.disabled = true;
        if (b.textContent === displayName(current.name)) b.classList.add('correct-ans');
        else if (b === btn && !isRight) b.classList.add('wrong-ans');
      });
      revealAnswer(isRight, displayName(name));
    });
    container.appendChild(btn);
  });
}

function pickDistractors(correctId) {
  const primaryType = (TYPES[correctId - 1] || '').split('/')[0];
  const all = shuffle(
    POKEMON.map((name, i) => ({ name, id: i + 1 })).filter(p => p.id !== correctId)
  );
  const sameType = all.filter(p => (TYPES[p.id - 1] || '').startsWith(primaryType));
  const others   = all.filter(p => !(TYPES[p.id - 1] || '').startsWith(primaryType));
  return [...sameType, ...others].slice(0, 3);
}

function buildHardChoices() {
  const distractors = pickDistractors(current.id);
  const options = shuffle([{ name: current.name, id: current.id }, ...distractors]);
  const container = document.getElementById('choices');
  container.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = displayName(opt.name);
    btn.addEventListener('click', () => {
      if (!roundActive || paused) return;
      clearInterval(timerInterval);
      const isRight = opt.id === current.id;
      container.querySelectorAll('.choice-btn').forEach(b => {
        b.disabled = true;
        if (b.textContent === displayName(current.name)) b.classList.add('correct-ans');
        else if (b === btn && !isRight) b.classList.add('wrong-ans');
      });
      revealAnswer(isRight, displayName(opt.name));
    });
    container.appendChild(btn);
  });
}

function revealAnswer(wasCorrect, guessText) {
  roundActive = false;
  clearInterval(timerInterval);

  document.getElementById('pokemon-sil').style.opacity = '0';
  document.getElementById('pokemon-art').style.opacity = '1';
  document.getElementById('answer-input').disabled = true;
  document.getElementById('submit-btn').disabled = true;
  document.getElementById('hint-btn').disabled = true;

  const capturedId = current.id, capturedName = current.name, capturedShiny = currentShiny;
  registerSeen(capturedId);

  if (capturedShiny) document.getElementById('shiny-badge').style.display = 'block';

  const fb = document.getElementById('feedback');
  if (wasCorrect) {
    const mult  = getMultiplier();
    const bonus = timeLeft >= (timerSecs - 3);
    const base  = 10 + (bonus ? 5 : 0);
    const pts   = base * mult;
    const familiar = caughtDex.has(capturedId);
    score += pts + (familiar ? 5 : 0);
    streak++;
    correct++;
    if (streak > bestStreak) bestStreak = streak;
    registerCaught(capturedId);
    if (capturedId === getPokemonOfTheDay().id) potdCorrect = true;
    let msg = 'Correct! +' + pts;
    if (bonus && mult > 1) msg += ' (speed + x' + mult + ' streak!)';
    else if (bonus)        msg += ' (speed bonus!)';
    else if (mult > 1)     msg += ' (x' + mult + ' streak!)';
    if (familiar) msg += ' +5 familiarity!';
    if (capturedShiny) msg += registerShiny(capturedId) ? ' ✨ Shiny registered!' : ' ✨ Shiny (already caught)';
    fb.textContent = msg;
    fb.className = 'correct';
  } else {
    streak = 0;
    missedPokemon.push({ id: capturedId, name: capturedName, guess: guessText || '', shiny: capturedShiny });
    fb.textContent = "It's " + displayName(capturedName) + '!';
    fb.className = 'wrong';

  }

  updateStats();
  schedulePendingAfter(nextRound, 3000,
    done => announceReveal(capturedName, () => playCry(capturedId, done)));
}

function endGame() {
  clearInterval(timerInterval);
  clearPending();
  roundActive = false;
  paused = false;
  document.getElementById('pause-overlay').classList.remove('active');

  const isNewBest = score > allTimeBest;
  if (isNewBest) {
    allTimeBest = score;
    localStorage.setItem(LS_KEY, allTimeBest);
    document.getElementById('best-val').textContent = allTimeBest;
  }

  const totalRounds = roundCount;
  const accuracy = totalRounds > 0 ? Math.round(correct / totalRounds * 100) : 0;
  document.getElementById('grade').textContent =
    accuracy >= 90 ? 'S' : accuracy >= 70 ? 'A' : accuracy >= 50 ? 'B' : 'C';
  document.getElementById('end-score').textContent = score;
  document.getElementById('end-correct').textContent = correct + ' / ' + totalRounds;
  document.getElementById('end-streak').textContent = bestStreak;
  document.getElementById('end-accuracy').textContent = accuracy + '%';
  document.getElementById('end-best').textContent =
    allTimeBest + (isNewBest && score > 0 ? '  New best!' : '');

  checkCompletionBadge();

  const drops = dropItems('wtp');
  renderDrops(drops, 'end-drops');

  const streakMsg = updateStreak();
  if (streakMsg) {
    const dropsEl = document.getElementById('end-drops');
    dropsEl.style.display = 'block';
    dropsEl.innerHTML += '<div class="drop-item streak-reward">' + streakMsg + '</div>';
  }

  activeItem = null;
  document.getElementById('game-active-item').textContent = '';
  renderMissedGrid();
  showScreen('end-screen');
}

function renderMissedGrid() {
  const section = document.getElementById('missed-section');
  const grid = document.getElementById('missed-grid');
  grid.innerHTML = '';
  if (missedPokemon.length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  missedPokemon.forEach(({ id, name, guess, shiny }) => {
    const typeStr = TYPES[id - 1] || 'Normal';
    const wkMap = computeWeaknesses(typeStr);
    const bigWeaks = Object.keys(wkMap).filter(t => wkMap[t] >= 2);
    const card = document.createElement('div');
    card.className = 'missed-card';
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => openDexModal(id, name, shiny));
    const img = document.createElement('img');
    img.src = shiny ? SPRITE_OFFICIAL_SHINY(id) : SPRITE_OFFICIAL(id);
    img.alt = name;
    img.loading = 'lazy';
    img.onerror = () => { img.src = shiny ? SPRITE_URL_SHINY(id) : SPRITE_URL(id); };
    const idEl = document.createElement('div');
    idEl.className = 'missed-card-id';
    idEl.textContent = '#' + String(id).padStart(3, '0');
    const label = document.createElement('div');
    label.className = 'missed-card-name';
    label.textContent = (shiny ? '✨ ' : '') + displayName(name);
    const typesEl = document.createElement('div');
    typesEl.style.cssText = 'display:flex;flex-wrap:wrap;gap:0.2rem;justify-content:center;margin-top:0.1rem;';
    typeStr.split('/').forEach(t => {
      const sp = document.createElement('span');
      sp.className = 'type-badge type-' + t.toLowerCase();
      sp.textContent = t;
      typesEl.appendChild(sp);
    });
    card.appendChild(img);
    card.appendChild(idEl);
    card.appendChild(label);
    card.appendChild(typesEl);
    if (bigWeaks.length > 0) {
      const weakEl = document.createElement('div');
      weakEl.className = 'missed-card-weak';
      const wkLbl = document.createElement('div');
      wkLbl.style.cssText = 'font-size:0.55rem;color:#aaa;width:100%;text-align:center;margin-top:0.15rem;';
      wkLbl.textContent = 'Weak to:';
      weakEl.appendChild(wkLbl);
      const wkBadges = document.createElement('div');
      wkBadges.style.cssText = 'display:flex;flex-wrap:wrap;gap:0.2rem;justify-content:center;';
      bigWeaks.forEach(t => {
        const sp = document.createElement('span');
        sp.className = 'type-badge type-' + t.toLowerCase();
        sp.textContent = t;
        wkBadges.appendChild(sp);
      });
      weakEl.appendChild(wkBadges);
      card.appendChild(weakEl);
    }
    if (guess) {
      const guessEl = document.createElement('div');
      guessEl.className = 'missed-card-guess';
      guessEl.textContent = 'You said: ' + guess;
      card.appendChild(guessEl);
    }
    grid.appendChild(card);
  });
}

function renderDrops(drops, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const parts = [];
  if (drops.unseen_lure > 0)   parts.push(ITEM_META.unseen_lure.icon + ' ' + ITEM_META.unseen_lure.name + ' ×' + drops.unseen_lure);
  if (drops.uncaught_lure > 0) parts.push(ITEM_META.uncaught_lure.icon + ' ' + ITEM_META.uncaught_lure.name + ' ×' + drops.uncaught_lure);
  if (drops.shiny_charm > 0)   parts.push(ITEM_META.shiny_charm.icon + ' ' + ITEM_META.shiny_charm.name + ' ×' + drops.shiny_charm);
  if (parts.length === 0) {
    el.style.display = 'none';
    return;
  }
  el.style.display = 'block';
  el.innerHTML = '<div class="drops-label">Items earned</div>' +
    parts.map(p => '<div class="drop-item">' + p + '</div>').join('');
}

function renderPotdHub() {
  const el = document.getElementById('potd-slot');
  if (!el) return;
  const potd = getPokemonOfTheDay();
  const img = el.querySelector('.potd-img');
  const label = el.querySelector('.potd-name');
  img.src = SPRITE_SHOWDOWN(potd.id);
  img.onerror = () => { img.src = SPRITE_URL(potd.id); img.onerror = null; };
  label.textContent = displayName(potd.name);
  let claimed;
  try { claimed = localStorage.getItem(POTD_LS_KEY); } catch (e) {}
  const today = new Date().toDateString();
  el.querySelector('.potd-status').textContent = claimed === today ? 'Claimed today!' : 'Name it for double lures!';
}

function renderStreakHub() {
  const el = document.getElementById('streak-slot');
  if (!el) return;
  if (playStreak.count > 0) {
    el.style.display = 'flex';
    document.getElementById('streak-count').textContent = playStreak.count;
    const nextEl = document.getElementById('streak-next');
    if (nextEl) {
      const milestones = [
        { day: 3, label: '3 days → +1 Unseen Lure, +1 Uncaught Lure' },
        { day: 7, label: '7 days → +1 Shiny Charm' },
        { day: 14, label: '14 days → All items topped up' },
      ];
      const next = milestones.find(m => m.day > playStreak.count);
      nextEl.textContent = next ? 'Next: ' + next.label : 'All milestones reached!';
    }
  } else {
    el.style.display = 'none';
  }
}

// ── Pokédex modal
let activeDexId = null;
let modalShiny = false;
const statsCache = new Map();

function updateModalArtwork() {
  document.getElementById('modal-artwork').src =
    modalShiny ? SPRITE_OFFICIAL_SHINY(activeDexId) : SPRITE_OFFICIAL(activeDexId);
  const btn = document.getElementById('modal-shiny-btn');
  btn.classList.toggle('on', modalShiny);
  btn.setAttribute('aria-pressed', modalShiny ? 'true' : 'false');
  btn.textContent = modalShiny ? '✨ Shiny' : '✨ Normal';
  document.getElementById('modal-shiny-caught').style.display =
    shinyDex.has(activeDexId) ? '' : 'none';
  document.getElementById('modal-caught').style.display =
    caughtDex.has(activeDexId) ? '' : 'none';
}

function openDexModal(id, name, showShiny = false) {
  const modal = document.getElementById('dex-modal');
  const typeStr = TYPES[id - 1] || 'Normal';
  const locked = isHidden(id);
  // showShiny comes from the missed grid, where you just encountered the shiny yourself.
  const shinyLocked = dexSettings.discovery && !shinyDex.has(id) && !showShiny;

  activeDexId = id;
  modalShiny = showShiny;
  document.getElementById('modal-artwork').alt = locked ? 'Unknown' : name;
  document.getElementById('modal-artwork').classList.toggle('silhouette', locked);
  document.getElementById('modal-locked').style.display = locked ? '' : 'none';
  document.getElementById('modal-shiny-locked').style.display = (!locked && shinyLocked) ? '' : 'none';
  document.getElementById('modal-shiny-btn').style.display = (locked || shinyLocked) ? 'none' : '';
  document.getElementById('modal-tabs').style.display = locked ? 'none' : '';
  updateModalArtwork();
  document.getElementById('modal-name').textContent = locked ? '???' : displayName(name);
  document.getElementById('modal-id').textContent = '#' + String(id).padStart(3, '0');

  const typesEl = document.getElementById('modal-types');
  typesEl.innerHTML = '';
  if (locked) {
    modal.classList.add('open');
    document.getElementById('modal-tab-weaknesses').style.display = 'none';
    document.getElementById('modal-tab-stats').style.display = 'none';
    return;
  }
  typeStr.split('/').forEach(t => {
    const span = document.createElement('span');
    span.className = 'type-badge type-' + t.toLowerCase();
    span.textContent = t;
    typesEl.appendChild(span);
  });

  // Reset tabs to Weaknesses (default first tab)
  document.querySelectorAll('.modal-tab').forEach(btn => btn.classList.remove('active'));
  document.querySelector('.modal-tab[data-tab="weaknesses"]').classList.add('active');
  document.getElementById('modal-tab-weaknesses').style.display = '';
  document.getElementById('modal-tab-stats').style.display = 'none';

  // Tab click listeners (re-bind each open to avoid stale closures)
  document.querySelectorAll('.modal-tab').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.modal-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      document.getElementById('modal-tab-stats').style.display = tab === 'stats' ? '' : 'none';
      document.getElementById('modal-tab-weaknesses').style.display = tab === 'weaknesses' ? '' : 'none';
    };
  });

  // Populate weakness tab
  const wkMap = computeWeaknesses(typeStr);
  const groups = { 'weak-4x': 4, 'weak-2x': 2, 'weak-half': 0.5, 'weak-quarter': 0.25, 'weak-0x': 0 };
  Object.entries(groups).forEach(([gid, mult]) => {
    const group = document.getElementById(gid);
    const badgesEl = group.querySelector('.wk-badges');
    badgesEl.innerHTML = '';
    const matches = Object.keys(wkMap).filter(t => wkMap[t] === mult);
    if (matches.length) {
      matches.forEach(t => {
        const span = document.createElement('span');
        span.className = 'type-badge type-' + t.toLowerCase();
        span.textContent = t;
        badgesEl.appendChild(span);
      });
      group.style.display = 'flex';
    } else {
      group.style.display = 'none';
    }
  });

  document.getElementById('modal-stats').style.display = 'none';
  document.getElementById('modal-loading').style.display = 'block';
  document.getElementById('modal-cry-btn').onclick = () => playCry(id);

  modal.classList.add('open');

  fetchStats(id).then(stats => {
    if (activeDexId !== id) return;
    renderModalStats(stats);
  });
}

function closeDexModal() {
  document.getElementById('dex-modal').classList.remove('open');
  activeDexId = null;
}

async function fetchStats(id) {
  if (statsCache.has(id)) return statsCache.get(id);
  try {
    const res = await fetch('https://pokeapi.co/api/v2/pokemon/' + id);
    const data = await res.json();
    const stats = {};
    data.stats.forEach(s => { stats[s.stat.name] = s.base_stat; });
    statsCache.set(id, stats);
    return stats;
  } catch (e) {
    return null;
  }
}

const STAT_LABELS = { hp: 'HP', attack: 'Atk', defense: 'Def',
  'special-attack': 'SpA', 'special-defense': 'SpD', speed: 'Spd' };
const STAT_COLORS = { hp: '#e74c3c', attack: '#e67e22', defense: '#f5c842',
  'special-attack': '#9b59b6', 'special-defense': '#27ae60', speed: '#3498db' };

function renderModalStats(stats) {
  document.getElementById('modal-loading').style.display = 'none';
  const container = document.getElementById('modal-stats');
  container.innerHTML = '';
  if (!stats) {
    container.innerHTML = '<div style="color:#aaa;font-size:0.8rem;text-align:center;">Stats unavailable</div>';
    container.style.display = '';
    return;
  }
  Object.entries(STAT_LABELS).forEach(([key, label]) => {
    const val = stats[key] || 0;
    const row = document.createElement('div');
    row.className = 'modal-stat-row';
    row.innerHTML =
      '<div class="modal-stat-label">' + label + '</div>' +
      '<div class="modal-stat-bar-wrap"><div class="modal-stat-bar" style="width:0%;background:' + STAT_COLORS[key] + '"></div></div>' +
      '<div class="modal-stat-val">' + val + '</div>';
    container.appendChild(row);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        row.querySelector('.modal-stat-bar').style.width = Math.min(100, val / 255 * 100) + '%';
      });
    });
  });
  container.style.display = '';
}

// ── Pokédex listing
function buildPokedex() {
  const grid = document.getElementById('pokedex-grid');
  if (grid.children.length > 0) return;

  const filterBar = document.getElementById('pokedex-filter');
  const allBtn = document.createElement('button');
  allBtn.className = 'type-filter-btn selected';
  allBtn.textContent = 'All';
  allBtn.addEventListener('click', () => applyDexFilter('all', allBtn));
  filterBar.appendChild(allBtn);
  GEN1_TYPES.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'type-filter-btn type-badge type-' + t.toLowerCase();
    btn.textContent = t;
    btn.addEventListener('click', () => applyDexFilter(t, btn));
    filterBar.appendChild(btn);
  });

  POKEMON.forEach((name, i) => {
    const id = i + 1;
    const typeStr = TYPES[id - 1] || '';
    const card = document.createElement('div');
    card.className = 'dex-card';
    card.dataset.types = typeStr;
    card.dataset.nameLower = name.toLowerCase();
    card.dataset.id = id;
    card.dataset.name = name;
    card.title = displayName(name);

    const img = document.createElement('img');
    img.src = SPRITE_URL(id);
    img.alt = name;
    img.loading = 'lazy';

    const mark = document.createElement('span');
    mark.className = 'dex-shiny-mark';
    mark.textContent = '✨';
    mark.title = 'Shiny registered';

    const check = document.createElement('span');
    check.className = 'dex-caught-mark';
    check.textContent = '✓';
    check.title = 'Correctly named';

    const nameEl = document.createElement('div');
    nameEl.className = 'dex-card-name';
    nameEl.textContent = displayName(name);

    const idEl = document.createElement('div');
    idEl.className = 'dex-card-id';
    idEl.textContent = '#' + String(id).padStart(3, '0');

    const typeEl = document.createElement('div');
    typeEl.className = 'dex-card-type';
    typeStr.split('/').forEach(t => {
      const span = document.createElement('span');
      span.className = 'type-badge type-' + t.toLowerCase();
      span.textContent = t;
      typeEl.appendChild(span);
    });

    card.appendChild(img);
    card.appendChild(mark);
    card.appendChild(check);
    card.appendChild(nameEl);
    card.appendChild(idEl);
    card.appendChild(typeEl);
    card.addEventListener('click', () => openDexModal(id, name));
    grid.appendChild(card);
  });
}

function refreshDexMarks() {
  document.querySelectorAll('#pokedex-grid .dex-card').forEach(card => {
    const cardId = parseInt(card.dataset.id, 10);
    const hidden = isHidden(cardId);
    card.classList.toggle('unseen', hidden);
    card.classList.toggle('has-shiny', !hidden && shinyDex.has(cardId));
    card.classList.toggle('caught', !hidden && caughtDex.has(cardId));
    const label = hidden ? '???' : displayName(card.dataset.name);
    card.querySelector('.dex-card-name').textContent = label;
    card.title = label;
  });
  document.getElementById('dex-progress').textContent =
    '👁 ' + seenDex.size + ' / ' + POKEMON.length + ' seen  ·  ✓ ' +
    caughtDex.size + ' named  ·  ✨ ' + shinyDex.size + ' shiny';
}

let dexFilterType = 'all';

function applyDexFilter(filter, clickedBtn) {
  dexFilterType = filter;
  document.querySelectorAll('.type-filter-btn').forEach(b => b.classList.remove('selected'));
  clickedBtn.classList.add('selected');
  applyDexSearch();
}

function applyDexSearch() {
  const query = (document.getElementById('dex-search').value || '').toLowerCase().trim();
  document.querySelectorAll('#pokedex-grid .dex-card').forEach(card => {
    // Unseen entries must not be findable by name or type, or discovery mode leaks answers.
    const unseen = card.classList.contains('unseen');
    const typeMatch = dexFilterType === 'all' || (!unseen && card.dataset.types.includes(dexFilterType));
    const nameMatch = !query || (!unseen && card.dataset.nameLower.includes(query));
    card.style.display = (typeMatch && nameMatch) ? '' : 'none';
  });
}

// ── Type Quiz
function startTypeQuiz() {
  tqClearPending();
  const all = shuffle(POKEMON.map((name, i) => ({ name, id: i + 1 })));
  tqQueue = all.slice(0, tqTotal);
  tqScore = 0; tqCorrect = 0; tqRoundActive = false; tqReview = [];
  document.getElementById('tq-score-val').textContent = 0;
  document.getElementById('tq-question-label').textContent = '';
  showScreen('tq-screen');
  nextTypeRound();
}

const GEN1_TYPE_POOL = [...new Set(TYPES)];

function makeTqTypeBadges(typeStr, btn) {
  typeStr.split('/').forEach(t => {
    const span = document.createElement('span');
    span.className = 'type-badge type-' + t.toLowerCase();
    span.textContent = t;
    btn.appendChild(span);
  });
}

function nextTypeRound() {
  if (tqQueue.length === 0) { endTypeQuiz(); return; }
  tqCurrent = tqQueue.pop();
  tqRoundActive = true;
  registerSeen(tqCurrent.id);

  const tqImg = document.getElementById('tq-img');
  tqImg.style.opacity = '0';
  tqImg.onload = () => { tqImg.style.opacity = '1'; };
  tqImg.onerror = () => { tqImg.src = SPRITE_URL(tqCurrent.id); tqImg.onerror = null; };
  tqImg.src = SPRITE_SHOWDOWN(tqCurrent.id);
  document.getElementById('tq-name').textContent = displayName(tqCurrent.name);
  document.getElementById('tq-feedback').textContent = '';
  document.getElementById('tq-feedback').className = '';
  document.getElementById('tq-progress').textContent =
    (tqTotal - tqQueue.length) + ' / ' + tqTotal;

  const typeStr = TYPES[tqCurrent.id - 1] || 'Normal';
  const wkMap = computeWeaknesses(typeStr);
  const weakList = Object.keys(wkMap).filter(t => wkMap[t] >= 2);

  if (tqMode === 'weakness') {
    tqRoundIsWeakness = true;
  } else if (tqMode === 'type') {
    tqRoundIsWeakness = false;
  } else {
    tqRoundIsWeakness = weakList.length > 0 && Math.random() < 0.5;
  }

  let correctType, wrongPool, feedbackMsg;
  if (tqRoundIsWeakness) {
    correctType = weakList.length > 0
      ? weakList[Math.floor(Math.random() * weakList.length)]
      : typeStr;
    wrongPool = ALL_ATTACK_TYPES.filter(t => !weakList.includes(t));
    document.getElementById('tq-question-label').textContent = 'Weak to?';
    const weakDisplay = weakList.length > 0 ? weakList.join(', ') : 'nothing notable';
    feedbackMsg = displayName(tqCurrent.name) + ' is ' + typeStr + ' type. Weak to: ' + weakDisplay + '.';
  } else {
    correctType = typeStr;
    wrongPool = GEN1_TYPE_POOL.filter(t => t !== correctType);
    document.getElementById('tq-question-label').textContent = 'What type?';
    feedbackMsg = displayName(tqCurrent.name) + ' is ' + correctType + ' type!';
  }
  shuffle(wrongPool);
  const options = shuffle([correctType, ...wrongPool.slice(0, 3)]);

  const container = document.getElementById('tq-choices');
  container.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'tq-choice-btn';
    btn.dataset.type = opt;
    makeTqTypeBadges(opt, btn);
    btn.addEventListener('click', () => {
      if (!tqRoundActive) return;
      tqRoundActive = false;
      const isRight = opt === correctType;
      container.querySelectorAll('.tq-choice-btn').forEach(b => {
        b.disabled = true;
        if (b.dataset.type === correctType) b.classList.add('correct-ans');
        else if (b === btn && !isRight) b.classList.add('wrong-ans');
      });
      const fb = document.getElementById('tq-feedback');
      if (isRight) {
        tqScore += 10; tqCorrect++;
        if (tqRoundIsWeakness) {
          const weakDisplay = weakList.join(', ');
          fb.textContent = 'Correct! +10 — ' + displayName(tqCurrent.name) + ' is ' + typeStr + ' type. Weak to: ' + weakDisplay + '.';
        } else {
          fb.textContent = 'Correct! +10';
        }
        fb.className = 'correct';
      } else {
        fb.textContent = feedbackMsg;
        fb.className = 'wrong';
      }
      document.getElementById('tq-score-val').textContent = tqScore;
      tqReview.push({ id: tqCurrent.id, name: tqCurrent.name, typeStr: typeStr, questionWasWeakness: tqRoundIsWeakness, correctType: correctType, playerChoice: opt, wasCorrect: isRight });
      playCry(tqCurrent.id);
      tqSchedule(nextTypeRound, 2500);
    });
    container.appendChild(btn);
  });
}

function toggleTqPause() {
  const overlay = document.getElementById('tq-pause-overlay');
  if (overlay.classList.contains('active')) {
    overlay.classList.remove('active');
    tqRoundActive = tqPausedRoundActive;
    if (tqPendingAction) {
      tqAdvanceTimeout = setTimeout(() => { const fn = tqPendingAction; tqPendingAction = null; fn(); }, tqPendingDelay);
    }
  } else {
    overlay.classList.add('active');
    tqPausedRoundActive = tqRoundActive;
    tqRoundActive = false;
    clearTimeout(tqAdvanceTimeout);
  }
}

function tqGoToMainMenu() {
  tqClearPending();
  tqRoundActive = false;
  document.getElementById('tq-pause-overlay').classList.remove('active');
  showScreen('hub-screen');
}

function endTypeQuiz() {
  tqClearPending();
  const accuracy = Math.round(tqCorrect / tqTotal * 100);
  const grade = accuracy >= 90 ? 'S' : accuracy >= 70 ? 'A' : accuracy >= 50 ? 'B' : 'C';
  document.getElementById('tqe-score').textContent = tqScore;
  document.getElementById('tqe-correct').textContent = tqCorrect + ' / ' + tqTotal;
  document.getElementById('tqe-accuracy').textContent = accuracy + '%';
  document.getElementById('tqe-grade').textContent = grade;

  const drops = dropItems('tq', grade);
  renderDrops(drops, 'tqe-drops');

  const streakMsg = updateStreak();
  if (streakMsg) {
    const dropsEl = document.getElementById('tqe-drops');
    dropsEl.style.display = 'block';
    dropsEl.innerHTML += '<div class="drop-item streak-reward">' + streakMsg + '</div>';
  }

  renderTqReview();
  showScreen('tq-end-screen');
}
function setTqReviewFilter(filter) {
  tqReviewFilter = filter;
  var wb = document.getElementById('tqr-wrong-btn');
  var ab = document.getElementById('tqr-all-btn');
  if (wb) wb.classList.toggle('selected', filter === 'wrong');
  if (ab) ab.classList.toggle('selected', filter === 'all');
  renderTqReview();
}

function renderTqReview() {
  const section = document.getElementById('tqe-review-section');
  const list = document.getElementById('tq-review-list');
  if (!section || !list) return;
  if (tqReview.length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  const toShow = tqReviewFilter === 'wrong' ? tqReview.filter(r => !r.wasCorrect) : tqReview;
  list.innerHTML = '';
  if (toShow.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:#888;font-size:0.8rem;padding:0.5rem;">All correct!</div>';
    return;
  }
  toShow.forEach(r => {
    const row = document.createElement('div');
    row.className = 'tq-review-row ' + (r.wasCorrect ? 'correct-row' : 'wrong-row');
    row.style.cursor = 'pointer';
    row.addEventListener('click', () => openDexModal(r.id, r.name));
    const img = document.createElement('img');
    img.src = SPRITE_SHOWDOWN(r.id);
    img.alt = r.name;
    img.className = 'tq-review-sprite';
    img.onerror = () => { img.src = SPRITE_URL(r.id); img.onerror = null; };
    const nameEl = document.createElement('div');
    nameEl.className = 'tq-review-name';
    nameEl.textContent = displayName(r.name);
    const badges = document.createElement('div');
    badges.className = 'tq-review-badges';
    const qLabel = document.createElement('span');
    qLabel.className = 'tq-review-q';
    qLabel.textContent = r.questionWasWeakness ? 'Weak to?' : 'Type?';
    badges.appendChild(qLabel);
    const choiceWrap = document.createElement('div');
    choiceWrap.style.cssText = 'display:flex;gap:0.15rem;align-items:center;border-radius:4px;padding:1px;outline:2px solid ' + (r.wasCorrect ? '#27ae60' : '#c0392b') + ';';
    r.playerChoice.split('/').forEach(t => {
      const sp = document.createElement('span');
      sp.className = 'type-badge type-' + t.toLowerCase();
      sp.textContent = t;
      choiceWrap.appendChild(sp);
    });
    badges.appendChild(choiceWrap);
    if (!r.wasCorrect) {
      const arrowEl = document.createElement('span');
      arrowEl.textContent = '→';
      arrowEl.style.cssText = 'font-size:0.7rem;color:#aaa;';
      badges.appendChild(arrowEl);
      const correctWrap = document.createElement('div');
      correctWrap.style.cssText = 'display:flex;gap:0.15rem;align-items:center;';
      r.correctType.split('/').forEach(t => {
        const sp = document.createElement('span');
        sp.className = 'type-badge type-' + t.toLowerCase();
        sp.textContent = t;
        correctWrap.appendChild(sp);
      });
      badges.appendChild(correctWrap);
    }
    row.appendChild(img);
    row.appendChild(nameEl);
    row.appendChild(badges);
    list.appendChild(row);
  });
}

// ── Event listeners
document.getElementById('hub-game-btn').addEventListener('click', () => { renderActiveItemRow(); showScreen('game-settings-screen'); });
document.getElementById('hub-dex-btn').addEventListener('click', () => { buildPokedex(); refreshDexMarks(); showScreen('pokedex-screen'); });
document.getElementById('hub-typequiz-btn').addEventListener('click', () => showScreen('tq-settings-screen'));
document.getElementById('hub-items-btn').addEventListener('click', () => { renderItemsScreen(); showScreen('items-screen'); });
document.getElementById('items-back-btn').addEventListener('click', () => showScreen('hub-screen'));

document.querySelectorAll('.diff-btn').forEach(b => b.addEventListener('click', () => {
  difficulty = b.dataset.diff;
  document.querySelectorAll('.diff-btn').forEach(x => x.classList.toggle('selected', x === b));
}));
document.querySelectorAll('.round-btn').forEach(b => b.addEventListener('click', () => {
  roundCount = parseInt(b.dataset.rounds, 10);
  document.querySelectorAll('.round-btn').forEach(x => x.classList.toggle('selected', x === b));
}));
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('settings-back-btn').addEventListener('click', () => showScreen('hub-screen'));

document.getElementById('submit-btn').addEventListener('click', submitAnswer);
document.getElementById('pause-btn').addEventListener('click', togglePause);
document.getElementById('hint-btn').addEventListener('click', useHint);
document.getElementById('answer-input').addEventListener('keydown', e => { if (e.key === 'Enter') submitAnswer(); });

document.getElementById('resume-btn').addEventListener('click', togglePause);
document.getElementById('pause-menu-btn').addEventListener('click', goToMainMenu);

document.getElementById('play-again-btn').addEventListener('click', startGame);
document.getElementById('main-menu-btn').addEventListener('click', () => showScreen('hub-screen'));

document.getElementById('dex-back-btn').addEventListener('click', () => showScreen('hub-screen'));
document.getElementById('dex-search').addEventListener('input', applyDexSearch);

document.getElementById('dex-help-btn').addEventListener('click', () => {
  document.getElementById('help-modal').classList.add('open');
});
document.getElementById('help-modal-close').addEventListener('click', () => {
  document.getElementById('help-modal').classList.remove('open');
});
document.getElementById('help-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('help-modal')) e.currentTarget.classList.remove('open');
});

document.getElementById('diff-help-btn').addEventListener('click', () =>
  document.getElementById('diff-help-modal').classList.add('open'));
document.getElementById('diff-help-modal-close').addEventListener('click', () =>
  document.getElementById('diff-help-modal').classList.remove('open'));
document.getElementById('diff-help-modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
});

document.getElementById('tq-help-btn').addEventListener('click', () =>
  document.getElementById('tq-help-modal').classList.add('open'));
document.getElementById('tq-help-modal-close').addEventListener('click', () =>
  document.getElementById('tq-help-modal').classList.remove('open'));
document.getElementById('tq-help-modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
});

document.getElementById('dex-modal-close').addEventListener('click', closeDexModal);
document.getElementById('modal-shiny-btn').addEventListener('click', () => {
  modalShiny = !modalShiny;
  updateModalArtwork();
});
document.getElementById('dex-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('dex-modal')) closeDexModal();
});

document.querySelectorAll('.tq-round-btn').forEach(b => b.addEventListener('click', () => {
  tqTotal = parseInt(b.dataset.rounds, 10);
  document.querySelectorAll('.tq-round-btn').forEach(x => x.classList.toggle('selected', x === b));
}));
document.getElementById('tq-start-btn').addEventListener('click', startTypeQuiz);
document.getElementById('tq-settings-back-btn').addEventListener('click', () => showScreen('hub-screen'));

document.getElementById('tqe-play-again-btn').addEventListener('click', startTypeQuiz);
document.getElementById('tqe-menu-btn').addEventListener('click', () => showScreen('hub-screen'));

// ── Site-wide settings
const AUDIO_TOGGLES = [
  { id: 'set-sound', key: 'sound' },
  { id: 'set-voice', key: 'voice' },
  { id: 'set-cries', key: 'cries' },
];

function syncAudioToggles() {
  AUDIO_TOGGLES.forEach(({ id, key }) => {
    const btn = document.getElementById(id);
    const on = !!audioSettings[key];
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-checked', on ? 'true' : 'false');
    if (key !== 'sound') btn.disabled = !audioSettings.sound;
  });
  document.getElementById('audio-suboptions').classList.toggle('disabled', !audioSettings.sound);
  const sel = document.getElementById('set-voice-select');
  sel.disabled = !audioSettings.sound || !audioSettings.voice;
  document.getElementById('voice-test-btn').disabled = sel.disabled;
}

// Called by audio.js whenever the platform voice list resolves (Android populates it late).
function onVoicesLoaded() {
  const sel = document.getElementById('set-voice-select');
  if (!sel) return;
  const list = englishVoices().length ? englishVoices() : voices;
  const auto = pickVoice();
  sel.innerHTML = '';
  const autoOpt = document.createElement('option');
  autoOpt.value = '';
  autoOpt.textContent = auto ? `Auto (${auto.name})` : 'Auto';
  sel.appendChild(autoOpt);
  list.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.voiceURI;
    opt.textContent = `${v.name} — ${v.lang}`;
    sel.appendChild(opt);
  });
  sel.value = list.some(v => v.voiceURI === audioSettings.voiceURI) ? audioSettings.voiceURI : '';
}

AUDIO_TOGGLES.forEach(({ id, key }) => {
  document.getElementById(id).addEventListener('click', () => {
    audioSettings[key] = !audioSettings[key];
    saveAudioSettings();
    if (!audioSettings.sound && window.speechSynthesis) window.speechSynthesis.cancel();
    syncAudioToggles();
  });
});

document.getElementById('set-voice-select').addEventListener('change', e => {
  audioSettings.voiceURI = e.target.value;
  saveAudioSettings();
});
document.getElementById('voice-test-btn').addEventListener('click', () => speak("Who's that Pokémon!", 0.78, 0.78));

const discoveryBtn = document.getElementById('set-discovery');
function syncDiscoveryToggle() {
  discoveryBtn.classList.toggle('on', dexSettings.discovery);
  discoveryBtn.setAttribute('aria-checked', dexSettings.discovery ? 'true' : 'false');
}
discoveryBtn.addEventListener('click', () => {
  dexSettings.discovery = !dexSettings.discovery;
  saveDexSettings();
  syncDiscoveryToggle();
  refreshDexMarks();
  applyDexSearch();
});
syncDiscoveryToggle();

onVoicesLoaded();
syncAudioToggles();

// Retroactive badge award for players who caught all 151 before this feature shipped.
checkCompletionBadge(true);

document.getElementById('hub-settings-btn').addEventListener('click', () => showScreen('settings-screen'));
document.getElementById('global-settings-back-btn').addEventListener('click', () => showScreen('hub-screen'));

renderPotdHub();
renderStreakHub();
