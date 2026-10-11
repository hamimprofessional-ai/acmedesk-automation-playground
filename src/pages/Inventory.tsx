import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, PackageSearch } from 'lucide-react';
import { apiGet, apiPatch } from '@/lib/api';
import type { Product } from '@/mocks/data';
import type { Paginated } from '@/lib/types';
import { downloadFile } from '@/lib/download';
import { formatCurrency, formatDate } from '@/lib/format';
import { toast } from '@/store/toast';
import { cn } from '@/lib/cn';
import { Modal } from '@/components/Modal';
import { Pagination } from '@/components/Pagination';
import { LoadingBlock, ErrorState, EmptyState } from '@/components/States';

interface InventoryResponse extends Paginated<Product> {
  categories: string[];
  warehouses: string[];
}

export function Inventory() {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Product | null>(null);
  const [stockValue, setStockValue] = useState('0');
  const qc = useQueryClient();

  const params = useMemo(
    () => ({ q, category, warehouse, lowStock: lowStock ? 'true' : '', page, pageSize: 12 }),
    [q, category, warehouse, lowStock, page],
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['inventory', params],
    queryFn: () => apiGet<InventoryResponse>('/api/inventory', params as never),
  });

  const updateMutation = useMutation({
    mutationFn: () => apiPatch(`/api/inventory/${editing!.id}`, { stock: Number(stockValue) }),
    onSuccess: () => {
      toast.success('Stock updated');
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  async function exportCsv() {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (category) p.set('category', category);
    if (warehouse) p.set('warehouse', warehouse);
    if (lowStock) p.set('lowStock', 'true');
    try {
      const name = await downloadFile(`/api/inventory/export.csv?${p.toString()}`, 'inventory.csv');
      toast.success({ title: 'Export ready', message: name });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const items = data?.items ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold" data-testid="page-title">
            Inventory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {data ? `${data.total} products` : 'Loading…'}
          </p>
        </div>
        <button type="button" className="btn-secondary" data-testid="export-inventory" onClick={exportCsv}>
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <div className="card grid gap-3 p-4 md:grid-cols-4">
        <input
          className="input md:col-span-2"
          placeholder="Search SKU or product…"
          aria-label="Search inventory"
          data-testid="inventory-search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="input"
          aria-label="Filter by category"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All categories</option>
          {data?.categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="input"
          aria-label="Filter by warehouse"
          value={warehouse}
          onChange={(e) => {
            setWarehouse(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All warehouses</option>
          {data?.warehouses.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm md:col-span-4">
          <input
            type="checkbox"
            data-testid="low-stock-filter"
            checked={lowStock}
            onChange={(e) => {
              setLowStock(e.target.checked);
              setPage(1);
            }}
          />
          Show only low-stock items (stock ≤ reorder level)
        </label>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <LoadingBlock />
        ) : isError ? (
          <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
        ) : items.length === 0 ? (
          <EmptyState title="No products found" />
        ) : (
          <>
            <div className="max-h-[560px] overflow-auto">
              <table className="w-full text-sm" data-testid="inventory-table">
                <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 shadow-sm dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Warehouse</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-right">Stock</th>
                    <th className="px-4 py-3 text-right">Reorder</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((p) => {
                    const low = p.stock <= p.reorderLevel;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{p.sku}</td>
                        <td className="px-4 py-2.5 font-medium">{p.name}</td>
                        <td className="px-4 py-2.5 text-slate-500">{p.category}</td>
                        <td className="px-4 py-2.5 text-slate-500">{p.warehouse}</td>
                        <td className="px-4 py-2.5 text-right">{formatCurrency(p.price)}</td>
                        <td className={cn('px-4 py-2.5 text-right font-semibold', low ? 'text-rose-600 dark:text-rose-400' : '')}>
                          {p.stock}
                          {low && (
                            <span className="ms-2 badge bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                              low
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-400">{p.reorderLevel}</td>
                        <td className="px-4 py-2.5 text-slate-500">{formatDate(p.updatedAt)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            type="button"
                            data-testid={`adjust-${p.sku}`}
                            className="btn-ghost px-2 py-1 text-xs"
                            onClick={() => {
                              setEditing(p);
                              setStockValue(String(p.stock));
                            }}
                          >
                            <PackageSearch className="h-3.5 w-3.5" /> Adjust
                          </button>
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

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Adjust stock"
        description={editing ? `${editing.name} (${editing.sku})` : ''}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              data-testid="save-stock"
              disabled={updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
            >
              Save
            </button>
          </>
        }
      >
        <label className="label" htmlFor="stock">
          New stock level
        </label>
        <input
          id="stock"
          type="number"
          min={0}
          className="input"
          data-testid="stock-input"
          value={stockValue}
          onChange={(e) => setStockValue(e.target.value)}
        />
        {editing && (
          <p className="mt-2 text-xs text-slate-400">
            Reorder level is {editing.reorderLevel}. Values at or below this are flagged low.
          </p>
        )}
      </Modal>
    </div>
  );
}
