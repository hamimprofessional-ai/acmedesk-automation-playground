import { useEffect, useRef, useState } from 'react';
import { Bookmark, ChevronDown, Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from '@/store/toast';

interface SavedView {
  id: string;
  name: string;
  query: string;
}

const KEY = 'acmedesk-saved-views';

const DEFAULTS: SavedView[] = [
  { id: 'open', name: 'Open tickets', query: 'status=open' },
  { id: 'urgent', name: 'Urgent', query: 'priority=urgent' },
  { id: 'billing', name: 'Billing', query: 'category=Billing' },
];

function load(): SavedView[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return JSON.parse(raw) as SavedView[];
  } catch {
    return DEFAULTS;
  }
}

function save(views: SavedView[]) {
  localStorage.setItem(KEY, JSON.stringify(views));
}

export function SavedViews({
  currentQuery,
  onApply,
}: {
  currentQuery: string;
  onApply: (query: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [views, setViews] = useState<SavedView[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setViews(load());
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function persist(next: SavedView[]) {
    setViews(next);
    save(next);
  }

  function saveCurrent() {
    const name = window.prompt('Name this view');
    if (!name) return;
    const next = [...views, { id: crypto.randomUUID(), name, query: currentQuery }];
    persist(next);
    toast.success(`View "${name}" saved`);
  }

  function rename(view: SavedView) {
    const name = window.prompt('Rename view', view.name);
    if (!name) return;
    persist(views.map((v) => (v.id === view.id ? { ...v, name } : v)));
  }

  function remove(view: SavedView) {
    if (!window.confirm(`Delete view "${view.name}"?`)) return;
    persist(views.filter((v) => v.id !== view.id));
  }

  return (
    <div className="relative" ref={ref}>
      <button type="button" className="btn-secondary" data-testid="saved-views" onClick={() => setOpen((v) => !v)}>
        <Bookmark className="h-4 w-4" />
        Views
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute end-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <ul className="max-h-64 overflow-y-auto py-1">
            {views.map((v) => (
              <li key={v.id} className="group flex items-center">
                <button
                  type="button"
                  className="flex-1 px-3 py-2 text-start text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => {
                    onApply(v.query);
                    setOpen(false);
                  }}
                >
                  {v.name}
                </button>
                <button
                  type="button"
                  aria-label={`Rename ${v.name}`}
                  className="px-2 text-slate-400 opacity-0 hover:text-brand-600 group-hover:opacity-100"
                  onClick={() => rename(v)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${v.name}`}
                  className="pe-2 text-slate-400 opacity-0 hover:text-rose-600 group-hover:opacity-100"
                  onClick={() => remove(v)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2 text-sm text-brand-600 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
            onClick={saveCurrent}
          >
            <Plus className="h-3.5 w-3.5" /> Save current view
          </button>
        </div>
      )}
    </div>
  );
}
