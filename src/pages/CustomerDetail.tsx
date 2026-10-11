import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Building2, Globe2, Mail } from 'lucide-react';
import { apiGet } from '@/lib/api';
import type { Customer, Ticket } from '@/mocks/data';
import { PlanBadge, StatusBadge, PriorityBadge } from '@/components/Badges';
import { LoadingBlock, ErrorState } from '@/components/States';
import { FileUpload } from '@/features/files/FileUpload';
import { formatDate, relativeTime } from '@/lib/format';

interface CustomerResponse {
  customer: Customer;
  tickets: Ticket[];
}

export function CustomerDetail() {
  const { id = '' } = useParams();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => apiGet<CustomerResponse>(`/api/customers/${id}`),
  });

  if (isLoading) return <LoadingBlock />;
  if (isError || !data) return <ErrorState message={(error as Error)?.message ?? 'Customer not found'} onRetry={() => refetch()} />;

  const { customer, tickets } = data;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Link to="/customers" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to customers
      </Link>

      <div className="card flex flex-wrap items-start gap-5 p-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
          {customer.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold" data-testid="customer-name">
            {customer.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" /> {customer.company}
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="h-4 w-4" />
              <a href={`mailto:${customer.email}`} className="hover:text-brand-600">
                {customer.email}
              </a>
            </span>
            <span className="flex items-center gap-1.5">
              <Globe2 className="h-4 w-4" /> {customer.country}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <PlanBadge plan={customer.plan} />
            <span className="badge bg-slate-100 capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {customer.status}
            </span>
            <span className="text-xs text-slate-400">Customer since {formatDate(customer.createdAt)}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{customer.totalTickets}</p>
            <p className="text-xs text-slate-400">Total tickets</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{tickets.length}</p>
            <p className="text-xs text-slate-400">Recent</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold">Recent tickets</h2>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800" data-testid="customer-tickets">
            {tickets.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link to={`/tickets/${t.id}`} className="text-sm font-medium hover:text-brand-600 dark:hover:text-brand-400">
                    {t.subject}
                  </Link>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {t.ref} · updated {relativeTime(t.updatedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={t.status} />
                  <PriorityBadge priority={t.priority} />
                </div>
              </li>
            ))}
            {tickets.length === 0 && <li className="py-4 text-sm text-slate-400">No tickets.</li>}
          </ul>
        </div>

        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold">Documents</h2>
          <FileUpload testId="customer-documents" />
        </div>
      </div>
    </div>
  );
}
