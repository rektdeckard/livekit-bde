'use client';

import { useLayoutEffect, useRef, useState } from 'react';

import { emptyDraft, STEPS } from '@/lib/beta-signup';

import { minimalCase, worstCase, type Flow } from './use-proto-flow';
import { applyTune, candleColors, candleCss, loadTune, resetTune, saveTune, tune } from './tune';
import './panel.css';

type NumericKey = {
  [K in keyof typeof tune]: (typeof tune)[K] extends number ? K : never;
}[keyof typeof tune];

type SliderSpec = {
  key: NumericKey;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
};

const motionSliders: SliderSpec[] = [
  { key: 'duration', label: 'Step transition', unit: 'ms', min: 80, max: 900, step: 10 },
  { key: 'blur', label: 'Materialize blur', unit: 'px', min: 0, max: 20, step: 1 },
  { key: 'stagger', label: 'Stagger', unit: 'ms', min: 0, max: 200, step: 5 },
  { key: 'typeSpeed', label: 'Medium typing', unit: 'ms/char', min: 4, max: 60, step: 1 },
];

const candleSliders: SliderSpec[] = [
  { key: 'candleSize', label: 'Glow spread', unit: 'px', min: 0, max: 64, step: 1 },
  { key: 'candleIntensity', label: 'Intensity', unit: '', min: 0, max: 1, step: 0.05 },
  { key: 'candleFlicker', label: 'Flicker amount', unit: '', min: 0, max: 1, step: 0.05 },
  { key: 'candleFlickerSpeed', label: 'Flicker cycle', unit: 'ms', min: 300, max: 5000, step: 50 },
  { key: 'candleFadeIn', label: 'Light up', unit: 'ms', min: 0, max: 2000, step: 25 },
  { key: 'candleFadeOut', label: 'Fade out', unit: 'ms', min: 0, max: 1500, step: 25 },
  { key: 'candleHandoff', label: 'Hand-off delay', unit: 'ms', min: 0, max: 1200, step: 25 },
];

const speeds = [1, 0.5, 0.25] as const;

function commit() {
  applyTune(document.documentElement);
  saveTune();
}

function Slider({ spec }: { spec: SliderSpec }) {
  const value = useRef<HTMLSpanElement>(null);
  return (
    <label className="proto-panel-row">
      <span>{spec.label}</span>
      <span className="proto-panel-value" ref={value}>
        {tune[spec.key]}
        {spec.unit}
      </span>
      <input
        type="range"
        min={spec.min}
        max={spec.max}
        step={spec.step}
        defaultValue={tune[spec.key]}
        onInput={(e) => {
          const next = Number(e.currentTarget.value);
          tune[spec.key] = next;
          if (value.current) value.current.textContent = `${next}${spec.unit}`;
          commit();
        }}
      />
    </label>
  );
}

export function ControlPanel({ flow }: { flow: Flow }) {
  const [collapsed, setCollapsed] = useState(true);
  const [speed, setSpeed] = useState<number>(tune.speed);
  const [version, setVersion] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  useLayoutEffect(() => {
    loadTune();
    applyTune(document.documentElement);
  }, []);

  function copy(label: string, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      window.setTimeout(() => setCopied(null), 1500);
    });
  }

  if (collapsed) {
    return (
      <div className="proto-panel" data-collapsed>
        <button
          className="proto-panel-toggle"
          onClick={() => {
            setSpeed(tune.speed);
            setCollapsed(false);
          }}
        >
          Tune
        </button>
      </div>
    );
  }

  return (
    <div className="proto-panel" role="region" aria-label="Prototype controls" key={version}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="proto-panel-label">Tune · saved automatically</span>
        <button onClick={() => setCollapsed(true)} aria-label="Collapse controls">
          ✕
        </button>
      </div>

      <div className="proto-panel-section">
        <span className="proto-panel-label">Motion</span>
        {motionSliders.map((spec) => (
          <Slider key={spec.key} spec={spec} />
        ))}
        <div className="proto-panel-row">
          <span>Speed</span>
          <div className="proto-panel-buttons">
            {speeds.map((value) => (
              <button
                key={value}
                data-active={speed === value ? '' : undefined}
                onClick={() => {
                  tune.speed = value;
                  setSpeed(value);
                  commit();
                }}
              >
                {value}×
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="proto-panel-section">
        <span className="proto-panel-label">Candle glow</span>
        <label className="proto-panel-row">
          <span>Color</span>
          <select
            defaultValue={tune.candleColor}
            onChange={(e) => {
              tune.candleColor = e.currentTarget.value as keyof typeof candleColors;
              commit();
            }}
          >
            {Object.keys(candleColors).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        {candleSliders.map((spec) => (
          <Slider key={spec.key} spec={spec} />
        ))}
      </div>

      <div className="proto-panel-section">
        <div className="proto-panel-buttons">
          <button onClick={() => copy('candle', candleCss())}>
            {copied === 'candle' ? 'Copied ✓' : 'Copy candle CSS'}
          </button>
          <button
            onClick={() =>
              copy(
                'motion',
                `duration: ${tune.duration}ms · blur: ${tune.blur}px · stagger: ${tune.stagger}ms · typing: ${tune.typeSpeed}ms/char`,
              )
            }
          >
            {copied === 'motion' ? 'Copied ✓' : 'Copy motion'}
          </button>
          <button
            onClick={() => {
              resetTune();
              applyTune(document.documentElement);
              setSpeed(tune.speed);
              setVersion((v) => v + 1);
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="proto-panel-section">
        <span className="proto-panel-label">Content</span>
        <div className="proto-panel-buttons">
          <button onClick={() => flow.load(worstCase)}>Worst case</button>
          <button onClick={() => flow.load(minimalCase)}>Minimal</button>
          <button onClick={() => flow.load(emptyDraft, 'email')}>Empty</button>
        </div>
        <span className="proto-panel-label">Jump to</span>
        <div className="proto-panel-buttons">
          {STEPS.map((step) => (
            <button
              key={step}
              data-active={flow.status !== 'success' && flow.step === step ? '' : undefined}
              onClick={() => flow.jump(step)}
            >
              {step}
            </button>
          ))}
          <button
            data-active={flow.status === 'success' ? '' : undefined}
            onClick={flow.showSuccess}
          >
            success
          </button>
        </div>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            type="checkbox"
            defaultChecked={tune.failNextSubmit}
            onChange={(e) => (tune.failNextSubmit = e.currentTarget.checked)}
          />
          Fail the next submit
        </label>
      </div>
    </div>
  );
}
