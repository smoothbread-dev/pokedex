// ── Speech / Audio ────────────────────────────────────────────────────────────
const AUDIO_LS_KEY = 'pokedex_audio_settings';
const audioSettings = { sound: true, voice: true, cries: true, voiceURI: '' };
try { Object.assign(audioSettings, JSON.parse(localStorage.getItem(AUDIO_LS_KEY) || '{}')); } catch (e) {}

function saveAudioSettings() {
  try { localStorage.setItem(AUDIO_LS_KEY, JSON.stringify(audioSettings)); } catch (e) {}
}

function sfxOn()   { return audioSettings.sound; }
function voiceOn() { return audioSettings.sound && audioSettings.voice; }
function criesOn() { return audioSettings.sound && audioSettings.cries; }

let voices = [];
let audioCtx = null;
const CRY_WAIT_MS = 1200;

const TTS_NAMES = {
  "nidoran-f": "Nidoran Female",
  "nidoran-m": "Nidoran Male",
  "mr-mime":   "Mister Mime",
  "farfetchd": "Farfetch'd",
  "exeggutor": "Exegguter",
  "jynx":      "Jinx",
};

function ttsName(name) { return TTS_NAMES[name] || displayName(name); }

function loadVoices() {
  voices = window.speechSynthesis.getVoices();
  if (typeof onVoicesLoaded === 'function') onVoicesLoaded();
}
if (window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

// Voice names differ wildly per platform, so score candidates instead of trusting one name.
const MALE_VOICE_HINTS = /\bmale\b|#male|_male|david|mark|guy|george|ryan|james|daniel|alex|fred|arthur|thomas|oliver|brian|matthew|justin|joey|eric|christopher|aaron|liam|rishi/i;
const FEMALE_VOICE_HINTS = /\bfemale\b|#female|_female|zira|hazel|susan|samantha|karen|moira|tessa|victoria|fiona|serena|catherine|amy|joanna|salli|kendra|emma|ava|allison|nicky|sonia|libby|jenny|aria/i;

function englishVoices() {
  return voices.filter(v => /^en([-_]|$)/i.test(v.lang || ''));
}

function scoreVoice(v) {
  const label = `${v.name} ${v.voiceURI || ''}`;
  let s = 0;
  if (MALE_VOICE_HINTS.test(label)) s += 100;
  if (FEMALE_VOICE_HINTS.test(label)) s -= 100;
  if (/^en[-_]GB/i.test(v.lang)) s += 25;
  else if (/^en[-_]US/i.test(v.lang)) s += 20;
  if (v.localService) s += 5;
  if (v.default) s += 1;
  return s;
}

function pickVoice() {
  if (!voices.length) return null;
  if (audioSettings.voiceURI) {
    const chosen = voices.find(v => v.voiceURI === audioSettings.voiceURI);
    if (chosen) return chosen;
  }
  const pool = englishVoices();
  if (!pool.length) return null;
  return pool.reduce((best, v) => (scoreVoice(v) > scoreVoice(best) ? v : best), pool[0]);
}

// Female-leaning voices (common default on Android) get pitched down so the announcer sounds consistent.
function voicePitchOffset(v) {
  if (!v) return 0;
  const label = `${v.name} ${v.voiceURI || ''}`;
  if (MALE_VOICE_HINTS.test(label)) return 0;
  return -0.15;
}

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playQuestSting(onDone) {
  if (!sfxOn()) { if (onDone) onDone(); return; }
  try {
    const ctx = getAudioCtx();
    const freqs = [392, 494, 587, 784];
    const dur = 0.11, gapRatio = 0.85;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.22, ctx.currentTime);
    master.connect(ctx.destination);
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'square'; osc.frequency.value = freq;
      osc.connect(gain); gain.connect(master);
      const t = ctx.currentTime + i * dur;
      gain.gain.setValueAtTime(1, t);
      gain.gain.linearRampToValueAtTime(0, t + dur * gapRatio);
      osc.start(t); osc.stop(t + dur);
    });
    if (onDone) setTimeout(onDone, freqs.length * dur * 1000);
  } catch (e) { if (onDone) onDone(); }
}

function playRevealSting(onDone) {
  if (!sfxOn()) { if (onDone) onDone(); return; }
  try {
    const ctx = getAudioCtx();
    const notes = [{ f: 523, t: 0 }, { f: 784, t: 0.12 }];
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.18, ctx.currentTime);
    master.connect(ctx.destination);
    notes.forEach(({ f, t }) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'triangle'; osc.frequency.value = f;
      osc.connect(gain); gain.connect(master);
      const start = ctx.currentTime + t;
      gain.gain.setValueAtTime(1, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
      osc.start(start); osc.stop(start + 0.28);
    });
    if (onDone) setTimeout(onDone, 380);
  } catch (e) { if (onDone) onDone(); }
}

function speak(text, pitch = 0.85, rate = 0.82) {
  if (!voiceOn() || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice();
  u.voice = v;
  u.pitch = Math.max(0.1, pitch + voicePitchOffset(v));
  u.rate = rate; u.volume = 1;
  window.speechSynthesis.speak(u);
}

function announceQuestion() {
  if (!sfxOn()) return;
  playQuestSting(() => speak("Who's that Pokémon!", 0.78, 0.78));
}

function announceReveal(name, onDone) {
  playRevealSting(() => {
    if (!voiceOn() || !window.speechSynthesis) { if (onDone) onDone(); return; }
    const u = new SpeechSynthesisUtterance(`It's ${ttsName(name)}!`);
    const v = pickVoice();
    u.voice = v;
    u.pitch = Math.max(0.1, 0.88 + voicePitchOffset(v));
    u.rate = 0.85; u.volume = 1;
    if (onDone) u.onend = onDone;
    window.speechSynthesis.speak(u);
  });
}

function playCry(id, onDone) {
  if (!criesOn()) { if (onDone) onDone(); return; }
  try {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (onDone) onDone();
    };
    const legacy = new Audio(CRY_LEGACY(id));
    legacy.volume = 0.5;
    const playModern = () => {
      const modern = new Audio(CRY_LATEST(id));
      modern.volume = 0.5;
      modern.onended = finish;
      modern.onerror = finish;
      modern.play().catch(finish);
    };
    legacy.onerror = playModern;
    legacy.onended = finish;
    legacy.play().catch(playModern);
    setTimeout(finish, CRY_WAIT_MS);
  } catch (e) { if (onDone) onDone(); }
}
