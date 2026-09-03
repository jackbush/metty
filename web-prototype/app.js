/* ── Metty — interface prototype ───────────────────────────
   Reference implementation of the interaction model. The
   Arduino firmware should behave identically to this file.
   ───────────────────────────────────────────────────────── */

'use strict';

/* ── Model ───────────────────────────────────────────────── */

const STEP = 60;          // time dial increments, seconds — one minute
const MIN_SEG = 60;       // 1:00
const MAX_SEG = 99 * 60;  // 99:00
const MIN_STAGES = 1;
const MAX_STAGES = 99;

const PRESETS = {
  off:      { segment: 0,       stages: 0, name: 'OFF'    },
  metta:    { segment:  8 * 60, stages: 5, name: 'Mettā Bhāvanā' },
  bodyscan: { segment:  5 * 60, stages: 4, name: 'Ānāpānasati'  },
  custom:   { segment: 10 * 60, stages: 1, name: 'CUSTOM' },
};

const ORDER = ['off', 'metta', 'bodyscan', 'custom'];
const ANGLE = { off: -45, metta: 45, bodyscan: 135, custom: -135 };

const state = {
  program: 'off',
  segment: 0,
  stages: 0,
  running: false,
  countdown: 0,       // seconds left on the pre-roll, 0 when not counting
  startedAt: 0,
  lastStage: 0,
};

/* ── Elements ────────────────────────────────────────────── */

const $ = (id) => document.getElementById(id);

const el = {
  progDial:  $('dial-program'),
  progPtr:   $('dial-program').querySelector('.dial-pointer'),
  timeDial:  $('dial-time'),
  timePtr:   $('dial-time').querySelector('.dial-pointer'),
  stageDial:   $('dial-stages'),
  stagePtr:    $('dial-stages').querySelector('.dial-pointer'),
  labels:    Array.from(document.querySelectorAll('.prog-label')),
  scrTop:    $('scr-top'),
  dStages:     $('d-stages'),
  dTotal:    $('d-total'),
  dSegment:  $('d-segment'),
  play:      $('play'),
  bowl:      $('bowl'),
  striker:   $('striker'),
};

/* ── Formatting ──────────────────────────────────────────── */

