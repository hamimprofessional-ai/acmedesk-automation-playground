import { cn } from '@/lib/cn';
import type {
  OrderStatus,
  PaymentStatus,
  ReturnStatus,
  ShipmentStage,
  TicketPriority,
  TicketStatus,
} from '@/mocks/data';

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

const orderStatusStyles: Record<OrderStatus, string> = {
  pending: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  processing: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  shipped: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  refunded: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn('badge capitalize', orderStatusStyles[status])}
      data-testid={`order-status-${status}`}
    >
      {status}
    </span>
  );
}

const paymentStyles: Record<PaymentStatus, string> = {
  pending: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  failed: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  refunded: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className={cn('badge capitalize', paymentStyles[status])} data-testid={`payment-${status}`}>
      {status}
    </span>
  );
}

const shipmentStyles: Record<ShipmentStage, string> = {
  label_created: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  picked_up: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  in_transit: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  out_for_delivery: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  exception: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
};

export function ShipmentBadge({ stage }: { stage: ShipmentStage | 'not_shipped' }) {
  const style =
    stage === 'not_shipped'
      ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
      : shipmentStyles[stage];
  return (
    <span className={cn('badge', style)} data-testid={`shipment-${stage}`}>
      {stage.replace(/_/g, ' ')}
    </span>
  );
}

const returnStyles: Record<ReturnStatus, string> = {
  requested: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  approved: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  received: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  refunded: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
};

export function ReturnBadge({ status }: { status: ReturnStatus }) {
  return (
    <span className={cn('badge capitalize', returnStyles[status])} data-testid={`return-status-${status}`}>
      {status}
    </span>
  );
}
