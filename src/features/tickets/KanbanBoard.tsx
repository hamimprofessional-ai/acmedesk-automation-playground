import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Ticket, TicketStatus } from '@/mocks/data';
import { PriorityBadge } from '@/components/Badges';
import { relativeTime } from '@/lib/format';

const COLUMNS: { status: TicketStatus; label: string; accent: string }[] = [
  { status: 'open', label: 'Open', accent: 'border-sky-400' },
  { status: 'pending', label: 'Pending', accent: 'border-amber-400' },
  { status: 'resolved', label: 'Resolved', accent: 'border-emerald-400' },
  { status: 'closed', label: 'Closed', accent: 'border-slate-400' },
];

interface KanbanBoardProps {
  tickets: Ticket[];
  onDrop: (ticketId: string, status: TicketStatus) => void;
}

export function KanbanBoard({ tickets, onDrop }: KanbanBoardProps) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<TicketStatus | null>(null);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" data-testid="kanban-board">
      {COLUMNS.map((col) => {
        const items = tickets.filter((t) => t.status === col.status);
        return (
          <div
            key={col.status}
            data-testid={`kanban-column-${col.status}`}
            onDragOver={(e) => {
              e.preventDefault();
              setOverStatus(col.status);
            }}
            onDragLeave={() => setOverStatus((s) => (s === col.status ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              setOverStatus(null);
              if (dragId) onDrop(dragId, col.status);
              setDragId(null);
            }}
            className={`rounded-xl border-t-4 bg-slate-50 p-3 transition-colors dark:bg-slate-900/60 ${col.accent} ${
              overStatus === col.status ? 'bg-brand-50 dark:bg-brand-950/40' : ''
            }`}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="text-sm font-semibold">{col.label}</span>
              <span className="badge bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {items.length}
              </span>
            </div>
            <div className="space-y-2">
              {items.map((ticket) => (
                <div
                  key={ticket.id}
                  draggable
                  data-testid={`kanban-card-${ticket.ref}`}
                  onDragStart={() => setDragId(ticket.id)}
                  onDragEnd={() => setDragId(null)}
                  className="cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing dark:border-slate-700 dark:bg-slate-800"
                >
                  <Link
                    to={`/tickets/${ticket.id}`}
                    className="text-sm font-medium hover:text-brand-600 dark:hover:text-brand-400"
                  >
                    {ticket.subject}
                  </Link>
                  <div className="mt-2 flex items-center justify-between">
                    <PriorityBadge priority={ticket.priority} />
                    <span className="font-mono text-[11px] text-slate-400">{ticket.ref}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{relativeTime(ticket.updatedAt)}</p>
                </div>
              ))}
              {items.length === 0 && (
                <p className="py-6 text-center text-xs text-slate-400">Drop tickets here</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
