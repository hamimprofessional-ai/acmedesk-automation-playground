import { useState } from 'react';
import { ChallengeShell } from '../ChallengeShell';
import { apiGet, ApiError } from '@/lib/api';

type Phase = 'idle' | 'loading' | 'error' | 'ok';

export function FlakyNetworkChallenge() {
  const [flaky, setFlaky] = useState<{ phase: Phase; tries: number; value?: number; message?: string }>({
    phase: 'idle',
    tries: 0,
  });
  const [limited, setLimited] = useState<{ phase: Phase; tries: number; message?: string }>({
    phase: 'idle',
    tries: 0,
  });
  const [timeoutState, setTimeoutState] = useState<{ phase: Phase; message?: string }>({ phase: 'idle' });
  const [intermittent, setIntermittent] = useState(() => Math.random() < 0.5);

  async function loadFlaky() {
    setFlaky((s) => ({ ...s, phase: 'loading', tries: s.tries + 1 }));
    try {
      const data = await apiGet<{ value: number }>('/api/challenges/flaky');
      setFlaky((s) => ({ phase: 'ok', tries: s.tries, value: data.value }));
    } catch (err) {
      setFlaky((s) => ({ ...s, phase: 'error', message: (err as Error).message }));
    }
  }

  async function loadLimited() {
    setLimited((s) => ({ ...s, phase: 'loading', tries: s.tries + 1 }));
    try {
      await apiGet('/api/challenges/ratelimit');
      setLimited((s) => ({ ...s, phase: 'ok', tries: s.tries + 1 }));
    } catch (err) {
      const message = err instanceof ApiError ? `${err.status} ${err.message}` : String(err);
      setLimited((s) => ({ phase: 'error', tries: s.tries + 1, message }));
    }
  }

  async function loadTimeout() {
    setTimeoutState({ phase: 'loading' });
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 3000);
    try {
      await fetch('/api/challenges/timeout', { signal: controller.signal }).then((r) => r.json());
      setTimeoutState({ phase: 'ok' });
    } catch {
      setTimeoutState({ phase: 'error', message: 'Request timed out after 3000 ms (aborted)' });
    } finally {
      window.clearTimeout(timer);
    }
  }

  return (
    <ChallengeShell
      title="Flaky network & retries"
      tier="hard"
      blurb="Endpoints fail ~50% of the time, rate-limit with 429, and one stalls past a client timeout. A random element also only renders half the time."
      goal={[
        'Retry the balance endpoint until it succeeds; capture the balance value.',
        'Keep retrying the rate-limited endpoint until it returns 200.',
        'Trigger the slow endpoint and observe the client-side timeout, then re-test for the intermittent callout.',
      ]}
      selector='getByTestId("flaky-retry") / "rate-limit-retry"'
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="space-y-2 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          <h2 className="text-sm font-medium">Account balance</h2>
          <p className="text-xs text-slate-400">Fails ~50% (HTTP 500). Attempts: {flaky.tries}</p>
          {flaky.phase === 'ok' && (
            <p className="font-mono text-emerald-600 dark:text-emerald-400" data-testid="flaky-value">
              ${flaky.value?.toFixed(2)}
            </p>
          )}
          {flaky.phase === 'error' && (
            <p className="text-sm text-rose-600 dark:text-rose-400" data-testid="flaky-error">
              {flaky.message}
            </p>
          )}
          <button
            type="button"
            className="btn-secondary"
            data-testid="flaky-retry"
            disabled={flaky.phase === 'loading'}
            onClick={loadFlaky}
          >
            {flaky.phase === 'loading' ? 'Loading…' : flaky.phase === 'error' ? 'Retry' : 'Load balance'}
          </button>
        </section>

        <section className="space-y-2 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          <h2 className="text-sm font-medium">Rate-limited endpoint</h2>
          <p className="text-xs text-slate-400">Rejects the first 2 calls with 429. Attempts: {limited.tries}</p>
          {limited.phase === 'ok' && (
            <p className="text-emerald-600 dark:text-emerald-400" data-testid="rate-limit-value">
              Loaded after retries ✓
            </p>
          )}
          {limited.phase === 'error' && (
            <p className="text-sm text-amber-600 dark:text-amber-400" data-testid="rate-limit-error">
              {limited.message}
            </p>
          )}
          <button
            type="button"
            className="btn-secondary"
            data-testid="rate-limit-retry"
            disabled={limited.phase === 'loading'}
            onClick={loadLimited}
          >
            {limited.phase === 'loading' ? 'Loading…' : limited.phase === 'error' ? 'Retry after backoff' : 'Load'}
          </button>
        </section>

        <section className="space-y-2 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          <h2 className="text-sm font-medium">Slow endpoint (client timeout)</h2>
          <p className="text-xs text-slate-400">Server takes 6s; the client aborts at 3s.</p>
          {timeoutState.phase === 'error' && (
            <p className="text-sm text-rose-600 dark:text-rose-400" data-testid="timeout-error">
              {timeoutState.message}
            </p>
          )}
          {timeoutState.phase === 'ok' && (
            <p className="text-emerald-600 dark:text-emerald-400" data-testid="timeout-ok">
              Completed (no timeout)
            </p>
          )}
          <button
            type="button"
            className="btn-secondary"
            data-testid="timeout-trigger"
            disabled={timeoutState.phase === 'loading'}
            onClick={loadTimeout}
          >
            {timeoutState.phase === 'loading' ? 'Waiting…' : 'Trigger slow request'}
          </button>
        </section>

        <section className="space-y-2 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          <h2 className="text-sm font-medium">Intermittent element</h2>
          <p className="text-xs text-slate-400">Renders ~50% of the time.</p>
          <button
            type="button"
            className="btn-secondary"
            data-testid="reroll-intermittent"
            onClick={() => setIntermittent(Math.random() < 0.5)}
          >
            Re-roll
          </button>
          {intermittent && (
            <p className="text-sm text-brand-600 dark:text-brand-400" data-testid="intermittent-message">
              You got the lucky render!
            </p>
          )}
        </section>
      </div>
    </ChallengeShell>
  );
}
