import { useEffect, useState } from 'react';
import { Save, Palette, Globe, Gauge, Plug, Truck } from 'lucide-react';
import { useUIStore, type Density, type Theme } from '@/store/ui';
import { LOCALES } from '@/lib/i18n';
import { mockConfig } from '@/mocks/config';
import { toast } from '@/store/toast';

export function Settings() {
  const { theme, setTheme, locale, setLocale, density, setDensity } = useUIStore();
  const [latency, setLatency] = useState(mockConfig.latencyMs);
  const [failureRate, setFailureRate] = useState(Math.round(mockConfig.failureRate * 100));
  const [pageSize, setPageSize] = useState(mockConfig.pageSize);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.source === 'acmedesk-vendor' && e.data?.type === 'status-refreshed') {
        toast.info(`Vendor status refreshed (in transit: ${e.data.payload?.transit})`);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  function applyMockConfig() {
    mockConfig.latencyMs = latency;
    mockConfig.failureRate = failureRate / 100;
    mockConfig.pageSize = pageSize;
    toast.success('Backend simulation updated');
  }

  function resetConsent() {
    localStorage.removeItem('acmedesk-consent');
    toast.info('Consent banner will show again on next load');
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold" data-testid="page-title">
        Settings
      </h1>

      <section className="card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Palette className="h-4 w-4" /> Appearance
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="label">Theme</span>
            <div className="flex gap-2">
              {(['light', 'dark'] as Theme[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  data-testid={`theme-${t}`}
                  onClick={() => setTheme(t)}
                  className={`btn ${theme === t ? 'btn-primary' : 'btn-secondary'} capitalize`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="density">
              Density
            </label>
            <select
              id="density"
              className="input"
              value={density}
              onChange={(e) => setDensity(e.target.value as Density)}
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button type="button" className="btn-primary" data-testid="save-appearance" onClick={() => toast.success('Appearance saved')}>
            <Save className="h-4 w-4" /> Save
          </button>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Globe className="h-4 w-4" /> Language & region
        </h2>
        <label className="label" htmlFor="locale">
          Interface language
        </label>
        <select
          id="locale"
          className="input max-w-xs"
          data-testid="settings-locale"
          value={locale}
          onChange={(e) => setLocale(e.target.value as typeof locale)}
        >
          {LOCALES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.native} ({l.label})
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-slate-400">
          Arabic switches the interface to right-to-left (RTL).
        </p>
        <div className="mt-4 flex justify-end">
          <button type="button" className="btn-primary" data-testid="save-language" onClick={() => toast.success('Language saved')}>
            <Save className="h-4 w-4" /> Save
          </button>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Gauge className="h-4 w-4" /> Backend simulation
        </h2>
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="latency">
              Network latency: {latency} ms
            </label>
            <input
              id="latency"
              type="range"
              min={0}
              max={3000}
              step={50}
              value={latency}
              onChange={(e) => setLatency(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="label" htmlFor="failure">
              Failure rate: {failureRate}%
            </label>
            <input
              id="failure"
              type="range"
              min={0}
              max={100}
              step={5}
              value={failureRate}
              onChange={(e) => setFailureRate(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="label" htmlFor="pagesize">
              Page size
            </label>
            <input
              id="pagesize"
              type="number"
              min={5}
              max={100}
              className="input max-w-32"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <button type="button" className="btn-ghost text-sm" onClick={resetConsent}>
            Reset consent banner
          </button>
          <button type="button" className="btn-primary" data-testid="save-backend" onClick={applyMockConfig}>
            <Save className="h-4 w-4" /> Save
          </button>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Plug className="h-4 w-4" /> Integration
          </h2>
          <span className="text-xs text-slate-400">demoqa.com (external site)</span>
        </div>
        <iframe
          title="Third-party integration"
          data-testid="integration-iframe"
          src="https://demoqa.com/"
          className="h-96 w-full border-t border-slate-200 bg-white dark:border-slate-700"
        />
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Truck className="h-4 w-4" /> Vendor portal
          </h2>
          <span className="text-xs text-slate-400">nested iframe</span>
        </div>
        <iframe
          title="ParcelPal vendor portal"
          data-testid="vendor-iframe"
          src="/embed/vendor"
          className="h-[32rem] w-full border-t border-slate-200 bg-slate-100 dark:border-slate-700"
        />
        <p className="bg-slate-50 px-5 py-2.5 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          The portal (level 1) embeds a status widget (level 2). Clicking{" "}
          <code className="rounded bg-slate-200 px-1 dark:bg-slate-700">Refresh status</code> inside
          the innermost frame relays a message through both iframe levels to this page.
        </p>
      </section>
    </div>
  );
}
