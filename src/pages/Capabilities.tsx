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
    title: 'Accounts & session',
    note: 'Authentication and the signed-in user profile.',
    items: [
      {
        name: 'Two-step sign-in (credentials → one-time code)',
        page: 'Login',
        to: '/login',
        trigger:
          'Enter the test credentials (analyst / acmedesk123), then the 6-digit code (123456). Wrong input shows an inline error; "Back" returns to step 1.',
        selector: 'data-testid="auth-step" / "login-submit" / "otp-submit" / "auth-back"',
        tier: 'medium',
      },
      {
        name: 'Auth-gated routes (redirect & return)',
        page: 'Global',
        to: '/tickets',
        trigger:
          'Visit a protected URL while signed out → redirected to /login; after signing in you land back on the page you requested.',
        selector: 'data-testid="auth-step"',
        tier: 'medium',
      },
      {
        name: 'Persisted session & sign out',
        page: 'Global (topbar)',
        to: '/',
        trigger: 'Reload keeps you signed in (localStorage); profile menu → "Sign out" returns to /login',
        selector: 'data-testid="profile-menu-trigger" / "profile-menu"',
        tier: 'easy',
      },
      {
        name: 'Editable profile with validation & persistence',
        page: 'Profile',
        to: '/profile',
        trigger:
          'Edit name / contact / role fields → "Save profile"; clear Name or enter a bad email to trigger validation; "Reset" discards changes',
        selector: 'data-testid="profile-save" / "profile-error" / "profile-reset"',
        tier: 'easy',
      },
    ],
  },
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
      {
        name: 'Master → detail pages',
        page: 'Tickets / Customers / Orders',
        to: '/customers',
        trigger: 'Open any row → a detail page with related records and deep-linked sections',
        selector: 'data-testid="customer-tickets"',
        tier: 'easy',
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
        name: 'Bulk selection toolbar',
        page: 'Tickets',
        to: '/tickets',
        trigger: 'Tick row checkboxes (or the header select-all) → a bulk bar appears → bulk Delete asks for confirm()',
        selector: 'data-testid="select-all" / "bulk-bar" / "bulk-delete"',
        tier: 'easy',
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
      {
        name: 'Row actions "⋮" dropdown',
        page: 'Tickets',
        to: '/tickets',
        trigger:
          'Hover a row → click "⋮" → pick an action (Assign to me / Mark as resolved / Duplicate / Delete)',
        selector: 'data-testid="row-menu-<ref>" (trigger) / "row-actions-menu-<ref>" (menu)',
        tier: 'easy',
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
        name: 'Data loader (random 5–10s)',
        page: 'Customers / Pop-out widget',
        to: '/customers',
        trigger: 'Open Customers, or the Dashboard "Pop out widget" window — the loader shows for a random 5–10s before data appears',
        selector: 'data-testid="data-loader"',
        tier: 'medium',
      },
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
    title: 'Dashboards & data viz',
    items: [
      {
        name: 'Area & bar charts (Recharts / SVG)',
        page: 'Dashboard',
        to: '/',
        trigger: 'Landing page → ticket-volume area chart and "tickets by category" bar chart',
        tier: 'easy',
      },
      {
        name: 'Recent activity feed',
        page: 'Dashboard',
        to: '/',
        trigger: 'Landing page → "Recent activity" list; each entry deep-links to a ticket',
        selector: 'data-testid="activity-feed"',
        tier: 'easy',
      },
      {
        name: 'Loading / empty / error states (with retry)',
        page: 'Customers',
        to: '/customers',
        trigger: 'Load a list → spinner, then empty-state or error-state with a Retry button',
        selector: 'data-testid="loading" / "empty-state" / "error-state"',
        tier: 'easy',
      },
      {
        name: 'Auto-refreshing pop-out window',
        page: 'Dashboard / pop-out',
        to: '/',
        trigger: 'Dashboard → "Pop out widget"; the window self-refreshes on a timer',
        selector: 'data-testid="popout-widget" / "popout-auto-refresh"',
        tier: 'medium',
      },
    ],
  },
  {
    title: 'Advanced DOM & edge cases',
    note: 'These deliberately exercise tricky selectors and edge cases.',
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
        name: 'Dropdown that opens on hover AND click',
        page: 'Topbar (global)',
        to: '/',
        trigger:
          'Hover the "AV" avatar to open it; or click the avatar to toggle. Leave it / click outside / press Esc to close',
        selector: 'data-testid="profile-menu-trigger" / "profile-menu"',
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
  {
    title: 'Interactive widgets',
    items: [
      {
        name: 'Accordion (collapsible sections)',
        page: 'Settings',
        to: '/settings',
        trigger: 'Help & FAQ → click a section header to expand/collapse',
        selector: 'data-testid="settings-accordion-<id>"',
        tier: 'easy',
      },
      {
        name: 'Rich text editor (contentEditable + toolbar)',
        page: 'Ticket wizard',
        to: '/tickets/new',
        trigger: 'Step 2 → select text and click B / I / U / list buttons in the description editor',
        selector: 'data-testid="wizard-description-editor" / "wizard-description-bold"',
        tier: 'medium',
      },
      {
        name: 'Date & time picker',
        page: 'Ticket wizard',
        to: '/tickets/new',
        trigger: 'Step 2 → open the "Due date & time" input',
        selector: 'data-testid="wizard-due-date"',
        tier: 'medium',
      },
      {
        name: 'Carousel / slider with Prev & Next',
        page: 'Dashboard',
        to: '/',
        trigger: 'Use the ‹ / › buttons (or click a dot) on the spotlight card',
        selector: 'data-testid="dashboard-spotlight-prev" / "-next"',
        tier: 'easy',
      },
      {
        name: 'Navigation drawer (off-canvas)',
        page: 'Global',
        to: '/',
        trigger: 'Click the ☰ button in the topbar; the drawer slides in over a backdrop. Close via backdrop, Escape, or a nav link.',
        selector: 'data-testid="nav-drawer-toggle" / "sidebar"',
        tier: 'medium',
      },
      {
        name: 'Radio group (sidebar display preference)',
        page: 'Settings',
        to: '/settings',
        trigger: 'Navigation → choose "Always open (pinned)" or "Collapsed (drawer)"; the desktop layout changes accordingly',
        selector: 'data-testid="settings-sidebar-mode-pinned" / "-drawer"',
        tier: 'medium',
      },
      {
        name: 'Tooltips on icon buttons',
        page: 'Global (topbar) / Tickets',
        to: '/tickets',
        trigger: 'Hover the theme-toggle, notification bell or a row action icon',
        selector: 'data-testid="tooltip-theme" / "tooltip-notifications"',
        tier: 'easy',
      },
      {
        name: 'Ticket conversation (post a comment)',
        page: 'Ticket detail',
        to: '/tickets',
        trigger: 'Open a ticket → type in the comment box → Send (toast confirms)',
        selector: 'data-testid="comment-input" / "send-comment" / "comment-list"',
        tier: 'easy',
      },
      {
        name: 'Inline status change (select)',
        page: 'Ticket detail',
        to: '/tickets',
        trigger: 'Open a ticket → change Status in the header dropdown; the badge updates',
        selector: 'data-testid="status-select"',
        tier: 'easy',
      },
      {
        name: 'Re-show the consent banner',
        page: 'Settings',
        to: '/settings',
        trigger: 'Privacy panel → "Reset consent banner"; the bottom banner reappears',
        selector: 'data-testid="reset-consent" / "consent-banner"',
        tier: 'easy',
      },
    ],
  },
  {
    title: 'Challenge Lab (hard-to-automate widgets)',
    note: 'Isolated practice pages. Production pages keep stable ids — these intentionally do not.',
    items: [
      {
        name: 'Shadow DOM (open & closed roots)',
        page: 'Challenge Lab',
        to: '/challenges/shadow-dom',
        trigger: 'Fill the shadow card, click Save; reveal the closed-shadow code',
        selector: 'acmedesk-shadow-open input',
        tier: 'hard',
      },
      {
        name: 'Nested & dynamic iframes',
        page: 'Challenge Lab',
        to: '/challenges/nested-iframes',
        trigger: 'Switch into the nested frame; spawn, resize and reveal frames',
        selector: 'iframe.frame',
        tier: 'hard',
      },
      {
        name: 'Unstable IDs & attributes',
        page: 'Challenge Lab',
        to: '/challenges/unstable-ids',
        trigger: 'Submit the form while ids churn every 2s; toggle Freeze IDs',
        selector: 'getByRole("button", { name: "Deactivate account" })',
        tier: 'hard',
      },
      {
        name: 'Moving targets & layout shift',
        page: 'Challenge Lab',
        to: '/challenges/moving-targets',
        trigger: 'Click the floating Confirm button; dodge button; dismiss the late banner',
        selector: 'getByRole("button", { name: "Confirm" })',
        tier: 'hard',
      },
      {
        name: 'Hover-only controls',
        page: 'Challenge Lab',
        to: '/challenges/hover-only',
        trigger: 'Hover a row to reveal Archive/Attach; hover for the tier text',
        selector: 'li.item:has-text("INV-2201") >> text=Archive',
        tier: 'medium',
      },
      {
        name: 'Overlays & occlusion',
        page: 'Challenge Lab',
        to: '/challenges/obscured',
        trigger: 'Close the ad overlay, then save; accept the sticky cookie bar',
        selector: 'getByRole("button", { name: "Save preferences" })',
        tier: 'medium',
      },
      {
        name: 'Detached & self-resetting DOM',
        page: 'Challenge Lab',
        to: '/challenges/detached-dom',
        trigger: 'Pause the refresh, then click a row; save a note before it clears',
        selector: 'li.row:has-text("UMBR")',
        tier: 'hard',
      },
      {
        name: 'Delayed async rendering',
        page: 'Challenge Lab',
        to: '/challenges/delayed-async',
        trigger: 'Wait out the skeleton; capture the late secret token',
        selector: 'table tr.row',
        tier: 'medium',
      },
      {
        name: 'Flaky network & retries',
        page: 'Challenge Lab',
        to: '/challenges/flaky-network',
        trigger: 'Retry the 500 / 429 endpoints; trigger the client timeout',
        selector: 'button:has-text("Load balance")',
        tier: 'hard',
      },
      {
        name: 'Native dialogs (alert/confirm/prompt)',
        page: 'Challenge Lab',
        to: '/challenges/native-prompts',
        trigger: 'Trigger each native dialog; toggle beforeunload guard',
        selector: 'page.on("dialog", d => d.accept("Ada"))',
        tier: 'medium',
      },
      {
        name: 'Logic & reasoning gate',
        page: 'Challenge Lab',
        to: '/challenges/logic-gate',
        trigger: 'Solve the product, pick the 3rd node, hit the slider target, echo the word',
        selector: 'text-based assertions instead of fixed ids',
        tier: 'hard',
      },
      {
        name: 'Drag & drop',
        page: 'Challenge Lab',
        to: '/challenges/drag-and-drop',
        trigger: 'Reorder the checklist; drag a card into the Done bucket',
        selector: 'locator.dragTo() or a dispatchEvent drag sequence',
        tier: 'hard',
      },
    ],
  },
  {
    title: 'Orders & fulfillment',
    note: 'End-to-end commerce flow: orders, shipment tracking and returns.',
    items: [
      {
        name: 'Filterable order list with status counts',
        page: 'Orders',
        to: '/orders',
        trigger: 'Filter by status / payment / channel, search ref or customer',
        tier: 'medium',
      },
      {
        name: 'Filtered CSV export',
        page: 'Orders',
        to: '/orders',
        trigger: '"Export CSV" button — honours the active filters',
        selector: 'data-testid="export-orders"',
        tier: 'medium',
      },
      {
        name: 'Create order with computed totals',
        page: 'New order',
        to: '/orders/new',
        trigger: 'Pick a customer, add line items; subtotal/shipping/tax/total update live',
        selector: 'data-testid="create-order"',
        tier: 'medium',
      },
      {
        name: 'Order detail state machine',
        page: 'Order detail',
        to: '/orders',
        trigger: 'Create shipment, then pick the next step from the stage dropdown (only one step enabled)',
        tier: 'hard',
      },
      {
        name: 'Request return (modal)',
        page: 'Order detail',
        to: '/orders',
        trigger: 'Delivered order → "Request return" → pick a reason',
        selector: 'data-testid="request-return"',
        tier: 'easy',
      },
      {
        name: 'Fulfillment queue with per-row action menu',
        page: 'Shipments',
        to: '/shipments',
        trigger: 'Filter by carrier, open a row menu → Advance / Mark exception / Reset tracking',
        selector: 'data-testid="shipment-menu-<ref>"',
        tier: 'medium',
      },
      {
        name: 'Returns RMA workflow',
        page: 'Returns',
        to: '/returns',
        trigger: 'Approve / Reject / Receive / Refund a request; status counts update',
        selector: 'data-testid="returns-table"',
        tier: 'medium',
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
        i.trigger.toLowerCase().includes(needle),
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
          placeholder="Filter by name, page or trigger…"
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
        <span className="ms-2 text-xs text-slate-400">Difficulty tier</span>
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