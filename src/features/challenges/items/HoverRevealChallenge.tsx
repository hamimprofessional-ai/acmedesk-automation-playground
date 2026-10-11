import { useState } from 'react';
import { ChallengeShell } from '../ChallengeShell';

const ROWS = [
  { id: 'INV-2201', amount: '$1,240.00' },
  { id: 'INV-2202', amount: '$880.50' },
  { id: 'INV-2203', amount: '$2,410.75' },
];

export function HoverRevealChallenge() {
  const [log, setLog] = useState<string[]>([]);
  const logAction = (msg: string) => setLog((l) => [`${new Date().toLocaleTimeString()} · ${msg}`, ...l].slice(0, 6));
  const [marked, setMarked] = useState<string[]>([]);

  return (
    <ChallengeShell
      title="Hover-only controls"
      tier="medium"
      blurb="Row actions are invisible until the pointer enters the row, and a tooltip sits on top of a button. A plain click without moving the mouse first will fail."
      goal={[
        'Hover each invoice row and click "Archive" — the row then shows as archived.',
        'Open the "Attach" control, which is only revealed on hover.',
        'Click "Download" even though a tooltip overlaps it.',
      ]}
      selector='li.item:has-text("INV-2201") >> text=Archive'
    >
      <div className="space-y-5">
        <ul className="list space-y-2">
          {ROWS.map((row) => (
            <li
              key={row.id}
              className="item group flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
            >
              <span className="text-sm">
                {row.id} · {row.amount}
                {marked.includes(row.id) && <span className="ms-2 text-xs text-rose-500">archived</span>}
              </span>
              <span className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <button
                  type="button"
                  className="action btn-ghost px-2 py-1 text-xs"
                  onClick={() => logAction(`attach ${row.id}`)}
                >
                  Attach
                </button>
                <button
                  type="button"
                  className="action btn-ghost px-2 py-1 text-xs"
                  onClick={() => {
                    setMarked((m) => [...m, row.id]);
                    logAction(`archived ${row.id}`);
                  }}
                >
                  Archive
                </button>
              </span>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-6">
          <div className="group relative inline-block">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => logAction('download started')}
            >
              Download
            </button>
            <span className="pointer-events-none absolute -top-9 start-0 z-10 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
              Overlaps the button
            </span>
          </div>

          <div className="group relative">
            <span className="hint cursor-help border-b border-dotted border-slate-400 text-sm">
              Hover for account tier
            </span>
            <span className="pointer-events-none invisible absolute left-0 top-6 z-10 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white group-hover:visible">
              Tier: Platinum
            </span>
          </div>
        </div>

        <div className="log rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-800/50">
          {log.length === 0 ? <span className="text-slate-400">Action log…</span> : log.map((l) => <div key={l}>{l}</div>)}
        </div>
      </div>
    </ChallengeShell>
  );
}
