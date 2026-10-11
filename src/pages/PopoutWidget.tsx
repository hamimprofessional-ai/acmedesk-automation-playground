import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { DashboardStats } from '@/lib/types';

// Rendered in a separate browser window (window.open with size features).
export function PopoutWidget() {
  const { data } = useQuery({
    queryKey: ['stats', 'widget'],
    queryFn: () => apiGet<DashboardStats>('/api/stats'),
    refetchInterval: 10_000,
  });

  return (
    <div className="min-h-screen bg-slate-900 p-4 text-slate-100" data-testid="popout-widget-root">
      <h1 className="mb-3 text-sm font-semibold text-slate-300">Live Operations</h1>
      <div className="grid grid-cols-2 gap-3">
        <Tile label="Tickets" value={data?.totalTickets ?? '—'} />
        <Tile label="Open" value={data?.openTickets ?? '—'} />
        <Tile label="Urgent" value={data?.urgentTickets ?? '—'} tone="text-rose-400" />
        <Tile label="Low stock" value={data?.lowStock ?? '—'} tone="text-amber-400" />
      </div>
      <p className="mt-4 text-xs text-slate-500">Auto-refreshes every 10s.</p>
    </div>
  );
}

function Tile({ label, value, tone = 'text-brand-300' }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className="rounded-xl bg-slate-800 p-4">
      <p className={`text-2xl font-bold ${tone}`}>{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}
