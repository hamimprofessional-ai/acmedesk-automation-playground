# AcmeDesk — Web Capability Benchmark Harness

> A realistic, full-featured web application used to **benchmark an AI test-automation
> tool** against the entire surface of real browser capabilities — tabs, windows,
> native dialogs, downloads, uploads, iframes, navigation, async state, and a layer
> of adversarial edge cases.

AcmeDesk looks and behaves like an internal back-office product. Capabilities aren't
exposed as a page of buttons — they're **hidden inside believable workflows**, so a
tool has to *discover* triggers the way it would on a real site.

---

## Table of contents

- [What is this?](#what-is-this)
- [Who is it for?](#who-is-it-for)
- [How it works](#how-it-works)
- [Capability catalog](#capability-catalog)
- [Pages / modules](#pages--modules)
- [Tech stack](#tech-stack)
- [Local development](#local-development)
- [Configuration](#configuration)
- [Project structure](#project-structure)
- [Benchmark documentation](#benchmark-documentation)
- [Deployment](#deployment)
- [Known behaviors / caveats](#known-behaviors--caveats)

---

## What is this?

**AcmeDesk** ("Customer Operations Console") is a demo SaaS back-office app:

- **Dashboard** — KPI cards, charts, an activity feed, a spotlight carousel, a notification bell
- **Tickets** — list → detail, filters, bulk actions, a kanban board, and a create wizard
- **Customers** — list → profile, documents, contacts
- **Inventory** — product/stock table with export and low-stock reports
- **Reports** — generate and download CSV/PDF reports
- **Settings** — appearance, locale, navigation, integrations, and backend simulation
- **Capabilities** — a self-documenting catalog of every testable behavior in the app

It is **not** a real product. It exists purely to be *automated against*. There is no
authentication, no server, and no real data — everything runs in the browser.

---

## Who is it for?

- **Engineers evaluating AI test-automation / browser agents.** Point the tool at the
  site and score how many benchmark scenarios it completes across difficulty tiers.
- **QA / test-tool developers** who need a stable, deterministic site that exercises
  the *hard* parts of web automation (iframes, shadow DOM, hover-only triggers,
  races, early-dismissing toasts) instead of trivial static pages.
- **Anyone learning browser automation** who wants a safe sandbox with documented,
  reproducible tasks in [`docs/scenarios.md`](docs/scenarios.md).

---

## How it works

- **Everything is client-side.** A [Mock Service Worker (MSW)](https://mswjs.io/)
  intercepts network requests and serves a fake REST API — no backend or database
  required.
- **Deterministic data.** Seed data is generated once with
  [@faker-js/faker](https://fakerjs.dev/) and frozen, so runs are reproducible.
- **Configurable backend.** From **Settings → Backend simulation** you can inject
  latency, failure rates, and page sizes to test async/error handling.
- **Real browser primitives.** Genuine history navigation, real `window.open`,
  real `Content-Disposition` downloads, real `FormData` uploads, and real
  cross-origin iframes.

---

## Capability catalog

The in-app **Capabilities** page (`/capabilities`) documents every capability with a
page, a "how to trigger" hint, and a `data-testid` selector hint where relevant. The
same information is broken into **scored tasks** in
[`docs/scenarios.md`](docs/scenarios.md).

| Area | Examples (tiered easy → hard) |
| --- | --- |
| Tabs & windows | Open in new tab; `window.open` pop-out; new tab via form submit |
| Navigation & state | Back/forward with preserved filters; multi-step wizard |
| Native dialogs | `alert` / `confirm` / `prompt` |
| Modals & popups | Nested, focus-trapped, stacked dialogs |
| Download | CSV export; generated PDF invoices/reports |
| Upload | Drag-and-drop, multi-file, type/size validation |
| Iframes | Real cross-origin pages + a nested vendor iframe with 2-level `postMessage` |
| Async & toasts | Optimistic updates, polling, early-dismissing toasts |
| Long lists | Paginated tables + a virtualized list |
| Context menu / keyboard | Right-click row menu; keyboard shortcuts |
| Clipboard / print | Copy ticket ref; `window.print` |
| Locale / theme / RTL | Dark mode, English / Deutsch / العربية (RTL) |
| `beforeunload` guard | Unsaved-changes prompt |
| Interactive widgets | Accordion, rich text editor, date/time picker, carousel, off-canvas drawer, tooltips, radio group |
| Adversarial | Shadow DOM, hover-only triggers, occlusion/overlays, races, dynamic classes |

---

## Pages / modules

| Route | Page | Highlights |
| --- | --- | --- |
| `/` | Dashboard | KPIs, charts, activity feed, carousel, live embedded iframe, pop-out window |
| `/tickets` | Tickets | Filter/paginate, row menu, context menu, bulk delete, export |
| `/tickets/new` | Ticket wizard | 3-step wizard, rich text editor, date/time picker, shadow-DOM tag input |
| `/tickets/:id` | Ticket detail | Comments, attachments, print view, real cross-origin embed |
| `/customers` | Customers | List → profile, documents |
| `/inventory` | Inventory | Stock table, low-stock report, CSV export |
| `/reports` | Reports | Generate + download PDF/CSV reports |
| `/settings` | Settings | Appearance, locale, navigation, integrations, backend simulation |
| `/capabilities` | Capabilities | Searchable catalog of all testable behaviors |

---

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | React 18 + Vite + TypeScript |
| Routing | React Router (history-based) |
| Data / async | TanStack Query |
| UI state | Zustand (persisted) |
| Mock backend | MSW (REST handlers, latency, pagination, errors, files) |
| Styling | Tailwind CSS |
| Fake data | @faker-js/faker (frozen seed) |
| Icons / Charts | lucide-react, Recharts |

---

## Local development

### Prerequisites

- **Node.js 20** (see [`.nvmrc`](.nvmrc)). With nvm: `nvm use`.
- **npm** (ships with Node).

### Commands

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (http://localhost:4040)
npm run dev

# 3. Type-check only
npm run typecheck

# 4. Production build (runs type-check, then Vite build → dist/)
npm run build

# 5. Preview the production build locally (http://localhost:4040)
npm run preview
```

The dev server is pinned to **port 4040** (`strictPort`), so it fails loudly instead
of silently switching ports.

### Typical workflow

1. `npm install`
2. `npm run dev`
3. Open <http://localhost:4040>
4. Before committing: `npm run typecheck` (or `npm run build`)

---

## Configuration

Open **Settings → Backend simulation** to shape the mock API per run:

| Setting | Effect |
| --- | --- |
| **Latency** | Adds a fixed delay to API responses (slow/fast). |
| **Failure rate** | Percentage of requests that return errors — tests retry/error UI. |
| **Page size** | Rows per page for paginated lists. |

**Appearance / Navigation** — theme (light/dark), density, and the desktop sidebar
mode (**pinned** vs **drawer**), plus **locale** (English / Deutsch / العربية, which
switches the document to RTL). Preferences persist in `localStorage`.

---

## Project structure

```
practice-demo-site/
├─ docs/
│  ├─ benchmark-spec.md      # design goals, principles, decisions log
│  └─ scenarios.md           # capability → task → expected-outcome catalog
├─ public/
│  ├─ mockServiceWorker.js   # MSW worker (served at /)
│  └─ _redirects             # SPA fallback for static hosting
├─ src/
│  ├─ app/                   # App shell, router, layout, providers
│  ├─ pages/                 # Dashboard, Tickets, Customers, Inventory, Reports, Settings, Capabilities…
│  ├─ components/            # Modal, DropdownMenu, Accordion, Carousel, Tooltip, RichTextEditor, VirtualList…
│  ├─ features/              # capability modules (files, tickets, web components)
│  ├─ mocks/                 # MSW handlers, seed data, config, PDF generation
│  ├─ store/                 # Zustand stores (ui, toast)
│  └─ lib/                   # api client, i18n, download/format helpers, hooks
├─ index.html
├─ vite.config.ts            # port 4040, "@" → src alias
├─ tailwind.config.js
└─ package.json
```

---

## Benchmark documentation

- [`docs/benchmark-spec.md`](docs/benchmark-spec.md) — the *why*: goals, principles,
  product concept, tech choices, edge-case layer, mock API, and decisions log.
- [`docs/scenarios.md`](docs/scenarios.md) — the *what*: a catalog of concrete,
  scored tasks (`C1`…`C16`, plus adversarial `AD-01`…), each with tier,
  preconditions, task, and expected outcome.

Start with the **Capabilities** page in-app for a human-friendly overview, then use
`docs/scenarios.md` as the machine-gradable task list.

---

## Deployment

The app is a static SPA and is deployed on **Cloudflare Pages**.

- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment variable:** `NODE_VERSION=20`
- **SPA routing:** handled by [`public/_redirects`](public/_redirects) (all paths →
  `index.html`).

---

## Known behaviors / caveats

- **MSW registers at page load.** After changing any file in `src/mocks/`, do a hard
  refresh (`Ctrl+Shift+R`) so the new handlers take effect.
- **No backend.** Refreshing resets all in-memory mock data to its deterministic seed.
- **External iframes:** the app embeds real cross-origin pages
  (`practicetestautomation.com`, `demoqa.com`). Some sites (`the-internet.herokuapp.com`)
  send `X-Frame-Options: SAMEORIGIN` and therefore **cannot** be embedded — those are
  intentionally not used.
