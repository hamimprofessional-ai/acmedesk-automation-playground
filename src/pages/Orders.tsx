import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download, Plus } from 'lucide-react';
import { apiGet } from '@/lib/api';
import type { Order } from '@/mocks/data';
import { ORDER_CHANNELS, ORDER_STATUSES, PAYMENT_STATUSES } from '@/mocks/data';
import type { Paginated } from '@/lib/types';
import { downloadFile } from '@/lib/download';
import { formatCurrency, formatDate } from '@/lib/format';
import { toast } from '@/store/toast';
import { OrderStatusBadge, PaymentBadge } from '@/components/Badges';
import { Pagination } from '@/components/Pagination';
import { LoadingBlock, ErrorState, EmptyState } from '@/components/States';

interface OrdersResponse extends Paginated<Order> {
  counts: Record<string, number>;
}

export function Orders() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [payment, setPayment] = useState('');
  const [channel, setChannel] = useState('');
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({ q, status, payment, channel, page, pageSize: 15 }),
    [q, status, payment, channel, page],
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['orders', params],
    queryFn: () => apiGet<OrdersResponse>('/api/orders', params as never),
  });

  async function exportCsv() {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (status) p.set('status', status);
    if (payment) p.set('payment', payment);
    if (channel) p.set('channel', channel);
    try {
      const name = await downloadFile(`/api/orders/export.csv?${p.toString()}`, 'orders.csv');
      toast.success({ title: 'Export ready', message: name });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const items = data?.items ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold" data-testid="page-title">
            Orders
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {data ? `${data.total} orders` : 'Loading…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-secondary" data-testid="export-orders" onClick={exportCsv}>
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <Link to="/orders/new" className="btn-primary" data-testid="new-order">
            <Plus className="h-4 w-4" /> New order
          </Link>
        </div>
      </div>

      <div className="card grid gap-3 p-4 md:grid-cols-4">
        <input
          className="input md:col-span-2"
          placeholder="Search ref, customer or tracking…"
          aria-label="Search orders"
          data-testid="order-search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="input"
          aria-label="Filter by status"
          data-testid="filter-order-status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
              {data ? ` (${data.counts?.[s] ?? 0})` : ''}
            </option>
          ))}
        </select>
        <select
          className="input"
          aria-label="Filter by payment"
          data-testid="filter-order-payment"
          value={payment}
          onChange={(e) => {
            setPayment(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All payments</option>
          {PAYMENT_STATUSES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          className="input"
          aria-label="Filter by channel"
          data-testid="filter-order-channel"
          value={channel}
          onChange={(e) => {
            setChannel(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All channels</option>
          {ORDER_CHANNELS.map((c) => (
            <option key={c} value={c}>
              {c}
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
          <EmptyState title="No orders found" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="orders-table">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60">
                  <tr>
                    <th className="px-4 py-3">Ref</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3 text-right">Items</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Channel</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((o) => (
                    <tr
                      key={o.id}
                      data-testid={`order-row-${o.ref}`}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-4 py-2.5">
                        <Link
                          to={`/orders/${o.id}`}
                          data-testid={`order-ref-${o.ref}`}
                          className="font-mono text-xs text-brand-600 hover:underline dark:text-brand-400"
                        >
                          {o.ref}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                        {o.customerName}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {o.items.reduce((s, it) => s + it.quantity, 0)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(o.total)}</td>
                      <td className="px-4 py-3">
                        <PaymentBadge status={o.paymentStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={o.status} />
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-500">{o.channel}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(o.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/orders/${o.id}`} className="btn-ghost px-2 py-1 text-xs">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
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