function mmss(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

/* ── Seven-segment display ───────────────────────────────────
   Drawn as SVG rather than set in a font, so unlit segments can
   stay faintly visible the way they do on a real reflective LCD.
   ───────────────────────────────────────────────────────── */

//    aaa
//   f   b
//    ggg
//   e   c
//    ddd
const SEG_RECTS = {
  a: [13, 0,    32, 11],
  b: [47, 13,   11, 30],
  c: [47, 57,   11, 30],
  d: [13, 89,   32, 11],
  e: [0,  57,   11, 30],
  f: [0,  13,   11, 30],
  g: [13, 44.5, 32, 11],
};

const SEG_MAP = {
  '0': 'abcdef', '1': 'bc',     '2': 'abged',  '3': 'abgcd',  '4': 'fgbc',
  '5': 'afgcd',  '6': 'afgedc', '7': 'abc',    '8': 'abcdefg', '9': 'abgfcd',
};

const GLYPH_W = 58, GLYPH_H = 100, COLON_W = 22, KERN = 8;

/**
 * `lit` is either a boolean for the whole string, or a mask string of
 * '1'/'0' the same length as the text — used by the pre-roll, which
 * lights one digit and leaves the rest as unlit ghosts.
 */
function segSVG(text, lit = true) {
  const parts = [];
  let x = 0;
  let i = -1;

  for (const ch of text) {
    i++;
    const on = typeof lit === 'string' ? lit[i] === '1' : lit;
    if (ch === ':') {
      const c = on ? ' on' : '';
      parts.push(`<rect class="seg${c}" x="${x + 6}" y="30" width="11" height="11" rx="3"/>`);
      parts.push(`<rect class="seg${c}" x="${x + 6}" y="59" width="11" height="11" rx="3"/>`);
      x += COLON_W + KERN;
    } else {
      const segs = on ? (SEG_MAP[ch] || '') : '';
      for (const key of Object.keys(SEG_RECTS)) {
        const [rx, ry, rw, rh] = SEG_RECTS[key];
        const cls = segs.includes(key) ? 'seg on' : 'seg';
        parts.push(`<rect class="${cls}" x="${x + rx}" y="${ry}" width="${rw}" height="${rh}" rx="3"/>`);
      }
      x += GLYPH_W + KERN;
    }
  }

  const w = Math.max(1, x - KERN);
  return `<svg viewBox="0 0 ${w} ${GLYPH_H}" preserveAspectRatio="xMidYMid meet">`
       + parts.join('') + '</svg>';
}

// Only touch the DOM when the rendered text actually changes.
const segCache = new WeakMap();
function setSeg(node, text, lit = true) {
  const key = text + '|' + lit;
  if (segCache.get(node) === key) return;
  segCache.set(node, key);
  node.innerHTML = segSVG(text, lit);
}

/* ── Audio: struck singing bowl ──────────────────────────── */

let ac = null;
function audio() {
  if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

// Inharmonic partials — a bowl is not a harmonic series, which is
// why a sawtooth or a plain sine never sounds like one.
const PARTIALS = [
  { ratio: 1.00,  gain: 1.00, decay: 9.0 },
  { ratio: 2.76,  gain: 0.42, decay: 6.0 },
  { ratio: 5.42,  gain: 0.20, decay: 4.0 },
  { ratio: 8.72,  gain: 0.11, decay: 2.6 },
  { ratio: 13.10, gain: 0.05, decay: 1.6 },
];

function strike(delay = 0, vol = 1) {
  const ctx = audio();
  const t = ctx.currentTime + delay;
  const f0 = 328;

  const out = ctx.createGain();
  out.gain.value = 0.42 * vol;
  out.connect(ctx.destination);

  for (const p of PARTIALS) {
    // The fundamental gets a detuned twin so the tone beats slowly
    // as it decays, the way a real bowl wobbles.
    const voices = p.ratio === 1 ? [0, 0.6] : [0];
    for (const detune of voices) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f0 * p.ratio + detune;

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(p.gain, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + p.decay);

      osc.connect(g).connect(out);
      osc.start(t);
      osc.stop(t + p.decay + 0.1);
    }
  }

  // Mallet transient — the "tock" of contact, before the tone blooms.
  const n = ctx.createBufferSource();
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  n.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2400;
  bp.Q.value = 0.8;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.28 * vol, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  n.connect(bp).connect(ng).connect(out);
  n.start(t);
  n.stop(t + 0.12);

  animateStrike(delay * 1000);
}

function animateStrike(delayMs) {
  setTimeout(() => {
    el.striker.classList.add('strike');
    el.bowl.classList.add('hit');
    setTimeout(() => el.striker.classList.remove('strike'), 110);
    setTimeout(() => el.bowl.classList.remove('hit'), 900);
  }, delayMs);
}

// Three strikes open and close a session; one marks a boundary.
function tripleStrike() {
  strike(0);
  strike(1.7);
  strike(3.4);
}

/* ── Rendering ───────────────────────────────────────────── */

function render() {
  const isOff = state.program === 'off';
  const counting = state.countdown > 0;
  const total = state.segment * state.stages;

  let segText, stagesLeft, totalLeft;

  if (state.running) {
    const elapsed = (Date.now() - state.startedAt) / 1000;
    const stage = Math.min(state.stages, Math.floor(elapsed / state.segment) + 1);
    segText  = mmss(state.segment - (elapsed % state.segment));
    stagesLeft = state.stages - stage + 1;   // stages remaining, including this one
    totalLeft = total - elapsed;
  } else {
    segText  = mmss(state.segment);
    stagesLeft = state.stages;
    totalLeft = total;
  }

  // Bottom row: segment time. Unlit ghost digits when the deck is off.
  // During the pre-roll only the last digit lights, counting 5 down to 1.
  if (counting) {
    setSeg(el.dSegment, `88:8${state.countdown}`, '00001');
  } else {
    setSeg(el.dSegment, isOff ? '88:88' : segText, !isOff);
  }

  // Top row carries stages + total. While setting up it is always
  // present, so the program you have dialled in reads back in full —
  // stages and total — before you commit to it. Once running it obeys
  // the "more to come" rule: on the last stage there is nothing left to
  // count, so it goes dark rather than sitting there reading "1".
  const showTop = !isOff && !counting && (!state.running || stagesLeft > 1);
  el.scrTop.style.visibility = showTop ? 'visible' : 'hidden';
  if (showTop) {
    setSeg(el.dStages, String(stagesLeft));
    setSeg(el.dTotal, mmss(totalLeft));
  }

  // Dials
  el.progPtr.style.transform = `rotate(${ANGLE[state.program]}deg)`;
  el.labels.forEach((l) =>
    l.classList.toggle('active', l.dataset.program === state.program));
  el.progDial.setAttribute('aria-valuetext', PRESETS[state.program].name);

  el.timePtr.style.transform = `rotate(${(state.segment / STEP) * 6}deg)`;
  // Position 1 is 12 o'clock and each stage is one notch clockwise;
  // with no program loaded there is no count, so the pointer rests at 1.
  el.stagePtr.style.transform = `rotate(${Math.max(0, state.stages - 1) * 60}deg)`;

  // Transport
  el.play.disabled = isOff;
}

/* ── Program selection ───────────────────────────────────── */

function setProgram(name) {
  cancelCountdown();
  if (state.running) stop(false);
  state.program = name;
  // A preset loads starting values; the dials stay live afterwards.
  state.segment = PRESETS[name].segment;
  state.stages = PRESETS[name].stages;
  render();
}

/* ── Dial input ──────────────────────────────────────────── */

function angleFrom(node, ev) {
  const r = node.getBoundingClientRect();
  const dx = ev.clientX - (r.left + r.width / 2);
  const dy = ev.clientY - (r.top + r.height / 2);
  return Math.atan2(dx, -dy) * 180 / Math.PI; // 0 = up, clockwise +
}

function shortest(a) {
  return ((a + 180) % 360 + 360) % 360 - 180;
}

/**
 * Free-spinning encoder. Accumulates rotation and emits a detent
 * every `degPerStep` degrees — the same behaviour as the rotary
 * encoder on the hardware, which has no end stops.
 */
function freeDial(node, degPerStep, onStep) {
  let last = null;
  let acc = 0;

  node.addEventListener('pointerdown', (ev) => {
    node.setPointerCapture(ev.pointerId);
    last = angleFrom(node, ev);
    acc = 0;
  });

  node.addEventListener('pointermove', (ev) => {
    if (last === null) return;
    const now = angleFrom(node, ev);
    acc += shortest(now - last);
    last = now;
    while (Math.abs(acc) >= degPerStep) {
      const dir = Math.sign(acc);
      acc -= dir * degPerStep;
      onStep(dir);
    }
  });

  const release = (ev) => {
    if (last === null) return;
    last = null;
    if (node.hasPointerCapture?.(ev.pointerId)) node.releasePointerCapture(ev.pointerId);
  };
  node.addEventListener('pointerup', release);
  node.addEventListener('pointercancel', release);

  node.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    onStep(ev.deltaY < 0 ? 1 : -1);
  }, { passive: false });

  node.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowUp' || ev.key === 'ArrowRight') { onStep(1); ev.preventDefault(); }
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowLeft') { onStep(-1); ev.preventDefault(); }
  });
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

