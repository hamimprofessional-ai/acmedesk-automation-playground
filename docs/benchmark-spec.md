# AcmeDesk — Web Capability Benchmark Harness

> A realistic, complex web application used to benchmark an AI test-automation
> tool against the full surface of browser capabilities (tabs, windows, dialogs,
> navigation, files, iframes, async state, and adversarial edge cases).

---

## 1. Goal & principles

Build a **believable product** — not a page of buttons — where every browser
capability appears **inside a natural workflow**. The AI tool must discover
triggers the way it would on a real site.

Design principles:

1. **Capabilities reachable through realistic flows.** E.g. "download" happens
   after the user filters a table and clicks Export — testing discovery, not a
   hard-coded ID.
2. **Deterministic & reproducible.** Fixed seed data; no randomness at read
   time. Mock latency/errors are configurable but deterministic per run.
3. **Tiered difficulty.** Each capability can be presented at easy / medium /
   hard, so one capability yields a graded benchmark score.
4. **Real browser behavior.** Real history navigation, real `window.open`,
   real `Content-Disposition` downloads, real `FormData` uploads — via MSW so
   no backend infra is required.

---

## 2. Product concept — "AcmeDesk" Customer Operations Console

An internal back-office console for a small SaaS company. Modules:

- **Dashboard** — KPI cards, charts, activity feed, notification bell
- **Tickets** — support ticket list → detail, bulk actions, kanban board, wizard
- **Customers** — customer list → profile, documents, contacts
- **Inventory** — product/stock table with export + low-stock reports
- **Reports** — generate & download CSV/PDF reports
- **Settings** — profile, preferences, locale/theme, integrations (iframe)

No authentication in v1.

---

## 3. Tech stack

| Concern        | Choice                                                        |
| -------------- | ------------------------------------------------------------- |
| Framework      | React 18 + Vite + TypeScript                                  |
| Routing        | React Router (history-based; back/forward, deep links, guards)|
| Data/async     | TanStack Query (loading / error / retry / stale states)      |
| UI state       | Zustand (modals, workspace/widget state)                      |
| Mock backend   | MSW — REST handlers, latency, pagination, errors, files       |
| Styling        | Tailwind CSS                                                  |
| Fake data      | @faker-js/faker — generated once into a checked-in seed set   |
| Icons/Charts   | lucide-react, Recharts                                        |
| Dev run        | `npm run dev` — no backend, no Docker                        |

---

## 4. Directory structure

```
practice-demo-site/
├─ docs/
│  └─ benchmark-spec.md          # this file
│  └─ scenarios.md               # capability → task → expected outcome catalog
├─ src/
│  ├─ app/                       # router, layout, providers
│  ├─ pages/                     # dashboard, tickets, customers, inventory, reports, settings
│  ├─ features/                  # capability modules (tabs, windows, dialogs, files, iframe)
│  ├─ mocks/                     # MSW handlers, seed data, delay/error injection
│  ├─ components/               # table, modal, wizard, toast, shadow-dom widget, kanban
│  └─ lib/                       # api client, hooks, utils
├─ public/                       # sample PDFs/CSVs, static assets
└─ package.json
```

---

## 5. Capability coverage matrix

Each capability is tied to a concrete, realistic location in the app.

| # | Capability | Where it appears |
|---|---|---|
| C1 | New tab (`target=_blank`, ctrl/middle-click) | Ticket list → "Open in new tab"; external doc links |
| C2 | New window (`window.open` w/ size features) | Dashboard "Pop out widget"; document/PDF viewer |
| C3 | Back / forward + preserved state | Ticket list (filters + page) → detail → back; wizard steps |
| C4 | `alert` / `confirm` / `prompt` | Bulk delete confirm; rename saved view; unsaved-changes prompt |
| C5 | Modals / popups (incl. nested, focus-trap, stacked) | Create/edit ticket; confirm-inside-modal; stacked dialogs |
| C6 | Download | Export filtered table → CSV; invoice/ticket → PDF; generated report |
| C7 | Upload | Drag-drop avatar/attachments; multi-file; type/size validation |
| C8 | Iframes | Real cross-origin pages (practicetestautomation.com, demoqa.com) + nested vendor iframe with 2-level postMessage |
| C9 | Toasts / async feedback | Save actions, optimistic updates, notification polling |
| C10 | Long lists | Paginated tables + one virtualized/infinite-scroll list |
| C11 | Complex forms | Multi-step wizard, conditional/dynamic fields, date pickers |
| C12 | Context menu / keyboard | Right-click row context menu; keyboard shortcuts (e.g. `/` search) |
| C13 | Clipboard / print | Copy ticket ID; print a report (`window.print`) |
| C14 | Locale / theme / RTL | Settings toggle: dark mode, locale switch incl. RTL + non-Latin |
| C15 | `beforeunload` guard | Leave wizard with unsaved changes |

