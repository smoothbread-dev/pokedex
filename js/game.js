// ── Game state
let queue = [], current = null, score = 0, streak = 0, bestStreak = 0;
let correct = 0, answered = 0;
let timerInterval = null, advanceTimeout = null, timeLeft = 0, timerSecs = 10;
let difficulty = 'normal';
let roundActive = false, paused = false;
let roundCount = 25;
let hintUsed = false;
let gameMode = 'normal';
let lives = 3;
let taTimeLeft = 60, taInterval = null;
let missedPokemon = [];

const LS_KEY = 'wtp_best_score';
let allTimeBest = parseInt(localStorage.getItem(LS_KEY) || '0', 10);
document.getElementById('best-val').textContent = allTimeBest;

// ── Type quiz state
let tqQueue = [], tqCurrent = null, tqScore = 0, tqCorrect = 0, tqTotal = 20;
let tqRoundActive = false;
let tqRoundIsWeakness = false;
let tqMode = 'mixed';
let tqReview = [];
let tqReviewFilter = 'wrong';

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
  if (hintUsed || !roundActive || !current) return;
  hintUsed = true;
  const cost = DIFF[difficulty].hintCost;
  if (cost > 0) { score -= cost; updateStats(); }
  const type   = TYPES[current.id - 1] || '?';
  const letter = displayName(current.name)[0].toUpperCase();
  document.getElementById('hint-text').textContent = 'Type: ' + type + '  |  First letter: ' + letter;
  const btn = document.getElementById('hint-btn');
  btn.disabled = true;
  btn.textContent = cost === 0 ? 'Hint used' : 'Hint used (-' + cost + ' pts)';
}

// ── Lives UI
function updateLivesUI() {
  const row = document.getElementById('lives-row');
  if (gameMode !== 'lives') { row.style.display = 'none'; return; }
  row.style.display = 'flex';
  for (let i = 1; i <= 3; i++) {
    const span = document.getElementById('life-' + i);
    span.classList.toggle('lost', i > lives);
  }
}

