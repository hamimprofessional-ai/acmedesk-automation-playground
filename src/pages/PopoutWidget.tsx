import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { DashboardStats } from '@/lib/types';
import { DataLoaderScreen, useRandomLoadDelay } from '@/components/DataLoader';

// Rendered in a separate browser window (window.open with size features).
export function PopoutWidget() {
  const { ready, duration } = useRandomLoadDelay();

  const { data, isLoading } = useQuery({
    queryKey: ['stats', 'widget'],
    queryFn: () => apiGet<DashboardStats>('/api/stats'),
    refetchInterval: 10_000,
  });

  const loading = isLoading || !ready;

  return (
    <div className="min-h-screen bg-slate-900 p-4 text-slate-100" data-testid="popout-widget-root">
      <h1 className="mb-3 text-sm font-semibold text-slate-300">Live Operations</h1>
      {loading ? (
        <DataLoaderScreen
          duration={duration}
          label="Loading live operations…"
          className="text-slate-300"
          trackClassName="bg-slate-700"
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Tile label="Tickets" value={data?.totalTickets ?? '—'} />
          <Tile label="Open" value={data?.openTickets ?? '—'} />
          <Tile label="Urgent" value={data?.urgentTickets ?? '—'} />
          <Tile label="Low stock" value={data?.lowStock ?? '—'} />
        </div>
      )}
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