freeDial(el.timeDial, 6, (dir) => {
  if (state.program === 'off') return;
  state.segment = clamp(state.segment + dir * STEP, MIN_SEG, MAX_SEG);
  render();
});

freeDial(el.stageDial, 60, (dir) => {
  if (state.program === 'off') return;
  state.stages = clamp(state.stages + dir, MIN_STAGES, MAX_STAGES);
  render();
});

// Program dial: 4 detents, snaps to the nearest position.
(function programDial() {
  let dragging = false;

  const pick = (ev) => {
    const a = angleFrom(el.progDial, ev);
    let best = ORDER[0], bestD = Infinity;
    for (const key of ORDER) {
      const d = Math.abs(shortest(a - ANGLE[key]));
      if (d < bestD) { bestD = d; best = key; }
    }
    if (best !== state.program) setProgram(best);
  };

  el.progDial.addEventListener('pointerdown', (ev) => {
    el.progDial.setPointerCapture(ev.pointerId);
    dragging = true;
    pick(ev);
  });
  el.progDial.addEventListener('pointermove', (ev) => { if (dragging) pick(ev); });
  el.progDial.addEventListener('pointerup', () => { dragging = false; });
  el.progDial.addEventListener('pointercancel', () => { dragging = false; });

  el.progDial.addEventListener('keydown', (ev) => {
    const i = ORDER.indexOf(state.program);
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') {
      setProgram(ORDER[(i + 1) % ORDER.length]); ev.preventDefault();
    }
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') {
      setProgram(ORDER[(i + ORDER.length - 1) % ORDER.length]); ev.preventDefault();
    }
  });

  el.labels.forEach((l) =>
    l.addEventListener('click', () => setProgram(l.dataset.program)));
})();

