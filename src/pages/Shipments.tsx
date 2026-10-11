import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PackageCheck } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import type { OrderStatus, ShipmentStage } from '@/mocks/data';
import type { Paginated } from '@/lib/types';
import { toast } from '@/store/toast';
import { OrderStatusBadge, ShipmentBadge } from '@/components/Badges';
import { Pagination } from '@/components/Pagination';
import { LoadingBlock, ErrorState, EmptyState } from '@/components/States';

interface QueueRow {
  orderId: string;
  orderRef: string;
  stage: ShipmentStage | 'not_shipped';
  carrier: string;
  trackingNumber: string;
  status: OrderStatus;
  customerName: string;
}

interface ShipmentsResponse extends Paginated<QueueRow> {
  carriers: string[];
}

export function Shipments() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [carrier, setCarrier] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const params = useMemo(
    () => ({ q, status, carrier, page, pageSize: 12 }),
    [q, status, carrier, page],
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['shipments', params],
    queryFn: () => apiGet<ShipmentsResponse>('/api/shipments', params as never),
  });

  const advance = useMutation({
    mutationFn: (orderId: string) => apiPost(`/api/orders/${orderId}/advance`, {}),
    onSuccess: () => {
      toast.success('Shipment advanced');
      qc.invalidateQueries({ queryKey: ['shipments'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const items = data?.items ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold" data-testid="page-title">
          Shipments
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Fulfillment queue{data ? ` · ${data.total} shipments` : ''}
        </p>
      </div>

      <div className="card grid gap-3 p-4 md:grid-cols-4">
        <input
          className="input md:col-span-2"
          placeholder="Search ref, customer or tracking…"
          aria-label="Search shipments"
          data-testid="shipment-search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="input"
          aria-label="Filter by order status"
          data-testid="filter-shipment-status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {['pending', 'processing', 'shipped', 'delivered'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="input"
          aria-label="Filter by carrier"
          data-testid="filter-carrier"
          value={carrier}
          onChange={(e) => {
            setCarrier(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All carriers</option>
          {data?.carriers.map((c) => (
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
          <EmptyState title="Nothing to fulfill" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="shipments-table">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Carrier</th>
                    <th className="px-4 py-3">Tracking</th>
                    <th className="px-4 py-3">Stage</th>
                    <th className="px-4 py-3">Order status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((r) => (
                    <tr key={r.orderId} data-testid={`shipment-row-${r.orderRef}`} className="row">
                      <td className="px-4 py-2.5">
                        <Link
                          to={`/orders/${r.orderId}`}
                          className="font-mono text-xs text-brand-600 hover:underline dark:text-brand-400"
                        >
                          {r.orderRef}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">{r.customerName}</td>
                      <td className="px-4 py-2.5 text-slate-500">{r.carrier}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{r.trackingNumber}</td>
                      <td className="px-4 py-2.5">
                        <ShipmentBadge stage={r.stage} />
                      </td>
                      <td className="px-4 py-2.5">
                        <OrderStatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          className="btn-ghost px-2 py-1 text-xs"
                          data-testid="advance"
                          disabled={r.stage === 'delivered' || advance.isPending}
                          onClick={() => advance.mutate(r.orderId)}
                        >
                          <PackageCheck className="h-3.5 w-3.5" /> Advance
                        </button>
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