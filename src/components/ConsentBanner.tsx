import { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';

const KEY = 'acmedesk-consent';
// Intentionally overlays the bottom of the viewport (occlusion edge case):
// while visible it can cover content near the bottom of the page.
export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(localStorage.getItem(KEY) !== 'accepted');
  }, []);

  if (!visible) return null;

  return (
    <div
      data-testid="consent-banner"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <Cookie className="h-4 w-4" />
          <span>AcmeDesk uses cookies to remember your preferences.</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-ghost text-sm"
            onClick={() => {
              localStorage.setItem(KEY, 'accepted');
              setVisible(false);
            }}
          >
            Decline
          </button>
          <button
            type="button"
            data-testid="consent-accept"
            className="btn-primary text-sm"
            onClick={() => {
              localStorage.setItem(KEY, 'accepted');
              setVisible(false);
            }}
          >
            Accept cookies
          </button>
        </div>
      </div>
    </div>
  );
}
