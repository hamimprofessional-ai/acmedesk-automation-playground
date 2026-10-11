import { useEffect, useState } from 'react';
import { ChallengeShell } from '../ChallengeShell';

interface Item {
  id: string;
  label: string;
}

const BASE_ITEMS: Item[] = [
  { id: 'a', label: 'Invoice #1042' },
  { id: 'b', label: 'Invoice #1043' },
  { id: 'c', label: 'Invoice #1044' },
  { id: 'd', label: 'Invoice #1045' },
];

export function UnstableIdsChallenge() {
  const [frozen, setFrozen] = useState(false);
  const [token, setToken] = useState(() => Math.random().toString(36).slice(2, 8));
  const [renderCount, setRenderCount] = useState(0);
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState('');

  useEffect(() => {
    if (frozen) return;
    const timer = window.setInterval(() => {
      setToken(Math.random().toString(36).slice(2, 8));
      setRenderCount((n) => n + 1);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [frozen, renderCount]);

  const nonce = Math.random().toString(36).slice(2, 7);

  return (
    <ChallengeShell
      title="Unstable IDs & attributes"
      tier="hard"
      blurb="Every id, name and generated attribute changes on a timer — and even on each render. Selectors that hard-code an id will break between locating and interacting."
      goal={[
        'Tick the consent checkbox and click "Deactivate account" — using role/label/text, not ids.',
        'Type a reason into the field and submit; read the confirmation.',
        'Toggle "Freeze IDs" and observe the difference for the list below.',
      ]}
      selector='getByRole("button", { name: "Deactivate account" })'
    >
      <div className="stage space-y-5">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            render #{renderCount}
          </span>
          <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs dark:bg-slate-800">
            token={token} · nonce={nonce}
          </code>
          <label className="ms-auto inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={frozen}
              onChange={(e) => setFrozen(e.target.checked)}
            />
            Freeze IDs
          </label>
        </div>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(reason);
          }}
        >
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              required
              id={`consent-${token}-${nonce}`}
              name={`consent-${token}`}
              aria-label="I understand this is irreversible"
            />
            I understand this action is irreversible
          </label>

          <div>
            <label htmlFor={`reason-${token}-${nonce}`} className="label">
              Reason
            </label>
            <input
              id={`reason-${token}-${nonce}`}
              name={`reason-${token}`}
              className="input"
              aria-label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you deactivating?"
            />
          </div>

          <button
            type="submit"
            id={`deactivate-${token}-${nonce}`}
            className="btn-danger"
          >
            Deactivate account
          </button>
        </form>

        {submitted && (
          <p className="result text-sm text-emerald-600 dark:text-emerald-400">
            Deactivation submitted: “{submitted}”
          </p>
        )}

        <ul className="list divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
          {BASE_ITEMS.map((item, i) => (
            <li
              key={frozen ? item.id : `${token}-${nonce}-${item.id}`}
              id={frozen ? `row-${item.id}` : `row-${token}-${nonce}-${item.id}`}
              className="row flex items-center justify-between px-3 py-2 text-sm"
            >
              <span>{item.label}</span>
              <span className="text-slate-400">{frozen ? 'stable key' : `key ${token}-${i}`}</span>
            </li>
          ))}
        </ul>
      </div>
    </ChallengeShell>
  );
}
