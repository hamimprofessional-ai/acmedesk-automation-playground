import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

type Tier = 'easy' | 'medium' | 'hard';

interface Capability {
  name: string;
  page: string;
  to: string;
  trigger: string;
  selector?: string;
  tier?: Tier;
}

interface CapabilityGroup {
  title: string;
  note?: string;
  items: Capability[];
}

const GROUPS: CapabilityGroup[] = [
  {
    title: 'Tabs & windows',
    items: [
      {
        name: 'Open in new tab',
        page: 'Tickets',
        to: '/tickets',
        trigger: 'Hover a row to reveal the "new tab" icon, then click it',
        selector: 'data-testid="open-newtab-<ref>"',
        tier: 'easy',
      },
      {
        name: 'New window via window.open (measured size, no chrome)',
        page: 'Dashboard',
        to: '/',
        trigger: '"Pop out widget" button',
        selector: 'data-testid="popout-widget"',
        tier: 'medium',
      },
      {
        name: 'New tab opened by form submission (not a click handler)',
        page: 'Reports',
        to: '/reports',
        trigger: '"Preview in new tab" — <form target="_blank">',
        selector: 'data-testid="preview-newtab"',
        tier: 'hard',
      },
      {
        name: 'New tab print view',
        page: 'Ticket detail',
        to: '/tickets',
        trigger: 'Actions panel → "Open print view in new tab"',
        tier: 'easy',
      },
    ],
  },
  {
    title: 'Navigation & state',
    items: [
      {
        name: 'Back / forward with preserved filters & page',
        page: 'Tickets',
        to: '/tickets',
        trigger: 'Apply filters → open ticket → browser Back',
        tier: 'medium',
      },
      {
        name: 'Multi-step wizard (Next/Back keeps state)',
        page: 'Ticket wizard',
        to: '/tickets/new',
        trigger: 'Create ticket wizard steps',
        selector: 'data-testid="wizard-steps"',
        tier: 'medium',
      },
      {
        name: 'beforeunload "leave site?" guard',
        page: 'Ticket wizard',
        to: '/tickets/new',
        trigger: 'Type unsaved input, then reload / leave',
        tier: 'hard',
      },
      {
        name: 'Keyboard shortcut "/" focuses search',
        page: 'Global (topbar)',
        to: '/tickets',
        trigger: 'Press / while not typing',
        selector: 'data-testid="global-search"',
        tier: 'medium',
      },
    ],
  },
  {
    title: 'Dialogs & popups',
    items: [
      {
        name: 'Native confirm()',
        page: 'Tickets',
        to: '/tickets',
        trigger: 'Bulk delete, delete a saved view',
        selector: 'data-testid="bulk-delete"',
        tier: 'medium',
      },
      {
        name: 'Native prompt()',
        page: 'Tickets',
        to: '/tickets',
        trigger: 'Saved views → "Save current view" (name it)',
        selector: 'data-testid="saved-views"',
        tier: 'hard',
      },
      {
        name: 'In-app modal',
        page: 'Inventory',
        to: '/inventory',
        trigger: 'Any row → "Adjust" stock',
        selector: 'data-testid="adjust-<sku>"',
        tier: 'easy',
      },
      {
        name: 'Nested / stacked modals',
        page: 'Ticket detail',
        to: '/tickets',
        trigger: 'Escalate → Continue → Yes, escalate',
        selector: 'data-testid="escalate" / "escalate-next" / "escalate-confirm"',
        tier: 'hard',
      },
      {
        name: 'Focus-trapped modal',
        page: 'Any modal',
        to: '/inventory',
        trigger: 'Press Tab repeatedly inside a modal',
        tier: 'medium',
      },
      {
        name: 'Context menu (right-click)',
        page: 'Tickets',
        to: '/tickets',
        trigger: 'Right-click a ticket row',
        selector: 'data-testid="context-menu"',
        tier: 'hard',
      },
    ],
  },
  {
    title: 'Files',
    items: [
      {
        name: 'CSV download (respects active filters)',
        page: 'Tickets / Inventory',
        to: '/tickets',
        trigger: '"Export CSV" after filtering',
        selector: 'data-testid="export-tickets" / "export-inventory"',
        tier: 'medium',
      },
      {
        name: 'PDF download',
        page: 'Ticket detail / Reports',
        to: '/reports',
        trigger: 'Ticket detail → "PDF" button · Reports → generate, then Download',
        selector: 'data-testid="download-pdf"',
        tier: 'easy',
      },
      {
        name: 'File upload (picker)',
        page: 'Ticket detail / Customer detail',
        to: '/tickets',
        trigger: 'Attachments dropzone → click to browse',
        selector: 'data-testid="ticket-attachments" / "customer-documents"',
        tier: 'medium',
      },
      {
        name: 'Drag & drop upload',
        page: 'Ticket detail / Customer detail',
        to: '/tickets',
        trigger: 'Drop a file onto the dropzone',
        tier: 'hard',
      },
      {
        name: 'Upload validation (size/type rejection)',
        page: 'Ticket detail',
        to: '/tickets',
        trigger: 'Upload a file > 5 MB or unsupported type',
        tier: 'hard',
      },
      {
        name: 'Clipboard copy',
        page: 'Tickets / Ticket detail',
        to: '/tickets',
        trigger: 'Copy link (row) or copy ref (detail)',
        tier: 'medium',
      },
    ],
  },
  {
    title: 'Iframes',
    items: [
      {
        name: 'Read data inside a cross-origin iframe',
        page: 'Dashboard',
        to: '/',
        trigger: 'Embedded analytics panel → real practicetestautomation.com login form',
        selector: 'data-testid="analytics-iframe"',
        tier: 'medium',
      },
      {
        name: 'Interact with a real third-party site in an iframe',
        page: 'Settings',
        to: '/settings',
        trigger: 'Integration panel → real demoqa.com page (forms, accordions, menus)',
        selector: 'data-testid="integration-iframe"',
        tier: 'hard',
      },
      {
        name: 'Nested iframe (iframe inside iframe, message relayed 2 levels)',
        page: 'Settings',
        to: '/settings',
        trigger: 'Vendor portal → inner "Refresh status"',
        selector: 'data-testid="vendor-iframe" → "vendor-status-iframe"',
        tier: 'hard',
      },
    ],
  },
  {
    title: 'Async & lists',
    items: [
      {
        name: 'Toast notifications (auto-dismiss)',
        page: 'Global',
        to: '/',
        trigger: 'Any save / create / export action',
        selector: 'data-testid="toast"',
        tier: 'easy',
      },
      {
        name: 'Polling notification bell',
        page: 'Global (topbar)',
        to: '/',
        trigger: 'Open the bell (refetches every 20s)',
        selector: 'data-testid="notification-bell"',
        tier: 'medium',
      },
      {
        name: 'Paginated table',
        page: 'Tickets / Inventory',
        to: '/tickets',
        trigger: 'Table pagination controls',
        selector: 'data-testid="pagination-summary"',
        tier: 'easy',
      },
      {
        name: 'Virtualized list (off-screen rows absent from DOM)',
        page: 'Customers',
        to: '/customers',
        trigger: 'Scroll the customer list',
        selector: 'data-testid="customer-virtual-list"',
        tier: 'hard',
      },
      {
        name: 'Kanban board drag & drop',
        page: 'Tickets',
        to: '/tickets',
        trigger: 'Switch to board view, drag a card to another column',
        selector: 'data-testid="view-board" / "kanban-board"',
        tier: 'medium',
      },
      {
        name: 'Injected latency / failure rate',
        page: 'Settings',
        to: '/settings',
        trigger: 'Backend simulation sliders',
        selector: 'data-testid="save-backend"',
        tier: 'medium',
      },
    ],
  },
  {
    title: 'Advanced DOM & edge cases',
    note: 'These deliberately exercise tricky selectors and later a benchmark tier.',
    items: [
      {
        name: 'Shadow DOM input (web component)',
        page: 'Ticket wizard',
        to: '/tickets/new',
        trigger: 'Tag input on step 2',
        selector: 'data-testid="tag-input"',
        tier: 'hard',
      },
      {
        name: 'Hover-only actions',
        page: 'Tickets',
        to: '/tickets',
        trigger: 'Row actions hidden until row hover',
        selector: 'data-testid="open-newtab-<ref>"',
        tier: 'medium',
      },
      {
        name: 'Ambiguous duplicate buttons',
        page: 'Settings',
        to: '/settings',
        trigger: 'Three separate "Save" buttons',
        selector: 'data-testid="save-appearance" / "save-language" / "save-backend"',
        tier: 'medium',
      },
      {
        name: 'Overlay / occlusion (consent banner + sticky headers)',
        page: 'Global / Inventory',
        to: '/settings',
        trigger: 'Leave the banner open — it covers the viewport bottom until "Accept cookies"; inventory rows scroll under a sticky header',
        selector: 'data-testid="consent-banner" / "consent-accept"',
        tier: 'medium',
      },
      {
        name: 'Fast auto-dismiss flash message (800 ms)',
        page: 'Reports',
        to: '/reports',
        trigger: 'After downloading a generated report',
        selector: 'data-testid="flash-message"',
        tier: 'hard',
      },
      {
        name: 'Double-submit protection',
        page: 'Global',
        to: '/tickets',
        trigger: 'Buttons disable while pending — e.g. send comment, save stock, wizard submit',
        tier: 'hard',
      },
    ],
  },
  {
    title: 'Presentation & i18n',
    items: [
      {
        name: 'Light / dark theme',
        page: 'Topbar / Settings',
        to: '/settings',
        trigger: 'Theme toggle button',
        selector: 'data-testid="theme-toggle" / "theme-dark"',
        tier: 'easy',
      },
      {
        name: 'Locale switch incl. RTL (English / Deutsch / العربية)',
        page: 'Topbar / Settings',
        to: '/settings',
        trigger: 'Dropdown → Arabic sets dir="rtl"',
        selector: 'data-testid="locale-switch" / "settings-locale"',
        tier: 'medium',
      },
      {
        name: 'Print (window.print)',
        page: 'Ticket detail',
        to: '/tickets',
        trigger: '"Print" button',
        tier: 'medium',
      },
      {
        name: 'Real browser search (global topbar)',
        page: 'Global',
        to: '/tickets',
        trigger: 'Type a query and submit',
        selector: 'data-testid="global-search"',
        tier: 'easy',
      },
    ],
  },
];

