// ── Speech / Audio ────────────────────────────────────────────────────────────
let speechEnabled = true;
let voices = [];
let audioCtx = null;

const TTS_NAMES = {
  "nidoran-f": "Nidoran Female",
  "nidoran-m": "Nidoran Male",
  "mr-mime":   "Mister Mime",
  "farfetchd": "Farfetch'd",
  "exeggutor": "Exegguter",
  "jynx":      "Jinx",
};

function ttsName(name) { return TTS_NAMES[name] || displayName(name); }

function loadVoices() { voices = window.speechSynthesis.getVoices(); }
if (window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playQuestSting(onDone) {
  if (!speechEnabled) { if (onDone) onDone(); return; }
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
  if (!speechEnabled) { if (onDone) onDone(); return; }
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
  if (!speechEnabled || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const deep = voices.find(v => v.lang.startsWith('en') && /david|mark|guy|male/i.test(v.name));
  const eng  = voices.find(v => v.lang.startsWith('en-US') || v.lang.startsWith('en-GB'));
  u.voice = deep || eng || null;
  u.pitch = pitch; u.rate = rate; u.volume = 1;
  window.speechSynthesis.speak(u);
}

function announceQuestion() {
  if (!speechEnabled) return;
  playQuestSting(() => speak("Who's that Pokémon!", 0.78, 0.78));
}

function announceReveal(name, onDone) {
  if (!speechEnabled) { if (onDone) onDone(); return; }
  playRevealSting(() => {
    const u = new SpeechSynthesisUtterance(`It's ${ttsName(name)}!`);
    const deep = voices.find(v => v.lang.startsWith('en') && /david|mark|guy|male/i.test(v.name));
    const eng  = voices.find(v => v.lang.startsWith('en-US') || v.lang.startsWith('en-GB'));
    u.voice = deep || eng || null;
    u.pitch = 0.88; u.rate = 0.85; u.volume = 1;
    if (onDone) u.onend = onDone;
    window.speechSynthesis.speak(u);
  });
}

function playCry(id) {
  try {
    const legacy = new Audio(CRY_LEGACY(id));
    legacy.volume = 0.5;
    legacy.onerror = () => {
      const modern = new Audio(CRY_LATEST(id));
      modern.volume = 0.5;
      modern.play().catch(() => {});
    };
    legacy.play().catch(() => {});
  } catch (e) {}
}
