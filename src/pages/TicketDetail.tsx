import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import {
  ArrowLeft,
  Download,
  Printer,
  Copy,
  Trash2,
  AlertTriangle,
  Send,
  Paperclip,
  ExternalLink,
} from 'lucide-react';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import type { Comment, Ticket } from '@/mocks/data';
import { downloadFile } from '@/lib/download';
import { formatDateTime, relativeTime } from '@/lib/format';
import { toast } from '@/store/toast';
import { StatusBadge, PriorityBadge } from '@/components/Badges';
import { Modal } from '@/components/Modal';
import { LoadingBlock, ErrorState } from '@/components/States';
import { FileUpload } from '@/features/files/FileUpload';

interface DetailResponse {
  ticket: Ticket;
  comments: Comment[];
}

export function TicketDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [comment, setComment] = useState('');
  const [internal, setInternal] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [confirmEscalate, setConfirmEscalate] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => apiGet<DetailResponse>(`/api/tickets/${id}`),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => apiPatch(`/api/tickets/${id}`, { status }),
    onSuccess: () => {
      toast.success('Status updated');
      qc.invalidateQueries({ queryKey: ['ticket', id] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: () => apiPost(`/api/tickets/${id}/comments`, { body: comment, internal }),
    onSuccess: () => {
      setComment('');
      setInternal(false);
      toast.success('Comment added');
      qc.invalidateQueries({ queryKey: ['ticket', id] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const escalateMutation = useMutation({
    mutationFn: () => apiPatch(`/api/tickets/${id}`, { priority: 'urgent', status: 'open' }),
    onSuccess: () => {
      setConfirmEscalate(false);
      setEscalateOpen(false);
      toast.warning('Ticket escalated to urgent');
      qc.invalidateQueries({ queryKey: ['ticket', id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiDelete(`/api/tickets/${id}`),
    onSuccess: () => {
      toast.success('Ticket deleted');
      navigate('/tickets');
    },
  });

  if (isLoading) return <LoadingBlock />;
  if (isError || !data) {
    return <ErrorState message={(error as Error)?.message ?? 'Ticket not found'} onRetry={() => refetch()} />;
  }

  const { ticket, comments } = data;

  async function downloadPdf() {
    try {
      const name = await downloadFile(`/api/reports/${ticket.ref}.pdf`, `${ticket.ref}.pdf`);
      toast.success({ title: 'PDF downloaded', message: name });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function copyId() {
    navigator.clipboard?.writeText(ticket.ref);
    toast.info(`Copied ${ticket.ref}`);
  }

  function confirmDelete() {
    if (window.confirm(`Delete ${ticket.ref} permanently?`)) deleteMutation.mutate();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Link to="/tickets" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to tickets
      </Link>

      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-500" data-testid="ticket-ref">
                {ticket.ref}
              </span>
              <button type="button" aria-label="Copy ticket reference" onClick={copyId} className="text-slate-400 hover:text-brand-600">
                <Copy className="h-3.5 w-3.5" />
              </button>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h1 className="mt-2 text-xl font-semibold" data-testid="ticket-subject">
              {ticket.subject}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Opened by{' '}
              <Link to={`/customers/${ticket.customerId}`} className="text-brand-600 hover:underline dark:text-brand-400">
                {ticket.customerName}
              </Link>{' '}
              · updated {relativeTime(ticket.updatedAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Change status"
              data-testid="status-select"
              value={ticket.status}
              onChange={(e) => statusMutation.mutate(e.target.value)}
              className="input w-36"
            >
              {['open', 'pending', 'resolved', 'closed'].map((s) => (
                <option key={s} value={s}>
                  {s[0].toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <button type="button" className="btn-secondary" data-testid="download-pdf" onClick={downloadPdf}>
              <Download className="h-4 w-4" /> PDF
            </button>
            <button type="button" className="btn-secondary" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print
            </button>
            <button type="button" className="btn-danger" data-testid="escalate" onClick={() => setEscalateOpen(true)}>
              <AlertTriangle className="h-4 w-4" /> Escalate
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="card p-5">
            <h2 className="mb-2 text-sm font-semibold">Description</h2>
            <div
              data-testid="ticket-description"
              className="rte-content whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(ticket.description) }}
            />
          </div>

          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold">Conversation ({comments.length})</h2>
            <ul className="space-y-3" data-testid="comment-list">
              {comments.map((c) => (
                <li
                  key={c.id}
                  className={`rounded-lg border p-3 ${
                    c.internal
                      ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40'
                      : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{c.author}</span>
                    {c.internal && <span className="badge bg-amber-200 text-amber-800">internal note</span>}
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{c.body}</p>
                  <p className="mt-1.5 text-[11px] text-slate-400">{formatDateTime(c.createdAt)}</p>
                </li>
              ))}
              {comments.length === 0 && <p className="text-sm text-slate-400">No comments yet.</p>}
            </ul>

            <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
              <textarea
                className="input min-h-20"
                placeholder="Write a reply…"
                aria-label="Comment"
                data-testid="comment-input"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <div className="mt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-500">
                  <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
                  Internal note
                </label>
                <button
                  type="button"
                  className="btn-primary"
                  data-testid="send-comment"
                  disabled={comment.trim().length < 2}
                  onClick={() => commentMutation.mutate()}
                >
                  <Send className="h-4 w-4" /> Send
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5 text-sm">
            <h2 className="mb-3 text-sm font-semibold">Details</h2>
            <dl className="space-y-2">
              <Row label="Assignee" value={ticket.assignee} />
              <Row label="Category" value={ticket.category} />
              <Row label="Customer" value={ticket.customerName} />
              <Row label="Created" value={formatDateTime(ticket.createdAt)} />
              <Row label="Due" value={formatDateTime(ticket.dueDate)} />
            </dl>
            {ticket.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {ticket.tags.map((t) => (
                  <span key={t} className="badge bg-slate-100 text-slate-600 dark:bg-slate-800">{t}</span>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Paperclip className="h-4 w-4" /> Attachments
            </h2>
            <FileUpload testId="ticket-attachments" />
          </div>

          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold">Actions</h2>
            <a
              href={`/tickets/${ticket.id}?print=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full"
            >
              <ExternalLink className="h-4 w-4" /> Open print view in new tab
            </a>
            <button type="button" className="btn-danger mt-2 w-full" data-testid="delete-ticket" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4" /> Delete ticket
            </button>
          </div>
        </div>
      </div>

      <Modal
        open={escalateOpen}
        onClose={() => setEscalateOpen(false)}
        title="Escalate ticket"
        description="Escalating sets priority to urgent and reopens the ticket."
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setEscalateOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn-danger" data-testid="escalate-next" onClick={() => setConfirmEscalate(true)}>
              Continue
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          You are escalating <strong>{ticket.ref}</strong> — {ticket.subject}. This notifies the
          on-call team and may trigger an SLA alert.
        </p>
      </Modal>

      <Modal
        open={confirmEscalate}
        onClose={() => setConfirmEscalate(false)}
        title="Confirm escalation"
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setConfirmEscalate(false)}>
              Go back
            </button>
            <button type="button" className="btn-danger" data-testid="escalate-confirm" onClick={() => escalateMutation.mutate()}>
              Yes, escalate
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Are you sure you want to escalate this ticket to urgent priority?
        </p>
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-end font-medium text-slate-700 dark:text-slate-200">{value}</dd>
    </div>
  );
}