// ── Time Attack clock UI
function updateTAClock() {
  const el = document.getElementById('ta-clock');
  if (gameMode !== 'timeattack') { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.textContent = Math.ceil(taTimeLeft);
  el.classList.toggle('urgent', taTimeLeft <= 10);
}

function startTATimer() {
  clearInterval(taInterval);
  taInterval = setInterval(() => {
    taTimeLeft -= 0.1;
    updateTAClock();
    if (taTimeLeft <= 0) {
      clearInterval(taInterval);
      endGame();
    }
  }, 100);
}

// ── Infinite shuffled pool for time attack
let taPool = [];
function getNextTAPokemon() {
  if (taPool.length === 0) taPool = shuffle(POKEMON.map((name, i) => ({ name, id: i + 1 })));
  return taPool.pop();
}

function startGame() {
  score = 0; streak = 0; bestStreak = 0; correct = 0; answered = 0; paused = false;
  missedPokemon = [];
  timerSecs = DIFF[difficulty].timer;
  clearTimeout(advanceTimeout);

  if (gameMode === 'timeattack') {
    taTimeLeft = 60;
    taPool = [];
    queue = null;
    updateTAClock();
  } else if (gameMode === 'lives') {
    lives = 3;
    queue = shuffle(POKEMON.map((name, i) => ({ name, id: i + 1 }))).slice(0, 151);
    updateLivesUI();
  } else {
    queue = shuffle(POKEMON.map((name, i) => ({ name, id: i + 1 }))).slice(0, roundCount);
  }

  updateStats();
  showScreen('game-screen');

  document.getElementById('timer-bar-wrap').style.display = gameMode === 'timeattack' ? 'none' : '';
  document.getElementById('progress-label').style.display = gameMode === 'timeattack' ? 'none' : '';

  updateLivesUI();
  updateTAClock();

  if (gameMode === 'timeattack') startTATimer();

  nextRound();
}

function nextRound() {
  if (gameMode === 'timeattack') {
    current = getNextTAPokemon();
  } else {
    if (queue.length === 0) { endGame(); return; }
    current = queue.pop();
  }

  clearTimeout(advanceTimeout);
  answered++;
  roundActive = true;
  paused = false;
  hintUsed = false;

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
  sil.src = SPRITE_SHOWDOWN(current.id);
  art.src = SPRITE_OFFICIAL(current.id);
  requestAnimationFrame(() => { art.style.transition = ''; });

  document.getElementById('feedback').textContent = '';
  document.getElementById('feedback').className = '';

  if (gameMode !== 'timeattack' && queue) {
    document.getElementById('progress-label').textContent =
      (roundCount - queue.length) + ' / ' + roundCount;
  }

  const hintBtn = document.getElementById('hint-btn');
  hintBtn.disabled = false;
  hintBtn.textContent = hintBtnLabel();
  const hintText = document.getElementById('hint-text');
  if (difficulty === 'easy') {
    hintText.textContent = 'First letter: ' + displayName(current.name)[0].toUpperCase();
  } else {
    hintText.textContent = '';
  }

  if (difficulty === 'hard') {
    document.getElementById('type-area').style.display = 'flex';
    document.getElementById('choices').style.display = 'none';
    document.getElementById('choices').innerHTML = '';
    const input = document.getElementById('answer-input');
    input.value = '';
    input.disabled = false;
    document.getElementById('submit-btn').disabled = false;
    setTimeout(() => input.focus(), 50);
  } else {
    document.getElementById('type-area').style.display = 'none';
    buildChoices();
    document.getElementById('choices').style.display = 'grid';
  }

  if (gameMode !== 'timeattack') startTimer();
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
  if (!roundActive) return;
  paused = !paused;
  if (paused) {
    clearInterval(timerInterval);
    if (gameMode === 'timeattack') clearInterval(taInterval);
    document.getElementById('pause-overlay').classList.add('active');
  } else {
    document.getElementById('pause-overlay').classList.remove('active');
    if (gameMode === 'timeattack') startTATimer();
    else resumeTimer();
  }
}

function goToMainMenu() {
  clearInterval(timerInterval);
  clearInterval(taInterval);
  clearTimeout(advanceTimeout);
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  paused = false;
  roundActive = false;
  document.getElementById('pause-overlay').classList.remove('active');
  showScreen('hub-screen');
}

function submitAnswer() {
  if (!roundActive) return;
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
      if (!roundActive) return;
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

function revealAnswer(wasCorrect, guessText) {
  roundActive = false;
  clearInterval(timerInterval);

  document.getElementById('pokemon-sil').style.opacity = '0';
  document.getElementById('pokemon-art').style.opacity = '1';
  document.getElementById('answer-input').disabled = true;
  document.getElementById('submit-btn').disabled = true;
  document.getElementById('hint-btn').disabled = true;

  const capturedId = current.id, capturedName = current.name;
  announceReveal(capturedName, () => { if (speechEnabled) playCry(capturedId); });

  const fb = document.getElementById('feedback');
  if (wasCorrect) {
    const mult  = getMultiplier();
    const bonus = gameMode !== 'timeattack' && timeLeft >= (timerSecs - 3);
    const base  = 10 + (bonus ? 5 : 0);
    const pts   = base * mult;
    score += pts;
    streak++;
    correct++;
    if (streak > bestStreak) bestStreak = streak;
    let msg = 'Correct! +' + pts;
    if (bonus && mult > 1) msg += ' (speed + x' + mult + ' streak!)';
    else if (bonus)        msg += ' (speed bonus!)';
    else if (mult > 1)     msg += ' (x' + mult + ' streak!)';
    fb.textContent = msg;
    fb.className = 'correct';
  } else {
    streak = 0;
    missedPokemon.push({ id: capturedId, name: capturedName, guess: guessText || '' });
    fb.textContent = "It's " + displayName(capturedName) + '!';
    fb.className = 'wrong';

    if (gameMode === 'lives') {
      lives--;
      updateLivesUI();
      if (lives <= 0) {
        advanceTimeout = setTimeout(() => endGame(), 1800);
        return;
      }
    }
  }

  updateStats();

  if (gameMode === 'timeattack') {
    advanceTimeout = setTimeout(() => nextRound(), 1800);
  } else {
    advanceTimeout = setTimeout(() => nextRound(), 3000);
  }
}

function endGame() {
  clearInterval(timerInterval);
  clearInterval(taInterval);
  clearTimeout(advanceTimeout);
  roundActive = false;

  const isNewBest = score > allTimeBest;
  if (isNewBest) {
    allTimeBest = score;
    localStorage.setItem(LS_KEY, allTimeBest);
    document.getElementById('best-val').textContent = allTimeBest;
  }

  const totalRounds = gameMode === 'timeattack' ? answered : roundCount;
  const accuracy = totalRounds > 0 ? Math.round(correct / totalRounds * 100) : 0;
  document.getElementById('grade').textContent =
    accuracy >= 90 ? 'S' : accuracy >= 70 ? 'A' : accuracy >= 50 ? 'B' : 'C';
  document.getElementById('end-score').textContent = score;
  document.getElementById('end-correct').textContent = correct + ' / ' + totalRounds;
  document.getElementById('end-streak').textContent = bestStreak;
  document.getElementById('end-accuracy').textContent = accuracy + '%';
  document.getElementById('end-best').textContent =
    allTimeBest + (isNewBest && score > 0 ? '  New best!' : '');

  renderMissedGrid();
  showScreen('end-screen');
}

function renderMissedGrid() {
  const section = document.getElementById('missed-section');
  const grid = document.getElementById('missed-grid');
  grid.innerHTML = '';
  if (missedPokemon.length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  missedPokemon.forEach(({ id, name, guess }) => {
    const typeStr = TYPES[id - 1] || 'Normal';
    const wkMap = computeWeaknesses(typeStr);
    const bigWeaks = Object.keys(wkMap).filter(t => wkMap[t] >= 2);
    const card = document.createElement('div');
    card.className = 'missed-card';
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => openDexModal(id, name));
    const img = document.createElement('img');
    img.src = SPRITE_OFFICIAL(id);
    img.alt = name;
    img.loading = 'lazy';
    img.onerror = () => { img.src = SPRITE_URL(id); };
    const idEl = document.createElement('div');
    idEl.className = 'missed-card-id';
    idEl.textContent = '#' + String(id).padStart(3, '0');
    const label = document.createElement('div');
    label.className = 'missed-card-name';
    label.textContent = displayName(name);
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

// ── Pokédex modal
let activeDexId = null;
const statsCache = new Map();

function openDexModal(id, name) {
  const modal = document.getElementById('dex-modal');
  const typeStr = TYPES[id - 1] || 'Normal';

  document.getElementById('modal-artwork').src = SPRITE_OFFICIAL(id);
  document.getElementById('modal-artwork').alt = name;
  document.getElementById('modal-name').textContent = displayName(name);
  document.getElementById('modal-id').textContent = '#' + String(id).padStart(3, '0');

  const typesEl = document.getElementById('modal-types');
  typesEl.innerHTML = '';
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
  activeDexId = id;

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
    card.title = displayName(name);

    const img = document.createElement('img');
    img.src = SPRITE_URL(id);
    img.alt = name;
    img.loading = 'lazy';

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
    card.appendChild(nameEl);
    card.appendChild(idEl);
    card.appendChild(typeEl);
    card.addEventListener('click', () => openDexModal(id, name));
    grid.appendChild(card);
  });
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
    const typeMatch = dexFilterType === 'all' || card.dataset.types.includes(dexFilterType);
    const nameMatch = !query || card.dataset.nameLower.includes(query);
    card.style.display = (typeMatch && nameMatch) ? '' : 'none';
  });
}

// ── Type Quiz
function startTypeQuiz() {
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
      if (speechEnabled) playCry(tqCurrent.id);
      setTimeout(() => nextTypeRound(), 2500);
    });
    container.appendChild(btn);
  });
}

