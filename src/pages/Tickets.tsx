import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  Plus,
  ExternalLink,
  Trash2,
  Copy,
  MoreHorizontal,
  LayoutGrid,
  List,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import type { Ticket, TicketStatus } from '@/mocks/data';
import { ASSIGNEES, CATEGORIES, CURRENT_USER } from '@/mocks/data';
import type { Paginated } from '@/lib/types';
import { downloadFile } from '@/lib/download';
import { relativeTime } from '@/lib/format';
import { toast } from '@/store/toast';
import { cn } from '@/lib/cn';
import { StatusBadge, PriorityBadge } from '@/components/Badges';
import { Pagination } from '@/components/Pagination';
import { LoadingBlock, ErrorState, EmptyState } from '@/components/States';
import { ContextMenu, type ContextMenuItem } from '@/components/ContextMenu';
import { DropdownMenu } from '@/components/DropdownMenu';
import { Tooltip } from '@/components/Tooltip';
import { Modal } from '@/components/Modal';
import { KanbanBoard } from '@/features/tickets/KanbanBoard';
import { SavedViews } from '@/features/tickets/SavedViews';

const STATUSES: TicketStatus[] = ['open', 'pending', 'resolved', 'closed'];

export function Tickets() {
  const [params, setParams] = useSearchParams();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; ticket: Ticket } | null>(null);
  const [rowMenu, setRowMenu] = useState<{ anchor: DOMRect; ticket: Ticket } | null>(null);
  const [deleted, setDeleted] = useState<{ ref?: string; count: number } | null>(null);

  const q = params.get('q') ?? '';
  const statuses = params.getAll('status');
  const priority = params.get('priority') ?? '';
  const category = params.get('category') ?? '';
  const assignee = params.get('assignee') ?? '';
  const sort = params.get('sort') ?? 'updatedAt';
  const dir = params.get('dir') ?? 'desc';
  const page = Number(params.get('page') ?? 1);
  const view = params.get('view') ?? 'table';

  const queryParams = useMemo(
    () => ({
      q,
      status: statuses,
      priority,
      category,
      assignee,
      sort,
      dir,
      page,
      pageSize: view === 'board' ? 100 : 15,
    }),
    [q, statuses.join(','), priority, category, assignee, sort, dir, page, view],
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['tickets', queryParams],
    queryFn: () => apiGet<Paginated<Ticket>>('/api/tickets', queryParams as never),
  });

  function update(mutate: (p: URLSearchParams) => void) {
    const next = new URLSearchParams(params);
    mutate(next);
    setParams(next, { replace: false });
  }

  function setFilter(key: string, value: string) {
    update((p) => {
      if (value) p.set(key, value);
      else p.delete(key);
      p.delete('page');
    });
  }

  function toggleStatus(status: TicketStatus) {
    update((p) => {
      const current = p.getAll('status');
      p.delete('status');
      const next = current.includes(status)
        ? current.filter((s) => s !== status)
        : [...current, status];
      next.forEach((s) => p.append('status', s));
      p.delete('page');
    });
  }

  function onSort(column: string) {
    update((p) => {
      if (p.get('sort') === column) {
        p.set('dir', p.get('dir') === 'asc' ? 'desc' : 'asc');
      } else {
        p.set('sort', column);
        p.set('dir', 'desc');
      }
    });
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/tickets/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
  });

  const duplicateMutation = useMutation({
    mutationFn: (t: Ticket) =>
      apiPost('/api/tickets', {
        subject: `${t.subject} (copy)`,
        description: t.description,
        priority: t.priority,
        category: t.category,
        customerId: t.customerId,
      }),
    onSuccess: () => {
      toast.success('Ticket duplicated');
      qc.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TicketStatus }) =>
      apiPatch(`/api/tickets/${id}`, { status }),
    onSuccess: (_d, vars) => {
      toast.success(`Moved ticket to ${vars.status}`);
      qc.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, assignee }: { id: string; assignee: string }) =>
      apiPatch(`/api/tickets/${id}`, { assignee }),
    onSuccess: (_d, vars) => {
      toast.success(`Assigned to ${vars.assignee}`);
      qc.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  async function exportCsv() {
    try {
      const name = await downloadFile(`/api/tickets/export.csv?${filterQs()}`, 'tickets.csv');
      toast.success({ title: 'Export ready', message: name });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function filterQs(): string {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    statuses.forEach((s) => p.append('status', s));
    if (priority) p.set('priority', priority);
    if (category) p.set('category', category);
    if (assignee) p.set('assignee', assignee);
    return p.toString();
  }

  function confirmDelete(id: string, ref: string) {
    if (window.confirm(`Delete ticket ${ref}? This cannot be undone.`)) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          setDeleted({ ref, count: 1 });
          setSelected((s) => {
            const n = new Set(s);
            n.delete(id);
            return n;
          });
        },
        onError: (e) => toast.error((e as Error).message),
      });
    }
  }

  function bulkDelete() {
    const ids = Array.from(selected);
    if (!window.confirm(`Delete ${ids.length} selected ticket(s)?`)) return;
    Promise.all(ids.map((id) => apiDelete(`/api/tickets/${id}`).catch(() => null))).then(() => {
      setDeleted({ count: ids.length });
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ['tickets'] });
    });
  }

  function openContext(e: React.MouseEvent, ticket: Ticket) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, ticket });
  }

  function openDropdown(e: React.MouseEvent, ticket: Ticket) {
    if (rowMenu?.ticket.id === ticket.id) {
      setRowMenu(null);
      return;
    }
    setRowMenu({ anchor: (e.currentTarget as HTMLElement).getBoundingClientRect(), ticket });
  }

  const items = data?.items ?? [];
  const allSelected = items.length > 0 && items.every((t) => selected.has(t.id));

  function ticketItems(t: Ticket): ContextMenuItem[] {
    return [
      {
        label: 'Open in new tab',
        icon: <ExternalLink className="h-3.5 w-3.5" />,
        onClick: () => window.open(`/tickets/${t.id}`, '_blank', 'noopener'),
      },
      {
        label: 'Copy ticket link',
        icon: <Copy className="h-3.5 w-3.5" />,
        onClick: () => {
          navigator.clipboard?.writeText(`${window.location.origin}/tickets/${t.id}`);
          toast.info('Link copied to clipboard');
        },
      },
      {
        label: 'Duplicate',
        icon: <Copy className="h-3.5 w-3.5" />,
        onClick: () => duplicateMutation.mutate(t),
      },
      {
        label: 'Assign to me',
        icon: <UserPlus className="h-3.5 w-3.5" />,
        onClick: () => assignMutation.mutate({ id: t.id, assignee: CURRENT_USER }),
      },
      {
        label: 'Mark as resolved',
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        onClick: () => statusMutation.mutate({ id: t.id, status: 'resolved' }),
      },
      {
        label: 'Delete',
        icon: <Trash2 className="h-3.5 w-3.5" />,
        danger: true,
        onClick: () => confirmDelete(t.id, t.ref),
      },
    ];
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold" data-testid="page-title">
            Support Tickets
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {data ? `${data.total} tickets` : 'Loading…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SavedViews
            currentQuery={params.toString()}
            onApply={(query) => setParams(new URLSearchParams(query))}
          />
          <button type="button" className="btn-secondary" data-testid="export-tickets" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <Link to="/tickets/new" className="btn-primary" data-testid="new-ticket">
            <Plus className="h-4 w-4" />
            New ticket
          </Link>
        </div>
      </div>

      <div className="card p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <input
              className="input"
              placeholder="Search by subject, customer, ref…"
              aria-label="Search tickets"
              data-testid="ticket-search"
              value={q}
              onChange={(e) => setFilter('q', e.target.value)}
            />
          </div>
          <select
            className="input"
            aria-label="Filter by priority"
            data-testid="filter-priority"
            value={priority}
            onChange={(e) => setFilter('priority', e.target.value)}
          >
            <option value="">All priorities</option>
            {['low', 'medium', 'high', 'urgent'].map((p) => (
              <option key={p} value={p}>
                {p[0].toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
          <select
            className="input"
            aria-label="Filter by category"
            data-testid="filter-category"
            value={category}
            onChange={(e) => setFilter('category', e.target.value)}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="me-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Status
          </span>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              data-testid={`status-chip-${s}`}
              onClick={() => toggleStatus(s)}
              aria-pressed={statuses.includes(s)}
              className={cn(
                'badge border capitalize',
                statuses.includes(s)
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                  : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800',
              )}
            >
              {s}
            </button>
          ))}
          <select
            className="input ms-auto max-w-44"
            aria-label="Filter by assignee"
            data-testid="filter-assignee"
            value={assignee}
            onChange={(e) => setFilter('assignee', e.target.value)}
          >
            <option value="">All assignees</option>
            <option value={CURRENT_USER}>{CURRENT_USER} (me)</option>
            {ASSIGNEES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <div className="flex overflow-hidden rounded-lg border border-slate-300 dark:border-slate-700">
            <button
              type="button"
              data-testid="view-table"
              aria-label="Table view"
              onClick={() => setFilter('view', '')}
              className={cn('px-2.5 py-2', view === 'table' ? 'bg-brand-50 text-brand-600' : 'bg-white dark:bg-slate-800')}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              data-testid="view-board"
              aria-label="Board view"
              onClick={() => setFilter('view', 'board')}
              className={cn('px-2.5 py-2', view === 'board' ? 'bg-brand-50 text-brand-600' : 'bg-white dark:bg-slate-800')}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {selected.size > 0 && (
          <div
            className="mt-3 flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2 text-sm dark:bg-brand-950/40"
            data-testid="bulk-bar"
          >
            <span className="font-medium text-brand-700 dark:text-brand-300">
              {selected.size} selected
            </span>
            <div className="flex gap-2">
              <button type="button" className="btn-ghost text-sm" onClick={() => setSelected(new Set())}>
                Clear
              </button>
              <button
                type="button"
                className="btn-danger text-sm"
                data-testid="bulk-delete"
                onClick={bulkDelete}
              >
                <Trash2 className="h-4 w-4" />
                Delete selected
              </button>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <LoadingBlock />
      ) : isError ? (
        <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title="No tickets match your filters" message="Try clearing filters." />
      ) : view === 'board' ? (
        <KanbanBoard
          tickets={items}
          onDrop={(id, status) => statusMutation.mutate({ id, status })}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="tickets-table">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60">
                <tr>
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select all rows"
                      data-testid="select-all"
                      checked={allSelected}
                      onChange={(e) =>
                        setSelected(e.target.checked ? new Set(items.map((t) => t.id)) : new Set())
                      }
                    />
                  </th>
                  <th className="px-3 py-3">
                    <button type="button" onClick={() => onSort('ref')} className="hover:text-brand-600">
                      Ref
                    </button>
                  </th>
                  <th className="px-3 py-3">Subject</th>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Priority</th>
                  <th className="px-3 py-3">
                    <button type="button" onClick={() => onSort('updatedAt')} className="hover:text-brand-600">
                      Updated
                    </button>
                  </th>
                  <th className="w-24 px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((t) => (
                  <tr
                    key={t.id}
                    data-testid={`ticket-row-${t.ref}`}
                    onContextMenu={(e) => openContext(e, t)}
                    className="group hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        aria-label={`Select ${t.ref}`}
                        checked={selected.has(t.id)}
                        onChange={(e) =>
                          setSelected((s) => {
                            const n = new Set(s);
                            if (e.target.checked) n.add(t.id);
                            else n.delete(t.id);
                            return n;
                          })
                        }
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <Link
                        to={`/tickets/${t.id}`}
                        data-testid={`ticket-ref-${t.ref}`}
                        className="font-mono text-xs text-brand-600 hover:text-brand-500 hover:underline dark:text-brand-400 dark:hover:text-brand-300"
                      >
                        {t.ref}
                      </Link>
                    </td>
                    <td className="max-w-xs px-3 py-2.5">
                      <span className="font-medium text-slate-800 dark:text-slate-100">{t.subject}</span>
                      {t.tags.length > 0 && (
                        <div className="mt-1 flex gap-1">
                          {t.tags.map((tag) => (
                            <span key={tag} className="badge bg-slate-100 text-[10px] text-slate-500 dark:bg-slate-800">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{t.customerName}</td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-3 py-2.5">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-3 py-2.5 text-slate-500">{relativeTime(t.updatedAt)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                        <Tooltip label="Open in new tab" testId={`tooltip-newtab-${t.ref}`}>
                          <a
                            href={`/tickets/${t.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid={`open-newtab-${t.ref}`}
                            aria-label={`Open ${t.ref} in new tab`}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Tooltip>
                        <Tooltip label="More actions" testId={`tooltip-more-${t.ref}`}>
                          <button
                            type="button"
                            aria-label={`More actions for ${t.ref}`}
                            aria-haspopup="menu"
                            data-testid={`row-menu-${t.ref}`}
                            onClick={(e) => openDropdown(e, t)}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </Tooltip>
                      </div>
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
              onPageChange={(p) => update((sp) => sp.set('page', String(p)))}
            />
          </div>
        </div>
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={ticketItems(contextMenu.ticket)}
          onClose={() => setContextMenu(null)}
        />
      )}
      {rowMenu && (
        <DropdownMenu
          anchor={rowMenu.anchor}
          items={ticketItems(rowMenu.ticket)}
          triggerId={`row-menu-${rowMenu.ticket.ref}`}
          testId={`row-actions-menu-${rowMenu.ticket.ref}`}
          onClose={() => setRowMenu(null)}
        />
      )}

      {deleted && (
        <Modal
          open
          size="sm"
          testId="deleted-modal"
          title="Ticket deleted"
          description={
            deleted.ref
              ? `Ticket ${deleted.ref} has been deleted.`
              : `${deleted.count} ticket(s) have been deleted.`
          }
          onClose={() => setDeleted(null)}
          footer={
            <button
              type="button"
              data-testid="deleted-ok"
              className="btn-primary"
              onClick={() => setDeleted(null)}
            >
              Done
            </button>
          }
        >
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" data-testid="deleted-icon" />
            </span>
            The change is already saved.
          </div>
        </Modal>
      )}
    </div>
  );
}