Excluded from v1 (future): auth, roles, session expiry, payments.

---

## 6. Adversarial / edge-case layer

Deliberately included so the benchmark exposes real tool weaknesses. Marked
with a difficulty tier.

| Edge case | Tier | Example |
|---|---|---|
| Hover-only trigger | medium | Row action menu appears only on hover |
| Shadow DOM | hard | Web-component date-range / tag input |
| Action inside iframe | hard | "Save" only reachable within nested iframe |
| Virtualized list | hard | Off-screen rows absent from DOM until scrolled |
| Ambiguous selectors | medium | Button text "Save" repeated in 3 sections |
| Dynamic/hashed classes | medium | CSS-module class names, no stable hooks |
| Overlay / occlusion | medium | Button under sticky header or cookie banner |
| Delayed appearance | medium | Toast/modal appears after async delay |
| Fast auto-dismiss | hard | Flash message disappears in <1s |
| Non-click popup trigger | hard | New tab opened by form submit, not a click |
| Focus-trapped modal | medium | Keyboard/click discipline required |
| Race conditions | hard | Double-submit protection; stale-response guard |
| RTL / non-Latin text | medium | Locale toggle to an RTL language |
| Toast stacking / ordering | low | Multiple sequential toasts |

Tiers map to benchmark scoring: a tool that only completes `easy` earns a
lower score than one clearing `hard`.

---

## 7. Mock API (MSW)

Handlers cover:

- `GET /api/tickets` — pagination, filtering, sorting, optional injected latency/error
- `GET /api/tickets/:id` — detail
- `POST /api/tickets` / `PATCH` / `DELETE` — with realistic validation errors
- `GET /api/tickets/export.csv` — `text/csv` + `Content-Disposition: attachment`
- `GET /api/reports/:id.pdf` — `application/pdf` download
- `POST /api/uploads` — accepts `FormData`; enforces size/type rules
- `GET /api/customers`, `/api/inventory`, `/api/notifications`
- Static: `/embed/vendor` + `/embed/vendor/status` (nested iframe documents); external iframes point to real sites (practicetestautomation.com, demoqa.com)

Configuration via query/UI toggle: latency (fast/slow), failure rate,
pagination size — deterministic per run for reproducible benchmarks.

---

## 8. Scenario catalog format (`docs/scenarios.md`)

Each benchmark task is documented as:

```
ID: C6-download-02
Capability: Download
Tier: easy
Preconditions: on /inventory with "Low stock" filter applied
Task: Export the filtered inventory to CSV
Expected outcome: A file named inventory-low-stock-<date>.csv is downloaded
                   and contains exactly N rows matching the filter
Adversarial note: export button sits under a sticky table header (needs scroll)
```

---

## 9. Build phases

1. **Scaffold + shell** — Vite/TS, router, layout, MSW, seed data, toast/modal
   primitives.
2. **Core product pages** — list/detail/wizard with real async + filters
   (covers C3, C5, C9, C10, C11).
3. **Browser-capability flows** — C1, C2, C4, C6, C7, C8.
4. **Adversarial layer** — shadow DOM, virtualization, hover/occlusion,
   delayed/fast elements, races.
5. **Locale/theme + polish** — C12, C13, C14, C15.
6. **Scenario catalog** — complete `docs/scenarios.md` (the benchmark input).

---

## 10. Decisions log

| Decision | Choice |
|---|---|
| Verification model | Realistic interaction only — no server-side event log / scoring API |
| Auth | Out of scope for v1 |
| Domain | Customer Operations Console (tickets, customers, inventory, reports) |
| Scope of v1 | Capability-first MVP, then expand |
| Difficulty | Include adversarial edge cases, tiered |
| Seed data | Faker-generated, frozen into a deterministic checked-in set |
| Plan location | `docs/` |