function toggleTqPause() {
  const overlay = document.getElementById('tq-pause-overlay');
  if (overlay.classList.contains('active')) {
    overlay.classList.remove('active');
    tqRoundActive = true;
  } else {
    overlay.classList.add('active');
    tqRoundActive = false;
  }
}

function tqGoToMainMenu() {
  tqRoundActive = false;
  document.getElementById('tq-pause-overlay').classList.remove('active');
  showScreen('hub-screen');
}

function endTypeQuiz() {
  const accuracy = Math.round(tqCorrect / tqTotal * 100);
  document.getElementById('tqe-score').textContent = tqScore;
  document.getElementById('tqe-correct').textContent = tqCorrect + ' / ' + tqTotal;
  document.getElementById('tqe-accuracy').textContent = accuracy + '%';
  document.getElementById('tqe-grade').textContent =
    accuracy >= 90 ? 'S' : accuracy >= 70 ? 'A' : accuracy >= 50 ? 'B' : 'C';
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
document.getElementById('hub-game-btn').addEventListener('click', () => showScreen('game-settings-screen'));
document.getElementById('hub-dex-btn').addEventListener('click', () => { buildPokedex(); showScreen('pokedex-screen'); });
document.getElementById('hub-typequiz-btn').addEventListener('click', () => showScreen('tq-settings-screen'));

document.querySelectorAll('.mode-btn').forEach(b => b.addEventListener('click', () => {
  gameMode = b.dataset.mode;
  document.querySelectorAll('.mode-btn').forEach(x => x.classList.toggle('selected', x === b));
  document.getElementById('rounds-section').style.display = gameMode === 'timeattack' ? 'none' : '';
}));

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

document.getElementById('dex-modal-close').addEventListener('click', closeDexModal);
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

document.getElementById('mute-btn').addEventListener('click', () => {
  speechEnabled = !speechEnabled;
  document.getElementById('mute-btn').textContent = speechEnabled ? 'sound on' : 'sound off';
  if (!speechEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
});
