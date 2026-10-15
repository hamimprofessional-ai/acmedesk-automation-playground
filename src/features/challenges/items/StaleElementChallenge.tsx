import { useCallback, useEffect, useRef, useState } from 'react';
import { ChallengeShell } from '../ChallengeShell';

const REFS = ['PIN-0013', 'PIN-0021', 'PIN-0034', 'PIN-0042', 'PIN-0055', 'PIN-0068'];
const LABELS = [
  'Invoice correction',
  'Refund request',
  'Address change',
  'Plan upgrade',
  'Account merge',
  'Data export',
];
const TARGET_REF = 'PIN-0042';
const EXIT_MS = 700;
const AUTO_INTERVAL = 2600;

interface Row {
  id: string;
  ref: string;
  label: string;
  leaving: boolean;
}

function buildRows(revision: number): Row[] {
  const label = LABELS[Math.floor(Math.random() * LABELS.length)];
  return REFS.map((ref, i) => ({
    id: `${revision}-${i}`,
    ref,
    label: i === 0 ? label : LABELS[i],
    leaving: false,
  }));
}

export function StaleElementChallenge() {
  const [rows, setRows] = useState<Row[]>(() => buildRows(0));
  const [revision, setRevision] = useState(1);
  const [auto, setAuto] = useState(false);
  const [pinned, setPinned] = useState<string | null>(null);
  const revisionRef = useRef(1);

  const reload = useCallback(() => {
    const next = revisionRef.current;
    revisionRef.current += 1;
    setRevision(revisionRef.current);
    setRows((prev) => [...prev.map((r) => ({ ...r, leaving: true })), ...buildRows(next)]);
    window.setTimeout(() => {
      setRows((prev) => prev.filter((r) => !r.leaving));
    }, EXIT_MS);
  }, []);

  useEffect(() => {
    if (!auto) return;
    const timer = window.setInterval(reload, AUTO_INTERVAL);
    return () => window.clearInterval(timer);
  }, [auto, reload]);

  const pinnedNow = rows.filter((r) => r.ref === pinned && !r.leaving).length;

  return (
    <ChallengeShell
      title="Stale element references"
      tier="hard"
      blurb="Every refresh rebuilds every row node, and outgoing rows linger for a moment while they fade out — so the list briefly holds two copies of each row. Handles captured before a refresh detach, and text locators match more than one element in between."
      goal={[
        'Find the row with ref PIN-0042 and pin it — first with the list frozen.',
        'Turn on Auto-refresh and pin it again: a handle grabbed before the rebuild is now stale.',
        'Right after a rebuild, two PIN-0042 rows coexist for ~0.7s — resolve the ambiguity.',
      ]}
      selector='[data-testid="stale-list"] [data-ref="PIN-0042"]:not(.leaving)'
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium">
            Queue · revision {revision} · rows {rows.filter((r) => !r.leaving).length}
          </h2>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={auto}
                onChange={(e) => setAuto(e.target.checked)}
              />
              Auto-refresh
            </label>
            <button type="button" className="btn-secondary" onClick={reload}>
              Refresh list
            </button>
          </div>
        </div>

        <ul
          data-testid="stale-list"
          className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-700"
        >
          {rows.map((row) => (
            <li
              key={row.id}
              data-testid="stale-row"
              data-ref={row.ref}
              aria-hidden={row.leaving || undefined}
              className={
                'row flex items-center gap-3 px-3 py-2 text-sm transition-opacity duration-700 ' +
                (row.leaving ? 'leaving pointer-events-none opacity-0' : 'opacity-100')
              }
            >
              <span className="font-mono text-xs text-slate-400">{row.ref}</span>
              <span className="flex-1">{row.label}</span>
              <button
                type="button"
                data-testid="pin-row"
                disabled={row.leaving}
                onClick={() => setPinned(row.ref)}
                className={
                  pinnedNow && row.ref === pinned
                    ? 'btn-primary'
                    : 'btn-secondary'
                }
              >
                {pinnedNow && row.ref === pinned ? 'Pinned' : 'Pin'}
              </button>
            </li>
          ))}
        </ul>

        {pinned && (
          <p className="result text-sm text-emerald-600 dark:text-emerald-400">
            Pinned {pinned}
            {pinned === TARGET_REF ? ' — correct row!' : ''}
          </p>
        )}
      </div>
    </ChallengeShell>
  );
}
