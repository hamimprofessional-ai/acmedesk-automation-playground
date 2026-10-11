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
        'Toggle the "warn before leaving" guard and try to navigate away.',
      ]}
      selector='page.on("dialog", d => d.accept("Ada"))'
    >
      <div className="space-y-4" data-testid="prompt-stage">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary"
            data-testid="trigger-alert"
            onClick={() => window.alert('This is a native alert.')}
          >
            Trigger alert()
          </button>
          <button
            type="button"
            className="btn-secondary"
            data-testid="trigger-confirm"
            onClick={() => setConfirmResult(window.confirm('Delete all drafts?') ? 'confirmed' : 'cancelled')}
          >
            Trigger confirm()
          </button>
          <button
            type="button"
            className="btn-secondary"
            data-testid="trigger-prompt"
            onClick={() => setPromptResult(window.prompt('Your name?', '') ?? null)}
          >
            Trigger prompt()
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            data-testid="beforeunload-toggle"
            checked={warnGuard}
            onChange={(e) => setWarnGuard(e.target.checked)}
          />
          Warn before leaving (beforeunload)
        </label>

        <div className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/50" data-testid="prompt-log">
          confirm → <span data-testid="confirm-result">{confirmResult}</span>
          <br />
          prompt →{' '}
          <span data-testid="prompt-result">{promptResult === undefined ? 'not run' : String(promptResult)}</span>
        </div>
      </div>
    </ChallengeShell>
  );
}
