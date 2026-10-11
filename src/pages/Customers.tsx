import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Mail } from 'lucide-react';
import { apiGet } from '@/lib/api';
import type { Customer } from '@/mocks/data';
import type { Paginated } from '@/lib/types';
import { PlanBadge } from '@/components/Badges';
import { ErrorState, EmptyState } from '@/components/States';
import { DataLoaderScreen, useRandomLoadDelay } from '@/components/DataLoader';
import { VirtualList } from '@/components/VirtualList';
import { formatDate } from '@/lib/format';

export function Customers() {
  const [q, setQ] = useState('');
  const [plan, setPlan] = useState('');
  const [status, setStatus] = useState('');

  const { ready, duration } = useRandomLoadDelay();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['customers', { q, plan, status }],
    queryFn: () =>
      apiGet<Paginated<Customer>>('/api/customers', { q, plan, status, pageSize: 60 }),
  });

  const items = data?.items ?? [];
  const loading = isLoading || !ready;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold" data-testid="page-title">
          Customers
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {data ? `${data.total} customers` : 'Loading…'}
        </p>
      </div>

      <div className="card grid gap-3 p-4 md:grid-cols-3">
        <input
          className="input"
          placeholder="Search name, email or company…"
          aria-label="Search customers"
          data-testid="customer-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input" aria-label="Filter by plan" value={plan} onChange={(e) => setPlan(e.target.value)}>
          <option value="">All plans</option>
          {['free', 'pro', 'enterprise'].map((p) => (
            <option key={p} value={p}>
              {p[0].toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
        <select className="input" aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['active', 'trial', 'churned'].map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] gap-3 border-b border-slate-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800">
          <span>Name</span>
          <span>Company</span>
          <span>Plan</span>
          <span>Since</span>
          <span className="sr-only">Actions</span>
        </div>
        {loading ? (
          <DataLoaderScreen
            duration={duration}
            label="Loading customers…"
            hint="Preparing your customer data. This may take a few seconds."
            className="min-h-[420px]"
          />
        ) : isError ? (
          <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
        ) : items.length === 0 ? (
          <EmptyState title="No customers found" />
        ) : (
          <VirtualList
            items={items}
            rowHeight={56}
            height={520}
            testId="customer-virtual-list"
            renderRow={(c) => (
              <div
                data-testid={`customer-row-${c.id}`}
                className="grid h-full grid-cols-[2fr_2fr_1fr_1fr_auto] items-center gap-3 border-b border-slate-50 px-4 text-sm hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/50"
              >
                <Link to={`/customers/${c.id}`} className="font-medium hover:text-brand-600 dark:hover:text-brand-400">
                  {c.name}
                </Link>
                <span className="truncate text-slate-600 dark:text-slate-300">{c.company}</span>
                <span>
                  <PlanBadge plan={c.plan} />
                </span>
                <span className="text-slate-500">{formatDate(c.createdAt)}</span>
                <span className="flex items-center justify-end gap-1">
                  <a
                    href={`mailto:${c.email}`}
                    aria-label={`Email ${c.name}`}
                    className="rounded p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                  <Link
                    to={`/customers/${c.id}`}
                    aria-label={`Open ${c.name}`}
                    className="rounded p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </span>
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}
