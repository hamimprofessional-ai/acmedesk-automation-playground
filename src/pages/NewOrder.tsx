import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import type { Customer, Order, OrderChannel, OrderLine, Product } from '@/mocks/data';
import { ORDER_CHANNELS } from '@/mocks/data';
import type { Paginated } from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import { toast } from '@/store/toast';

interface LineDraft {
  key: number;
  productId: string;
  quantity: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function NewOrder() {
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState('');
  const [channel, setChannel] = useState<OrderChannel>('web');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineDraft[]>([{ key: 1, productId: '', quantity: 1 }]);
  const [nextKey, setNextKey] = useState(2);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const customers = useQuery({
    queryKey: ['customers', 'order-wizard'],
    queryFn: () => apiGet<Paginated<Customer>>('/api/customers', { pageSize: 100 }),
  });
  const products = useQuery({
    queryKey: ['inventory', 'order-wizard'],
    queryFn: () => apiGet<Paginated<Product>>('/api/inventory', { pageSize: 100 }),
  });

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    products.data?.items.forEach((p) => map.set(p.id, p));
    return map;
  }, [products.data]);

  const totals = useMemo(() => {
    const subtotal = round2(
      lines.reduce((sum, l) => {
        const p = productById.get(l.productId);
        return sum + (p ? p.price * l.quantity : 0);
      }, 0),
    );
    const shipping = subtotal > 150 || subtotal === 0 ? 0 : 9.95;
    const tax = round2(subtotal * 0.21);
    return { subtotal, shipping, tax, total: round2(subtotal + shipping + tax) };
  }, [lines, productById]);

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiPost<Order>('/api/orders', body),
    onSuccess: (order) => {
      toast.success({ title: 'Order created', message: order.ref });
      navigate(`/orders/${order.id}`);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  function updateLine(key: number, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { key: nextKey, productId: '', quantity: 1 }]);
    setNextKey((k) => k + 1);
  }

  function removeLine(key: number) {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));
  }

  function submit() {
    const next: Record<string, string> = {};
    if (!customerId) next.customerId = 'Select a customer';
    const valid = lines.filter((l) => l.productId);
    if (valid.length === 0) next.lines = 'Add at least one product';
    if (lines.some((l) => l.productId && l.quantity < 1)) next.quantity = 'Quantity must be at least 1';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const items: OrderLine[] = valid.map((l) => {
      const p = productById.get(l.productId)!;
      return {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        quantity: l.quantity,
        unitPrice: p.price,
      };
    });
    createMutation.mutate({ customerId, channel, shippingAddress, notes, items });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold" data-testid="page-title">
        New order
      </h1>

      <div className="card space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="customer">
              Customer
            </label>
            <select
              id="customer"
              className="input"
              data-testid="order-customer"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">Select a customer…</option>
              {customers.data?.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.company}
                </option>
              ))}
            </select>
            {errors.customerId && <p className="mt-1 text-xs text-rose-500">{errors.customerId}</p>}
          </div>
          <div>
            <label className="label" htmlFor="channel">
              Channel
            </label>
            <select
              id="channel"
              className="input"
              data-testid="order-channel"
              value={channel}
              onChange={(e) => setChannel(e.target.value as OrderChannel)}
            >
              {ORDER_CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Line items</h2>
          <button type="button" className="btn-secondary" data-testid="add-line" onClick={addLine}>
            <Plus className="h-4 w-4" /> Add item
          </button>
        </div>

        {errors.lines && <p className="text-xs text-rose-500">{errors.lines}</p>}
        {errors.quantity && <p className="text-xs text-rose-500">{errors.quantity}</p>}

        <div className="space-y-2" data-testid="order-lines">
          {lines.map((l) => {
            const p = productById.get(l.productId);
            return (
              <div key={l.key} className="flex items-center gap-2" data-testid="order-line">
                <select
                  className="input flex-1"
                  aria-label="Product"
                  data-testid="line-product"
                  value={l.productId}
                  onChange={(e) => updateLine(l.key, { productId: e.target.value })}
                >
                  <option value="">Select a product…</option>
                  {products.data?.items.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.sku} — {prod.name} ({formatCurrency(prod.price)})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  className="input w-20"
                  aria-label="Quantity"
                  data-testid="line-quantity"
                  value={l.quantity}
                  onChange={(e) => updateLine(l.key, { quantity: Number(e.target.value) })}
                />
                <span className="w-24 text-right text-sm text-slate-500" data-testid="line-total">
                  {p ? formatCurrency(round2(p.price * l.quantity)) : '—'}
                </span>
                <button
                  type="button"
                  className="btn-ghost px-2 py-1 text-rose-500"
                  aria-label="Remove line"
                  data-testid="remove-line"
                  onClick={() => removeLine(l.key)}
                  disabled={lines.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

        <dl className="ms-auto max-w-xs space-y-1 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
          <Row label="Subtotal" value={formatCurrency(totals.subtotal)} />
          <Row label="Shipping" value={formatCurrency(totals.shipping)} />
          <Row label="Tax (21%)" value={formatCurrency(totals.tax)} />
          <Row label="Total" value={formatCurrency(totals.total)} strong />
        </dl>
      </div>

      <div className="card space-y-4 p-5">
        <div>
          <label className="label" htmlFor="address">
            Shipping address
          </label>
          <textarea
            id="address"
            className="input min-h-[72px]"
            data-testid="order-address"
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            className="input min-h-[72px]"
            data-testid="order-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button type="button" className="btn-ghost" onClick={() => navigate('/orders')}>
          Cancel
        </button>
        <button
          type="button"
          className="btn-primary"
          data-testid="create-order"
          disabled={createMutation.isPending}
          onClick={submit}
        >
          {createMutation.isPending ? 'Creating…' : 'Create order'}
        </button>
      </div>
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