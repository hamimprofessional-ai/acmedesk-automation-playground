import { useEffect, useState } from 'react';
import { ChallengeShell } from '../ChallengeShell';

export function NestedIframesChallenge() {
  const [spawned, setSpawned] = useState(false);
  const [wide, setWide] = useState(false);
  const [shown, setShown] = useState(false);

  return (
    <ChallengeShell
      title="Nested & dynamic iframes"
      tier="hard"
      blurb="One iframe renders immediately and contains another iframe (two levels). Others are spawned after a delay, resized on demand, or hidden until revealed."
      goal={[
        'Switch into the immediate iframe, then into the inner iframe and click "Refresh status" — the outer count must increase.',
        'Click "Spawn iframe", wait for the frame to appear, then read the "In transit" value inside it.',
        'Toggle the width, then reveal the hidden iframe and read its transit value.',
      ]}
      selector='iframe.frame'
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={() => setSpawned(true)}>
            Spawn iframe (after 800ms)
          </button>
          <button type="button" className="btn-secondary" onClick={() => setWide((w) => !w)}>
            {wide ? 'Shrink' : 'Widen'} nested iframe
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShown((s) => !s)}
          >
            {shown ? 'Hide' : 'Show'} hidden iframe
          </button>
        </div>

        <div
          className={`overflow-hidden rounded-lg border border-slate-200 transition-all dark:border-slate-700 ${
            wide ? 'w-full' : 'w-[340px]'
          }`}
        >
          <iframe
            title="Vendor portal"
            src="/embed/vendor"
            className="frame block h-[280px] w-full border-0 bg-white"
          />
        </div>

        {spawned && <SpawnedIframe />}

        {shown && (
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
            <iframe
              title="Status panel"
              src="/embed/vendor/status"
              className="frame block h-[240px] w-full border-0 bg-white"
            />
          </div>
        )}
      </div>
    </ChallengeShell>
  );
}

function SpawnedIframe() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 800);
    return () => window.clearTimeout(timer);
  }, []);

  if (!ready) {
    return (
      <p className="pending text-sm text-slate-400">Spawning iframe…</p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          <iframe
            title="Status panel"
            src="/embed/vendor/status"
            className="frame block h-[240px] w-full border-0 bg-white"
          />
    </div>
  );
}
