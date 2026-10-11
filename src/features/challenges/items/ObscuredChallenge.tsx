import { useState } from 'react';
import { ChallengeShell } from '../ChallengeShell';

export function ObscuredChallenge() {
  const [adOpen, setAdOpen] = useState(true);
  const [footerOpen, setFooterOpen] = useState(true);
  const [saved, setSaved] = useState(false);

  return (
    <ChallengeShell
      title="Overlays & occlusion"
      tier="medium"
      blurb="The primary button is covered by an ad overlay and a sticky cookie bar. Clicks on the button land on the overlay until you clear it — a classic 'element intercepts pointer events' failure."
      goal={[
        'Close the interstitial ad, then click "Save preferences".',
        'Accept (or decline) the sticky cookie bar pinned to the bottom.',
        'Confirm the toast that overlaps the action disappears before clicking it again.',
      ]}
      selector='getByRole("button", { name: "Save preferences" })'
    >
      <div className="relative space-y-5">
        <div className="relative overflow-hidden rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          <fieldset className="space-y-2" disabled={adOpen}>
            <legend className="text-sm font-medium">Notification preferences</legend>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" defaultChecked /> Product updates
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> Security alerts
            </label>
            <button
              type="button"
              className="btn-primary mt-2"
              data-testid="save-preferences"
              onClick={() => setSaved(true)}
            >
              Save preferences
            </button>
          </fieldset>

          {adOpen && (
            <div
              className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-slate-900/80 p-6 text-center backdrop-blur-sm"
              data-testid="ad-overlay"
            >
              <p className="text-sm font-semibold text-white">Upgrade to AcmeDesk Pro</p>
              <p className="text-xs text-slate-300">Unlock unlimited automations and priority support.</p>
              <button
                type="button"
                className="btn-secondary"
                data-testid="close-ad"
                onClick={() => setAdOpen(false)}
              >
                No thanks, continue
              </button>
            </div>
          )}
        </div>

        {saved && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400" data-testid="prefs-saved">
            Preferences saved.
          </p>
        )}

        <div className="h-24" />

        {footerOpen && (
          <div
            className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
            data-testid="sticky-cookie-bar"
          >
            <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 text-sm">
              <span>We use cookies to improve your experience. (Sticky bar covering the page bottom.)</span>
              <span className="flex gap-2">
                <button type="button" className="btn-ghost" data-testid="cookie-decline" onClick={() => setFooterOpen(false)}>
                  Decline
                </button>
                <button type="button" className="btn-primary" data-testid="cookie-accept" onClick={() => setFooterOpen(false)}>
                  Accept cookies
                </button>
              </span>
            </div>
          </div>
        )}
      </div>
    </ChallengeShell>
  );
}
