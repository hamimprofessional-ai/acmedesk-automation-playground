import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Link } from 'react-router-dom';
import { Ticket, Users, Boxes, AlertOctagon, ExternalLink, ArrowUpRight } from 'lucide-react';
import { apiGet } from '@/lib/api';
import type { Activity } from '@/mocks/data';
import type { DashboardStats } from '@/lib/types';
import { formatNumber, relativeTime } from '@/lib/format';
import { useTranslation } from '@/lib/i18n';
import { LoadingBlock, ErrorState } from '@/components/States';

function Kpi({
  label,
  value,
  icon: Icon,
  tone,
  to,
}: {
  label: string;
  value: number | string;
  icon: typeof Ticket;
  tone: string;
  to: string;
}) {
  return (
    <Link to={to} className="card group p-4 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-5 w-5" />
        </span>
        <ArrowUpRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 dark:text-slate-600" />
      </div>
      <p className="mt-3 text-2xl font-bold">{formatNumber(Number(value))}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </Link>
  );
}

export function Dashboard() {
  const { t } = useTranslation();
  const statsQuery = useQuery({
    queryKey: ['stats'],
    queryFn: () => apiGet<DashboardStats>('/api/stats'),
  });
  const activityQuery = useQuery({
    queryKey: ['activity'],
    queryFn: () => apiGet<Activity[]>('/api/activity'),
  });

  function popOutWidget() {
    window.open(
      '/popout/widget',
      'acmedesk-widget',
      'width=480,height=380,menubar=no,toolbar=no,location=no,status=no',
    );
  }

  if (statsQuery.isLoading) return <LoadingBlock label="Loading dashboard…" />;
  if (statsQuery.isError) {
    return (
      <ErrorState
        message={(statsQuery.error as Error).message}
        onRetry={() => statsQuery.refetch()}
      />
    );
  }
  const stats = statsQuery.data!;
  const categoryData = Object.entries(stats.byCategory).map(([name, count]) => ({ name, count }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold" data-testid="page-title">
            {t('dashboard.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Live overview of support operations
          </p>
        </div>
        <button type="button" className="btn-secondary" data-testid="popout-widget" onClick={popOutWidget}>
          <ExternalLink className="h-4 w-4" />
          Pop out widget
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="Total tickets"
          value={stats.totalTickets}
          icon={Ticket}
          tone="bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
          to="/tickets"
        />
        <Kpi
          label="Open tickets"
          value={stats.openTickets}
          icon={AlertOctagon}
          tone="bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
          to="/tickets?status=open"
        />
        <Kpi
          label="Urgent"
          value={stats.urgentTickets}
          icon={AlertOctagon}
          tone="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
          to="/tickets?priority=urgent"
        />
        <Kpi
          label="Customers"
          value={stats.customers}
          icon={Users}
          tone="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          to="/customers"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold">Ticket volume (14 days)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.volume} margin={{ left: -18, right: 8, top: 4 }}>
                <defs>
                  <linearGradient id="created" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="resolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="day" fontSize={11} stroke="#94a3b8" />
                <YAxis fontSize={11} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="created" stroke="#6366f1" fill="url(#created)" />
                <Area type="monotone" dataKey="resolved" stroke="#10b981" fill="url(#resolved)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold">Tickets by category</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 24, right: 8 }}>
                <XAxis type="number" fontSize={11} stroke="#94a3b8" allowDecimals={false} />
                <YAxis type="category" dataKey="name" fontSize={11} width={80} stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="count" fill="#818cf8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold">Recent activity</h2>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800" data-testid="activity-feed">
            {activityQuery.data?.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                <span>
                  <strong className="font-medium">{a.actor}</strong>{' '}
                  <span className="text-slate-500 dark:text-slate-400">{a.action}</span>{' '}
                  <span className="font-mono text-xs text-brand-600 dark:text-brand-400">{a.target}</span>
                </span>
                <span className="text-xs text-slate-400">{relativeTime(a.time)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="text-sm font-semibold">Embedded analytics</h2>
            <span className="text-xs text-slate-400">third-party iframe</span>
          </div>
          <iframe
            title="Embedded analytics"
            data-testid="analytics-iframe"
            src="https://practicetestautomation.com/practice-test-login/"
            className="h-[32rem] w-full border-0 bg-white"
          />
        </div>
      </div>
    </div>
  );
}
