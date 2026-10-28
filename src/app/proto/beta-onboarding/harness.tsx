'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
} from 'react';

import { ControlPanel } from './controls';
import { useProtoFlow, type Flow } from './use-proto-flow';
import { LedgerVariant } from './variant-ledger';
import { MediumVariant } from './variant-medium';
import { TableVariant } from './variant-table';
import './picker.css';

const variants: { name: string; Component: ComponentType<{ flow: Flow }> }[] = [
  { name: 'Séance Table', Component: TableVariant },
  { name: 'Candlelit Ledger', Component: LedgerVariant },
  { name: 'The Medium', Component: MediumVariant },
];

export function Harness({ initialVariant }: { initialVariant: number }) {
  const flow = useProtoFlow();
  const [current, setCurrent] = useState(
    Math.min(Math.max(initialVariant, 0), variants.length - 1),
  );
  const [mountKey, setMountKey] = useState(0);
  const [ready, setReady] = useState(false);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const highlight = useRef<HTMLSpanElement>(null);

  const moveHighlight = useCallback(() => {
    const el = items.current[current];
    if (!el || !highlight.current) return;
    highlight.current.style.width = `${el.offsetWidth}px`;
    highlight.current.style.transform = `translateX(${el.offsetLeft}px)`;
  }, [current]);

  const select = useCallback((i: number) => {
    if (i < 0 || i >= variants.length) return;
    setCurrent(i);
    setMountKey((k) => k + 1);
    const url = new URL(window.location.href);
    url.searchParams.set('v', String(i + 1));
    window.history.replaceState(null, '', url);
  }, []);

  const replay = useCallback(() => setMountKey((k) => k + 1), []);

  // Enable the highlight slide only after first paint, so load doesn't animate.
  useEffect(() => {
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
    return () => cancelAnimationFrame(frame);
  }, []);

  useLayoutEffect(() => {
    moveHighlight();
    window.addEventListener('resize', moveHighlight);
    return () => window.removeEventListener('resize', moveHighlight);
  }, [moveHighlight]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const num = Number.parseInt(e.key, 10);
      if (num >= 1 && num <= variants.length) select(num - 1);
      else if (e.key === 'ArrowRight') select((current + 1) % variants.length);
      else if (e.key === 'ArrowLeft') select((current - 1 + variants.length) % variants.length);
      else if (e.key === 'r' || e.key === 'R') replay();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [current, replay, select]);

  const { Component } = variants[current];

  return (
    <>
      <Component key={`${current}-${mountKey}`} flow={flow} />

      <ControlPanel flow={flow} />

      <nav
        className="proto-picker"
        aria-label="Prototype variants"
        data-ready={ready ? '' : undefined}
      >
        <span ref={highlight} className="proto-picker-highlight" aria-hidden="true" />
        {variants.map((variant, i) => (
          <button
            key={variant.name}
            ref={(el) => void (items.current[i] = el)}
            className="proto-picker-item"
            data-active={i === current ? '' : undefined}
            aria-current={i === current ? 'true' : undefined}
            onClick={() => select(i)}
          >
            {variant.name}
          </button>
        ))}
        <span className="proto-picker-divider" aria-hidden="true" />
        <button
          className="proto-picker-item proto-picker-replay"
          aria-label="Replay animation (R)"
          onClick={replay}
        >
          ↻
        </button>
      </nav>
    </>
  );
}
