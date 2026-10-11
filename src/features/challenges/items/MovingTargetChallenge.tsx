import { useEffect, useState } from 'react';
import { ChallengeShell } from '../ChallengeShell';

function randomPos() {
  return { left: 5 + Math.random() * 70, top: 10 + Math.random() * 55 };
}

export function MovingTargetChallenge() {
  const [pos, setPos] = useState(randomPos);
  const [shy, setShy] = useState({ x: 0, y: 0, n: 0 });
  const [adVisible, setAdVisible] = useState(false);
  const [caught, setCaught] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setPos(randomPos()), 1200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setAdVisible(true), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <ChallengeShell
      title="Moving targets & layout shift"
      tier="hard"
      blurb="Elements relocate while you interact: a floating button jumps on a timer, a button darts away on hover, and a late ad banner pushes content down (position shifts post-render)."
      goal={[
        'Click the floating "Confirm" button — it moves every 1.2s.',
        'Click the "Shy" button, which dodges the pointer on hover.',
        'Wait for the promo banner, dismiss it, then click "Proceed to checkout".',
      ]}
      selector='getByRole("button", { name: "Confirm" })'
    >
      <div className="space-y-5">
        <div className="relative h-44 overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40" data-testid="moving-stage">
          <button
            type="button"
            data-testid="moving-confirm"
            onClick={() => setCaught((c) => c + 1)}
            className="btn-primary absolute transition-all duration-500 ease-out"
            style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
          >
            Confirm
          </button>
          <span className="absolute bottom-2 left-3 text-xs text-slate-400">confirmed {caught}×</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            data-testid="shy-button"
            onMouseEnter={() => setShy({ x: (Math.random() - 0.5) * 220, y: (Math.random() - 0.5) * 80, n: 0 })}
            onClick={() => setShy((s) => ({ ...s, n: s.n + 1 }))}
            className="btn-secondary"
            style={{ transform: `translate(${shy.x}px, ${shy.y}px)`, transition: 'transform .25s ease' }}
          >
            Shy
          </button>
          <span className="text-xs text-slate-400">
            {shy.x !== 0 ? 'it dodged!' : 'hover me…'} · clicked {shy.n}×
          </span>
        </div>

        <div className="space-y-3" data-testid="layout-shift-stage">
          {adVisible && !dismissed && (
            <div
              className="flex items-center justify-between gap-3 rounded-lg bg-amber-100 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200"
              data-testid="promo-banner"
            >
              <span>Limited offer! Don’t miss out.</span>
              <button
                type="button"
                className="rounded-md bg-amber-900 px-2 py-1 text-xs font-medium text-white dark:bg-amber-200 dark:text-amber-950"
                onClick={() => setDismissed(true)}
                data-testid="dismiss-promo"
              >
                Dismiss
              </button>
            </div>
          )}
          <button type="button" className="btn-primary" data-testid="proceed-checkout">
            Proceed to checkout
          </button>
          <p className="text-xs text-slate-400">
            {adVisible ? 'The banner above shifted this button down.' : 'A banner will appear in a moment…'}
          </p>
        </div>
      </div>
    </ChallengeShell>
  );
}
