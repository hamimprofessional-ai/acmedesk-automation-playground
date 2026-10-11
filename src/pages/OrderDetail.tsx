import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Ban, PackageCheck, RotateCcw, Truck } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import type { Order, ReturnRequest, ShipmentEvent } from '@/mocks/data';
import { RETURN_REASONS } from '@/mocks/data';
import { formatCurrency, formatDate, relativeTime } from '@/lib/format';
import { toast } from '@/store/toast';
import { OrderStatusBadge, PaymentBadge, ShipmentBadge, ReturnBadge } from '@/components/Badges';
import { Modal } from '@/components/Modal';
import { LoadingBlock, ErrorState, EmptyState } from '@/components/States';

interface OrderResponse {
  order: Order;
  shipments: ShipmentEvent[];
  returns: ReturnRequest[];
}

export function OrderDetail() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const [returnOpen, setReturnOpen] = useState(false);
  const [reason, setReason] = useState(RETURN_REASONS[0]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => apiGet<OrderResponse>(`/api/orders/${id}`),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['order', id] });
  const onError = (e: unknown) => toast.error((e as Error).message);

  const ship = useMutation({
    mutationFn: () => apiPost(`/api/orders/${id}/ship`, {}),
    onSuccess: () => {
      toast.success('Shipment created');
      invalidate();
    },
    onError,
  });
  const advance = useMutation({
    mutationFn: () => apiPost(`/api/orders/${id}/advance`, {}),
    onSuccess: () => {
      toast.success('Shipment advanced');
      invalidate();
    },
    onError,
  });
  const refund = useMutation({
    mutationFn: () => apiPost(`/api/orders/${id}/refund`, {}),
    onSuccess: () => {
      toast.success('Order refunded');
      invalidate();
    },
    onError,
  });
  const cancel = useMutation({
    mutationFn: () => apiPost(`/api/orders/${id}/cancel`, {}),
    onSuccess: () => {
      toast.success('Order cancelled');
      invalidate();
    },
    onError,
  });
  const createReturn = useMutation({
    mutationFn: () => apiPost('/api/returns', { orderId: data!.order.id, reason }),
    onSuccess: (r) => {
      toast.success({ title: 'Return requested', message: (r as ReturnRequest).ref });
      setReturnOpen(false);
      invalidate();
    },
    onError,
  });

  if (isLoading) return <LoadingBlock />;
  if (isError || !data)
    return <ErrorState message={(error as Error)?.message ?? 'Order not found'} onRetry={() => refetch()} />;

  const { order, shipments, returns } = data;
  const latest = shipments[shipments.length - 1];
  const canShip = order.status === 'pending' || order.status === 'processing';
  const canAdvance = !!latest && latest.stage !== 'delivered';
  const canRefund = order.paymentStatus === 'paid' && order.status !== 'refunded';
  const canCancel = order.status === 'pending' || order.status === 'processing';
  const canReturn = order.status === 'delivered';

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <Link to="/orders" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="card flex flex-wrap items-start justify-between gap-5 p-5">
        <div>
          <h1 className="text-xl font-semibold" data-testid="order-ref">
            {order.ref}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {order.customerName} · placed {formatDate(order.createdAt)} · {order.channel}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentBadge status={order.paymentStatus} />
            {latest && <ShipmentBadge stage={latest.stage} />}
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold" data-testid="order-total">
            {formatCurrency(order.total)}
          </p>
          <p className="text-xs text-slate-400">{order.currency}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-secondary"
          data-testid="ship-order"
          disabled={!canShip || ship.isPending}
          onClick={() => ship.mutate()}
        >
          <Truck className="h-4 w-4" /> Create shipment
        </button>
        <button
          type="button"
          className="btn-secondary"
          data-testid="advance-shipment"
          disabled={!canAdvance || advance.isPending}
          onClick={() => advance.mutate()}
        >
          <PackageCheck className="h-4 w-4" /> Advance shipment
        </button>
        <button
          type="button"
          className="btn-secondary"
          data-testid="refund-order"
          disabled={!canRefund || refund.isPending}
          onClick={() => refund.mutate()}
        >
          <RotateCcw className="h-4 w-4" /> Refund
        </button>
        <button
          type="button"
          className="btn-ghost text-rose-500"
          data-testid="cancel-order"
          disabled={!canCancel || cancel.isPending}
          onClick={() => cancel.mutate()}
        >
          <Ban className="h-4 w-4" /> Cancel
        </button>
        <button
          type="button"
          className="btn-primary ms-auto"
          data-testid="request-return"
          disabled={!canReturn}
          onClick={() => setReturnOpen(true)}
        >
          Request return
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold">Items</h2>
          <table className="w-full text-sm" data-testid="order-items">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="py-2">SKU</th>
                <th className="py-2">Product</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Unit</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {order.items.map((it) => (
                <tr key={it.productId + it.sku} className="row">
                  <td className="py-2 font-mono text-xs text-slate-500">{it.sku}</td>
                  <td className="py-2 font-medium">{it.name}</td>
                  <td className="py-2 text-right">{it.quantity}</td>
                  <td className="py-2 text-right">{formatCurrency(it.unitPrice)}</td>
                  <td className="py-2 text-right font-medium">{formatCurrency(it.quantity * it.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <dl className="ms-auto mt-4 max-w-xs space-y-1 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
            <Row label="Subtotal" value={formatCurrency(order.subtotal)} />
            <Row label="Shipping" value={formatCurrency(order.shipping)} />
            <Row label="Tax" value={formatCurrency(order.tax)} />
            <Row label="Total" value={formatCurrency(order.total)} strong />
          </dl>

          {order.notes && (
            <div className="mt-4 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
              <p className="text-xs uppercase tracking-wide text-slate-400">Notes</p>
              <p className="mt-1 text-slate-600 dark:text-slate-300">{order.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold">Shipping</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">{order.shippingAddress || '—'}</p>
            {order.carrier && (
              <p className="mt-2 text-xs text-slate-400">
                {order.carrier} · {order.trackingNumber}
              </p>
            )}
          </div>

          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold">Tracking</h2>
            {shipments.length === 0 ? (
              <EmptyState title="Not shipped yet" />
            ) : (
              <ol className="space-y-3" data-testid="shipment-timeline">
                {shipments.map((s) => (
                  <li key={s.id} className="relative ps-5">
                    <span className="absolute start-0 top-1.5 h-2 w-2 rounded-full bg-brand-500" />
                    <p className="text-sm font-medium capitalize">{s.stage.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-400">
                      {s.location} · {relativeTime(s.at)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold">Returns</h2>
            {returns.length === 0 ? (
              <p className="text-sm text-slate-400">No returns.</p>
            ) : (
              <ul className="space-y-2" data-testid="order-returns">
                {returns.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{r.ref}</p>
                      <p className="text-xs text-slate-400">{r.reason}</p>
                    </div>
                    <ReturnBadge status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        title="Request return"
        description={order.ref}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setReturnOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              data-testid="confirm-return"
              disabled={createReturn.isPending}
              onClick={() => createReturn.mutate()}
            >
              Submit request
            </button>
          </>
        }
      >
        <label className="label" htmlFor="reason">
          Reason
        </label>
        <select
          id="reason"
          className="input"
          data-testid="return-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          {RETURN_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </Modal>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-400">{label}</dt>
      <dd className={strong ? 'font-semibold' : ''}>{value}</dd>
    </div>
  );
}