const TIER_STYLES: Record<Tier, string> = {
  easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  hard: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
};

export function Capabilities() {
  const [q, setQ] = useState('');

  const needle = q.trim().toLowerCase();
  const filtered = GROUPS.map((g) => ({
    ...g,
    items: g.items.filter(
      (i) =>
        !needle ||
        i.name.toLowerCase().includes(needle) ||
        i.page.toLowerCase().includes(needle) ||
        i.trigger.toLowerCase().includes(needle) ||
        (i.selector ?? '').toLowerCase().includes(needle),
    ),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold" data-testid="page-title">
            Components & capabilities
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Everything the site exercises — and where to find each capability.
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={() => setQ('')}>
          Reset filters
        </button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Filter by name, page, trigger or selector…"
          aria-label="Filter capabilities"
          data-testid="capability-search"
          className="input ps-9"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2 text-sm" data-testid="tier-legend">
        <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">easy</span>
        <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">medium</span>
        <span className="badge bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">hard</span>
        <span className="ms-2 text-xs text-slate-400">Difficulty tier for benchmark scoring</span>
      </div>

      {filtered.map((group) => (
        <section key={group.title} className="card overflow-hidden" data-testid={`capability-group-${group.title}`}>
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <h2 className="text-sm font-semibold">{group.title}</h2>
            {group.note && <p className="mt-0.5 text-xs text-slate-400">{group.note}</p>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60">
                <tr>
                  <th className="px-4 py-2.5">Capability</th>
                  <th className="px-4 py-2.5">Where</th>
                  <th className="px-4 py-2.5">How to trigger</th>
                  <th className="px-4 py-2.5">Selector</th>
                  <th className="px-4 py-2.5">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {group.items.map((item) => (
                  <tr key={item.name} className="align-top hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link to={item.to} className="text-brand-600 hover:underline dark:text-brand-400">
                        {item.page}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.trigger}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{item.selector ?? '—'}</td>
                    <td className="px-4 py-3">
                      {item.tier && (
                        <span className={`badge capitalize ${TIER_STYLES[item.tier]}`}>{item.tier}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {filtered.length === 0 && (
        <p className="py-10 text-center text-sm text-slate-400">No capabilities match "{q}".</p>
      )}
    </div>
  );
}