/* ── Wake lock ───────────────────────────────────────────────
   A meditation runs for minutes with nothing touching the screen,
   so the phone would dim and sleep mid-session and take the bowl
   with it. Hold a screen wake lock while a session is running, and
   re-take it when the tab comes back to the foreground — the
   browser drops the lock whenever the page is hidden.
   ───────────────────────────────────────────────────────── */

let wakeLock = null;

async function acquireWakeLock() {
  if (!('wakeLock' in navigator) || wakeLock) return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => { wakeLock = null; });
  } catch {
    wakeLock = null;   // denied, or the tab lost focus mid-request
  }
}

function releaseWakeLock() {
  wakeLock?.release().catch(() => {});
  wakeLock = null;
}

document.addEventListener('visibilitychange', () => {
  if (state.running && document.visibilityState === 'visible') acquireWakeLock();
});

/* ── Transport ───────────────────────────────────────────── */

let tick = null;
let preroll = null;

// Five seconds of settling before the bells: the last digit of the
// clock counts 5,4,3,2,1, then the session starts on zero.
function beginCountdown() {
  if (state.program === 'off' || state.segment <= 0 || state.stages <= 0) return;
  const t0 = Date.now();
  state.countdown = 5;
  render();
  preroll = setInterval(() => {
    const left = 5 - Math.floor((Date.now() - t0) / 1000);
    if (left <= 0) { cancelCountdown(); start(); return; }
    if (left !== state.countdown) { state.countdown = left; render(); }
  }, 100);
}

function cancelCountdown() {
  clearInterval(preroll);
  preroll = null;
  state.countdown = 0;
}

function start() {
  if (state.program === 'off' || state.segment <= 0 || state.stages <= 0) return;
  state.running = true;
  state.startedAt = Date.now();
  state.lastStage = 1;
  acquireWakeLock();
  tripleStrike();
  tick = setInterval(update, 100);
  render();
}

function stop(closing) {
  state.running = false;
  clearInterval(tick);
  tick = null;
  releaseWakeLock();
  if (closing) tripleStrike();
  render();
}

function update() {
  const elapsed = (Date.now() - state.startedAt) / 1000;
  const total = state.segment * state.stages;

  if (elapsed >= total) {
    stop(true);
    return;
  }

  const stage = Math.floor(elapsed / state.segment) + 1;
  if (stage > state.lastStage) {
    state.lastStage = stage;
    strike(0);           // single strike at a segment boundary
  }

  render();
}

el.play.addEventListener('click', () => {
  audio();               // unlock on the first gesture
  if (state.running) { stop(false); return; }
  if (state.countdown > 0) { cancelCountdown(); render(); return; }
  beginCountdown();
});

document.addEventListener('keydown', (ev) => {
  if (ev.code === 'Space' && ev.target === document.body) {
    ev.preventDefault();
    el.play.click();
  }
});

/* ── Tick rings ──────────────────────────────────────────────
   Ticks are drawn at the real detent positions, so the ring is a
   readout of the control's resolution rather than decoration:
   Time is indexed like a clock: 12 marks to the turn, one per five
   minutes, so a full revolution is an hour. Stages is a counted ring of
   6, one mark per step. Both start at 12 o'clock and run clockwise, and
   both land on real detent positions rather than being decoration.
   ───────────────────────────────────────────────────────── */

function addTicks(dial, angles) {
  const host = dial.querySelector('.ticks');
  if (!host) return;
  for (const a of angles) {
    const t = document.createElement('div');
    t.className = 'tick';
    t.style.transform = `rotate(${a}deg)`;
    host.appendChild(t);
  }
}

const evenly = (n) => Array.from({ length: n }, (_, i) => (i * 360) / n);

addTicks(el.progDial, ORDER.map((k) => ANGLE[k]));
addTicks(el.timeDial, evenly(12));
addTicks(el.stageDial, evenly(6));

/* ── Boot ────────────────────────────────────────────────── */

render();
