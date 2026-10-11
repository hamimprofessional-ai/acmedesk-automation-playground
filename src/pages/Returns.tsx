import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@/lib/api';
import type { ReturnRequest, ReturnStatus } from '@/mocks/data';
import type { Paginated } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { toast } from '@/store/toast';
import { ReturnBadge } from '@/components/Badges';
import { Pagination } from '@/components/Pagination';
import { LoadingBlock, ErrorState, EmptyState } from '@/components/States';

interface ReturnsResponse extends Paginated<ReturnRequest> {
  counts: Record<string, number>;
}

const nextAction: Partial<Record<ReturnStatus, { to: ReturnStatus; label: string }>> = {
  requested: { to: 'approved', label: 'Approve' },
  approved: { to: 'received', label: 'Mark received' },
  received: { to: 'refunded', label: 'Refund' },
};

export function Returns() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const params = useMemo(() => ({ q, status, page, pageSize: 12 }), [q, status, page]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['returns', params],
    queryFn: () => apiGet<ReturnsResponse>('/api/returns', params as never),
  });

  const update = useMutation({
    mutationFn: ({ id, to }: { id: string; to: ReturnStatus }) =>
      apiPatch(`/api/returns/${id}`, { status: to }),
    onSuccess: (_res, vars) => {
      toast.success(`Return ${vars.to}`);
      qc.invalidateQueries({ queryKey: ['returns'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const items = data?.items ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold" data-testid="page-title">
          Returns
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {data ? `${data.total} requests` : 'Loading…'}
        </p>
      </div>

      <div className="card grid gap-3 p-4 md:grid-cols-3">
        <input
          className="input md:col-span-2"
          placeholder="Search RMA, order, customer or reason…"
          aria-label="Search returns"
          data-testid="return-search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="input"
          aria-label="Filter by status"
          data-testid="filter-return-status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {['requested', 'approved', 'rejected', 'received', 'refunded'].map((s) => (
            <option key={s} value={s}>
              {s}
              {data ? ` (${data.counts?.[s] ?? 0})` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <LoadingBlock />
        ) : isError ? (
          <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
        ) : items.length === 0 ? (
          <EmptyState title="No return requests" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="returns-table">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60">
                  <tr>
                    <th className="px-4 py-3">RMA</th>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((r) => {
                    const action = nextAction[r.status];
                    return (
                      <tr key={r.id} data-testid={`return-row-${r.ref}`} className="row">
                        <td className="px-4 py-2.5 font-mono text-xs">{r.ref}</td>
                        <td className="px-4 py-2.5">
                          <Link to={`/orders/${r.orderId}`} className="font-mono text-xs text-brand-600 hover:underline dark:text-brand-400">
                            {r.orderRef}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5">{r.customerName}</td>
                        <td className="px-4 py-2.5 text-slate-500">{r.reason}</td>
                        <td className="px-4 py-2.5 text-right">{formatCurrency(r.amount)}</td>
                        <td className="px-4 py-2.5">
                          <ReturnBadge status={r.status} />
                        </td>
                        <td className="px-4 py-2.5 text-slate-500">{formatDate(r.createdAt)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex justify-end gap-1">
                            {action && (
                              <button
                                type="button"
                                className="btn-ghost px-2 py-1 text-xs"
                                data-testid="return-next"
                                disabled={update.isPending}
                                onClick={() => update.mutate({ id: r.id, to: action.to })}
                              >
                                {action.label}
                              </button>
                            )}
                            {r.status === 'requested' && (
                              <button
                                type="button"
                                className="btn-ghost px-2 py-1 text-xs text-rose-500"
                                data-testid="return-reject"
                                disabled={update.isPending}
                                onClick={() => update.mutate({ id: r.id, to: 'rejected' })}
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 px-3 dark:border-slate-800">
              <Pagination
                page={data!.page}
                totalPages={data!.totalPages}
                total={data!.total}
                pageSize={data!.pageSize}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}