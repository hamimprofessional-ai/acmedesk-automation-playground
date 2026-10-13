import { useEffect, useState } from 'react';
import { ChallengeShell } from '../ChallengeShell';

export function NativePromptsChallenge() {
  const [warnGuard, setWarnGuard] = useState(false);
  const [confirmResult, setConfirmResult] = useState('not run');
  const [promptResult, setPromptResult] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (!warnGuard) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [warnGuard]);

  return (
    <ChallengeShell
      title="Native dialogs"
      tier="medium"
      blurb="Real window.alert / confirm / prompt dialogs are OS-level modals — automation must register a dialog handler before triggering them or the run hangs."
      goal={[
        'Trigger the alert and accept it.',
        'Trigger the confirm and choose OK; verify the result text.',
        'Trigger the prompt, type a value and accept; verify it is echoed back.',
        'Toggle the "warn before leaving" guard, then do a hard refresh or close the tab (in-app navigation will not trigger it).',
      ]}
      selector='page.on("dialog", d => d.accept("Ada"))'
    >
      <div className="stage space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => window.alert('This is a native alert.')}
          >
            Trigger alert()
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setConfirmResult(window.confirm('Delete all drafts?') ? 'confirmed' : 'cancelled')}
          >
            Trigger confirm()
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setPromptResult(window.prompt('Your name?', '') ?? null)}
          >
            Trigger prompt()
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={warnGuard}
            onChange={(e) => setWarnGuard(e.target.checked)}
          />
          Warn before leaving (beforeunload)
        </label>

        <div className="log rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/50">
          confirm → <span className="out">{confirmResult}</span>
          <br />
          prompt →{' '}
          <span className="out">{promptResult === undefined ? 'not run' : String(promptResult)}</span>
        </div>
      </div>
    </ChallengeShell>
  );
}
