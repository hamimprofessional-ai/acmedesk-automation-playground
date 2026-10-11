import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Download, FileText, Loader2, Sparkles } from 'lucide-react';
import { apiPost } from '@/lib/api';
import { downloadFile } from '@/lib/download';
import { toast } from '@/store/toast';
import { formatDateTime } from '@/lib/format';

interface GeneratedReport {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

const SCHEDULES = [
  { id: 'daily', label: 'Daily ops digest', cron: 'Every day 08:00' },
  { id: 'weekly', label: 'Weekly SLA summary', cron: 'Mondays 09:00' },
  { id: 'monthly', label: 'Monthly finance export', cron: '1st of month 07:00' },
];

export function Reports() {
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [flash, setFlash] = useState('');

  const generate = useMutation({
    mutationFn: (type: string) => apiPost<{ id: string; name: string }>('/api/reports/generate', { type }),
    onSuccess: (res) => {
      setReports((r) => [
        { id: res.id, name: res.name, slug: res.name.replace(/\.pdf$/, ''), createdAt: new Date().toISOString() },
        ...r,
      ]);
      toast.success({ title: 'Report generated', message: res.name });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  async function download(report: GeneratedReport) {
    try {
      const name = await downloadFile(`/api/reports/${report.slug}.pdf`, report.name);
      toast.success({ title: 'Downloaded', message: name });
      // Adversarial: a flash message that disappears very quickly.
      setFlash(`Saved ${name}`);
      setTimeout(() => setFlash(''), 800);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold" data-testid="page-title">
            Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Generate and download operational reports
          </p>
        </div>
        {flash && (
          <span
            data-testid="flash-message"
            className="animate-flash rounded-lg bg-emerald-100 px-3 py-1.5 text-sm text-emerald-800"
          >
            {flash}
          </span>
        )}
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold">Generate a report</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary"
            data-testid="generate-summary"
            disabled={generate.isPending}
            onClick={() => generate.mutate('summary')}
          >
            {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Summary report
          </button>
          <button
            type="button"
            className="btn-secondary"
            data-testid="generate-sla"
            disabled={generate.isPending}
            onClick={() => generate.mutate('sla')}
          >
            <FileText className="h-4 w-4" /> SLA report
          </button>

          {/* New tab opened via form submission (not a click handler). */}
          <form target="_blank" action="/tickets" method="get" className="inline">
            <input type="hidden" name="view" value="print" />
            <button type="submit" className="btn-secondary" data-testid="preview-newtab">
              <FileText className="h-4 w-4" /> Preview in new tab
            </button>
          </form>
        </div>

        <div className="mt-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Generated this session
          </h3>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800" data-testid="generated-reports">
            {reports.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-rose-500" />
                  <div>
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-slate-400">{formatDateTime(r.createdAt)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-secondary text-sm"
                  data-testid={`download-${r.slug}`}
                  onClick={() => download(r)}
                >
                  <Download className="h-4 w-4" /> Download
                </button>
              </li>
            ))}
            {reports.length === 0 && (
              <li className="py-3 text-sm text-slate-400">No reports generated yet.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold">Scheduled reports</h2>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {SCHEDULES.map((s) => (
            <li key={s.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-xs text-slate-400">{s.cron}</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" defaultChecked={s.id !== 'monthly'} />
                <span className="h-5 w-9 rounded-full bg-slate-300 peer-checked:bg-brand-600 dark:bg-slate-700" />
                <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white transition-all peer-checked:translate-x-4" />
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
