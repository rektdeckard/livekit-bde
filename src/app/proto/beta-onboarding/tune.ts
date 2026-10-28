// Live-tunable numbers for the prototype. The control panel mutates this object and
// mirrors each value to a CSS variable, so dragging a slider never re-renders the tree;
// variants read the current values the next time they animate. Values are saved to
// localStorage so a tuning session survives reloads.

export const candleColors = {
  'pumpkin-500': 'var(--dk-color-pumpkin-500)',
  'pumpkin-400': 'var(--dk-color-pumpkin-400)',
  'amber-300': 'var(--dk-color-amber-300)',
  'purple-400': 'var(--dk-color-purple-400)',
  'red-400': 'var(--dk-color-red-400)',
} as const;

type CandleColor = keyof typeof candleColors;

const defaults = {
  duration: 320,
  blur: 8,
  stagger: 60,
  typeSpeed: 18,
  speed: 1,
  candleColor: 'pumpkin-500' as CandleColor,
  candleSize: 22,
  candleIntensity: 0.75,
  candleFlicker: 0.5,
  candleFlickerSpeed: 1800,
  candleFadeIn: 600,
  candleFadeOut: 350,
  candleHandoff: 200,
};

export const tune = { ...defaults, failNextSubmit: false };

const STORAGE_KEY = 'proto:beta-onboarding:tune';

/** Seconds for motion, scaled by the speed multiplier. */
export function secs(ms: number) {
  return ms / tune.speed / 1000;
}

export function loadTune() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    for (const key of Object.keys(defaults) as (keyof typeof defaults)[]) {
      if (typeof saved[key] === typeof defaults[key]) Object.assign(tune, { [key]: saved[key] });
    }
  } catch {
    // Private mode or corrupt data: keep the defaults.
  }
}

export function saveTune() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...tune, failNextSubmit: undefined }));
  } catch {
    // Storage unavailable: the values still apply for this session.
  }
}

export function resetTune() {
  Object.assign(tune, defaults);
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable: nothing was saved to clear.
  }
}

/** Every timing value goes through the speed multiplier so slow-mo stretches it too. */
export function applyTune(root: HTMLElement) {
  const ms = (value: number) => `${value / tune.speed}ms`;
  const vars: Record<string, string> = {
    '--proto-duration': ms(tune.duration),
    '--proto-blur': `${tune.blur}px`,
    '--proto-speed': String(tune.speed),
    '--candle-color': candleColors[tune.candleColor],
    '--candle-size': `${tune.candleSize}px`,
    '--candle-intensity': String(tune.candleIntensity),
    '--candle-flicker': String(tune.candleFlicker),
    '--candle-flicker-speed': ms(tune.candleFlickerSpeed),
    '--candle-fade-in': ms(tune.candleFadeIn),
    '--candle-fade-out': ms(tune.candleFadeOut),
    '--candle-handoff': ms(tune.candleHandoff),
  };
  for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value);
}

/** The candle settings as CSS, ready to paste into the :root block in src/app/globals.css. */
export function candleCss() {
  return [
    `--candle-color: ${candleColors[tune.candleColor]};`,
    `--candle-size: ${tune.candleSize}px;`,
    `--candle-intensity: ${tune.candleIntensity};`,
    `--candle-flicker: ${tune.candleFlicker};`,
    `--candle-flicker-speed: ${tune.candleFlickerSpeed}ms;`,
    `--candle-fade-in: ${tune.candleFadeIn}ms;`,
    `--candle-fade-out: ${tune.candleFadeOut}ms;`,
    `--candle-handoff: ${tune.candleHandoff}ms;`,
  ].join('\n');
}
