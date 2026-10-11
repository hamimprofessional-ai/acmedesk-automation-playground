import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import type { Customer, Ticket } from '@/mocks/data';
import { CATEGORIES } from '@/mocks/data';
import type { Paginated } from '@/lib/types';
import { toast } from '@/store/toast';
import { cn } from '@/lib/cn';
import { TagInput } from '@/features/webcomponents/TagInput';
import { RichTextEditor } from '@/components/RichTextEditor';

const STEPS = ['Customer & subject', 'Details', 'Review'];

function plainText(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim();
}

export function NewTicketWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    customerId: '',
    subject: '',
    priority: 'medium',
    category: 'Technical',
    description: '',
    dueDate: '',
    tags: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const customers = useQuery({
    queryKey: ['customers', 'wizard'],
    queryFn: () => apiGet<Paginated<Customer>>('/api/customers', { pageSize: 100 }),
  });

  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify({ customerId: '', subject: '', priority: 'medium', category: 'Technical', description: '', dueDate: '', tags: '' }),
    [form],
  );

  // beforeunload guard for unsaved changes.
  useEffect(() => {
    if (!dirty || submitted) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty, submitted]);

  const createMutation = useMutation({
    mutationFn: () => apiPost<Ticket>('/api/tickets', form),
    onSuccess: (ticket) => {
      setSubmitted(true);
      toast.success({ title: 'Ticket created', message: ticket.ref });
      navigate('/tickets');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validateStep(): boolean {
    const next: Record<string, string> = {};
    if (step === 0) {
      if (!form.customerId) next.customerId = 'Select a customer';
      if (form.subject.trim().length < 4) next.subject = 'Subject must be at least 4 characters';
    }
    if (step === 1) {
      if (plainText(form.description).length < 10) next.description = 'Provide at least 10 characters';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function next() {
    if (!validateStep()) return;
    setStep((s) => Math.min(2, s + 1));
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  function cancel() {
    if (dirty && !window.confirm('Discard unsaved changes and leave?')) return;
    navigate('/tickets');
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold" data-testid="page-title">
        Create a ticket
      </h1>

      <ol className="flex items-center gap-2" data-testid="wizard-steps">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
                i < step
                  ? 'bg-emerald-500 text-white'
                  : i === step
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-200 text-slate-500 dark:bg-slate-800',
              )}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={cn('text-sm', i === step ? 'font-semibold' : 'text-slate-500')}>{label}</span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />}
          </li>
        ))}
      </ol>

      <div className="card p-5">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="customer">
                Customer
              </label>
              <select
                id="customer"
                className="input"
                data-testid="wizard-customer"
                value={form.customerId}
                onChange={(e) => set('customerId', e.target.value)}
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
              <label className="label" htmlFor="subject">
                Subject
              </label>
              <input
                id="subject"
                className="input"
                data-testid="wizard-subject"
                value={form.subject}
                onChange={(e) => set('subject', e.target.value)}
                placeholder="Short summary of the issue"
              />
              {errors.subject && <p className="mt-1 text-xs text-rose-500">{errors.subject}</p>}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="priority">
                  Priority
                </label>
                <select id="priority" className="input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                  {['low', 'medium', 'high', 'urgent'].map((p) => (
                    <option key={p} value={p}>
                      {p[0].toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="category">
                  Category
                </label>
                <select id="category" className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="description">
                Description (rich text)
              </label>
              <RichTextEditor
                testId="wizard-description"
                value={form.description}
                onChange={(html) => set('description', html)}
                placeholder="Describe the issue — use the toolbar for formatting"
              />
              {errors.description && <p className="mt-1 text-xs text-rose-500">{errors.description}</p>}
            </div>
            <div>
              <label className="label" htmlFor="duedate">
                Due date &amp; time
              </label>
              <input
                id="duedate"
                type="datetime-local"
                className="input max-w-xs"
                data-testid="wizard-due-date"
                value={form.dueDate}
                onChange={(e) => set('dueDate', e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-400">
                Optional — when the follow-up is due.
              </p>
            </div>
            <div>
              <label className="label">Tags (shadow DOM input)</label>
              <TagInput value={form.tags} onChange={(v) => set('tags', v)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <dl className="space-y-3 text-sm" data-testid="wizard-review">
            <Review label="Subject" value={form.subject} />
            <Review
              label="Customer"
              value={customers.data?.items.find((c) => c.id === form.customerId)?.name ?? '—'}
            />
            <Review label="Priority" value={form.priority} />
            <Review label="Category" value={form.category} />
            <Review label="Description" value={plainText(form.description) || '—'} />
            <Review label="Due date" value={form.dueDate ? form.dueDate.replace('T', ' ') : '—'} />
            <Review label="Tags" value={form.tags || '—'} />
          </dl>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button type="button" className="btn-ghost" onClick={cancel} data-testid="wizard-cancel">
          Cancel
        </button>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={back} disabled={step === 0}>
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          {step < 2 ? (
            <button type="button" className="btn-primary" onClick={next} data-testid="wizard-next">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              data-testid="wizard-submit"
              disabled={createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? 'Creating…' : 'Create ticket'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2 dark:border-slate-800">
      <dt className="text-slate-400">{label}</dt>
      <dd className="max-w-sm text-end font-medium text-slate-700 dark:text-slate-200">{value}</dd>
    </div>
  );
}
