import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChallengeShell } from '../ChallengeShell';
import { apiGet } from '@/lib/api';

interface SlowResponse {
  items: { id: string; label: string; value: number }[];
  servedAt: string;
  latencyMs: number;
}

export function DelayedAsyncChallenge() {
  const [secret, setSecret] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['challenge-slow'],
    queryFn: () => apiGet<SlowResponse>('/api/challenges/slow'),
  });

  useEffect(() => {
    const timer = window.setTimeout(
      () => setSecret(Math.random().toString(36).slice(2, 8).toUpperCase()),
      2000 + Math.random() * 4000,
    );
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <ChallengeShell
      title="Delayed async rendering"
      tier="medium"
      blurb="The report arrives after a random server delay (1.5–4.5s) and renders skeletons first. A secret token also appears at an unpredictable moment. Fixed sleeps will flake."
      goal={[
        'Wait for the report rows to replace the skeleton, then read the latency value.',
        'Click "Refresh report" and wait for the new result (button is disabled while pending).',
        'Capture the secret token — it appears at a random time between 2s and 6s.',
      ]}
      selector='table tr.row'
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Usage report</h2>
          <button
            type="button"
            className="btn-secondary"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            {isFetching ? 'Refreshing…' : 'Refresh report'}
          </button>
        </div>

        {isLoading || !data ? (
          <div className="skeleton space-y-2" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-9 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : (
          <div className="report space-y-2">
            <p className="text-xs text-slate-400">
              served in {data.latencyMs} ms at {new Date(data.servedAt).toLocaleTimeString()}
            </p>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.items.map((row) => (
                  <tr key={row.id} className="row">
                    <td className="py-2">{row.label}</td>
                    <td className="py-2 text-end font-mono text-slate-500">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/50">
          Secret token:{' '}
          {secret ? (
            <code className="result font-mono text-emerald-600 dark:text-emerald-400">
              {secret}
            </code>
          ) : (
            <span className="result muted text-slate-400">
              not revealed yet…
            </span>
          )}
        </div>
      </div>
    </ChallengeShell>
  );
}
