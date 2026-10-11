import { useEffect, useRef, useState } from 'react';
import { ChallengeShell } from '../ChallengeShell';

const TICKERS = ['ACME', 'GLOB', 'INIT', 'UMBR', 'PARS'];

export function DetachedChallenge() {
  const [generation, setGeneration] = useState(0);
  const [paused, setPaused] = useState(false);
  const [note, setNote] = useState('');
  const [savedNote, setSavedNote] = useState('');
  const [gone, setGone] = useState(false);
  const noteRef = useRef(note);
  noteRef.current = note;

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setGeneration((g) => g + 1), 1500);
    return () => window.clearInterval(timer);
  }, [paused]);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setNote(''), 5000);
    return () => window.clearInterval(timer);
  }, [paused]);

  useEffect(() => {
    const timer = window.setTimeout(() => setGone(true), 2500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <ChallengeShell
      title="Detached & self-resetting DOM"
      tier="hard"
      blurb="The price list rebuilds its DOM every 1.5s, so a stored element handle goes stale. The note editor clears itself on a timer unless paused, and a banner removes itself shortly after render."
      goal={[
        'Pause the refresh, then click the row for “UMBR” (its price updates on every refresh).',
        'Type a note and click Save before the field resets itself.',
        'Click "Claim bonus" before the banner removes itself in ~2.5s.',
      ]}
      selector='li.row:has-text("UMBR")'
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Live prices · generation {generation}</h2>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? 'Resume refresh' : 'Pause refresh'}
          </button>
        </div>

        <ul className="list divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
          {TICKERS.map((sym, i) => (
            <li
              key={paused ? sym : `${sym}-${generation}-${i}`}
              className="row flex items-center justify-between px-3 py-2 text-sm"
            >
              <button
                type="button"
                className="font-medium text-brand-600 hover:underline dark:text-brand-400"
                onClick={() => window.alert(`Selected ${sym}`)}
              >
                {sym}
              </button>
              <span className="font-mono text-slate-500">
                {(100 + ((generation * (i + 3)) % 40)).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>

        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSavedNote(noteRef.current);
          }}
        >
          <div className="flex-1">
            <label className="label">Investigation note</label>
            <input
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Resets every 5s unless paused"
            />
          </div>
          <button type="submit" className="btn-primary">
            Save note
          </button>
        </form>
        {savedNote && (
          <p className="result text-sm text-emerald-600 dark:text-emerald-400">
            Saved: “{savedNote}”
          </p>
        )}

        {!gone && (
          <div className="banner flex items-center justify-between rounded-lg bg-brand-50 px-4 py-3 text-sm dark:bg-brand-950/40">
            <span>Quick! Claim your bonus before this banner vanishes.</span>
            <button
              type="button"
              className="btn-primary"
              onClick={() => window.alert('Bonus claimed!')}
            >
              Claim bonus
            </button>
          </div>
        )}
      </div>
    </ChallengeShell>
  );
}
