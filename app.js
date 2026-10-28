(() => {
  const CIRCUMFERENCE = 2 * Math.PI * 54;
  const STORAGE_KEY = 'pomodoro-settings';
  const COUNT_KEY = 'pomodoro-count';

  const $ = (sel) => document.querySelector(sel);
  const timeEl = $('#time');
  const progressEl = $('.progress');
  const startBtn = $('#start');
  const announce = $('#announce');
  const countEl = $('#count');

  const defaults = { focus: 25, short: 5, long: 15, every: 4, auto: false, sound: true };
  const settings = { ...defaults, ...load(STORAGE_KEY, {}) };

  // Count of pomodoros completed today (resets when the date changes)
  const today = new Date().toDateString();
  const stored = load(COUNT_KEY, { date: today, count: 0 });
  let count = stored.date === today ? stored.count : 0;

  let mode = 'focus';
  let remaining = settings.focus * 60;
  let total = remaining;
  let endAt = null;
  let timer = null;

  function load(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }
  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable */
    }
  }

  function format(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  function render() {
    timeEl.textContent = format(remaining);
    document.title = `${format(remaining)} · ${mode === 'focus' ? 'Focus' : 'Break'} · Pomodoro`;
    progressEl.style.strokeDashoffset = CIRCUMFERENCE * (1 - remaining / total);
    startBtn.textContent = timer ? 'Pause' : remaining === total ? 'Start' : 'Resume';
    countEl.textContent = count;
  }

  function setMode(next, { announceIt = true } = {}) {
    mode = next;
    document.body.dataset.mode = mode;
    document.querySelectorAll('.modes button').forEach((b) => {
      const active = b.dataset.mode === mode;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', String(active));
    });
    total = settings[mode] * 60;
    remaining = total;
    if (announceIt) announce.textContent = `${mode === 'focus' ? 'Focus session' : 'Break'} ready, ${settings[mode]} minutes`;
    render();
  }

  function tick() {
    remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000));
    render();
    if (remaining === 0) finish();
  }

  function start() {
    endAt = Date.now() + remaining * 1000;
    timer = setInterval(tick, 250);
    render();
  }

  function pause() {
    clearInterval(timer);
    timer = null;
    render();
  }

  function reset() {
    pause();
    remaining = total;
    render();
  }

  function finish() {
    pause();
    if (settings.sound) beep();
    if (mode === 'focus') {
      count += 1;
      save(COUNT_KEY, { date: today, count });
      setMode(count % settings.every === 0 ? 'long' : 'short');
    } else {
      setMode('focus');
    }
    if (settings.auto) start();
  }

  function skip() {
    pause();
    setMode(mode === 'focus' ? (count % settings.every === settings.every - 1 ? 'long' : 'short') : 'focus');
  }

  // Short double beep with the Web Audio API, no asset needed
  function beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.25].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.2, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.2);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.2);
      });
    } catch {
      /* audio blocked */
    }
  }

  // ── Wiring ──
  startBtn.addEventListener('click', () => (timer ? pause() : start()));
  $('#reset').addEventListener('click', reset);
  $('#skip').addEventListener('click', skip);
  document.querySelectorAll('.modes button').forEach((b) =>
    b.addEventListener('click', () => {
      pause();
      setMode(b.dataset.mode);
    }),
  );

  const inputs = { focus: '#len-focus', short: '#len-short', long: '#len-long', every: '#every', auto: '#auto', sound: '#sound' };
  for (const [key, sel] of Object.entries(inputs)) {
    const el = $(sel);
    if (el.type === 'checkbox') el.checked = settings[key];
    else el.value = settings[key];
    el.addEventListener('change', () => {
      settings[key] = el.type === 'checkbox' ? el.checked : Math.max(Number(el.min), Math.min(Number(el.max), Number(el.value) || defaults[key]));
      if (el.type !== 'checkbox') el.value = settings[key];
      save(STORAGE_KEY, settings);
      if (!timer && ['focus', 'short', 'long'].includes(key) && key === mode) setMode(mode, { announceIt: false });
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') {
      e.preventDefault();
      timer ? pause() : start();
    }
    if (e.key.toLowerCase() === 'r') reset();
  });

  setMode('focus', { announceIt: false });
})();
