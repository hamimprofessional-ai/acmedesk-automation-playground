import { cn } from '@/lib/cn';
import type { TicketPriority, TicketStatus } from '@/mocks/data';

const statusStyles: Record<TicketStatus, string> = {
  open: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  closed: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

const priorityStyles: Record<TicketPriority, string> = {
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  urgent: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={cn('badge capitalize', statusStyles[status])} data-testid={`status-${status}`}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span className={cn('badge capitalize', priorityStyles[priority])} data-priority={priority}>
      {priority}
    </span>
  );
}

export function PlanBadge({ plan }: { plan: 'free' | 'pro' | 'enterprise' }) {
  const styles = {
    free: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    pro: 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300',
    enterprise: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  } as const;
  return <span className={cn('badge capitalize', styles[plan])}>{plan}</span>;
}
