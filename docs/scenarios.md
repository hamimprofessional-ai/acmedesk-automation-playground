# AcmeDesk — Benchmark Scenario Catalog

Task catalog for benchmarking an AI test-automation tool. Each scenario lists the
capability, difficulty tier, preconditions, the task, and the expected outcome.

**How to run:** `npm install` then `npm run dev` (http://localhost:4040). The mock
backend runs in-browser via MSW. Data is deterministic (seeded). Use Settings →
"Backend simulation" to inject latency/failures and change page size.

**Selector hints:** `data-testid` attributes are provided where relevant and noted
as `[id]`. Many flows intentionally have **no** stable hooks and require text/role
targeting, visual inspection, or shadow-DOM traversal.

Tiers: `easy` · `medium` · `hard`.

---

## Directory

| Capability | Scenarios |
|---|---|
| C1 New tab | C1-01, C1-02 |
| C2 New window | C2-01 |
| C3 Back/forward | C3-01, C3-02 |
| C4 Native dialogs (alert/confirm/prompt) | C4-01 … C4-04 |
| C5 Modals / popups | C5-01 … C5-03 |
| C6 Download | C6-01 … C6-04 |
| C7 Upload | C7-01 … C7-03 |
| C8 Iframes | C8-01, C8-02 |
| C9 Toasts / async | C9-01, C9-02 |
| C10 Long / virtualized lists | C10-01, C10-02 |
| C11 Wizard / forms | C11-01, C11-02 |
| C12 Context menu / keyboard | C12-01, C12-02 |
| C13 Clipboard / print | C13-01, C13-02 |
| C14 Locale / theme / RTL | C14-01, C14-02 |
| C15 beforeunload guard | C15-01 |
| Adversarial | AD-01 … AD-09 |

---

## C1 — New tab

### C1-01 — Open a ticket in a new tab
- **Tier:** easy
- **Preconditions:** on `/tickets`
- **Task:** Open the first ticket row "Open in new tab" action.
- **Expected:** a new browser tab opens at `/tickets/:id`; the original tab stays on `/tickets`.
- **Selector:** row hover reveals `[open-newtab-<ref>]` (hidden until row hover).

### C1-02 — Open print view in a new tab
- **Tier:** easy
- **Preconditions:** on any `/tickets/:id`
- **Task:** Use "Open print view in new tab" in the Actions panel.
- **Expected:** new tab at `/tickets/:id?print=1`.

---

## C2 — New window (window.open with features)

### C2-01 — Pop out the live widget
- **Tier:** medium
- **Preconditions:** on `/` (dashboard)
- **Task:** Click `[popout-widget]`.
- **Expected:** a separate, resized **window** (480×380, no toolbar) opens showing
  `[popout-widget-root]` with live KPIs. The tool must handle a window, not a tab.

---

## C3 — Back / forward navigation with state

### C3-01 — Filters survive detail → back
- **Tier:** medium
- **Preconditions:** on `/tickets`, apply filter `status=open` and priority `urgent`, go to page 2.
- **Task:** Open a ticket, then use the browser Back button.
- **Expected:** returns to `/tickets` **with filters and page preserved** (filters are in the URL).

### C3-02 — Wizard step navigation
- **Tier:** medium
- **Preconditions:** on `/tickets/new`, filled step 1.
- **Task:** Move Next → Back → Next.
- **Expected:** step state and entered values persist across Next/Back.

---

## C4 — Native browser dialogs

### C4-01 — Confirm single delete
- **Tier:** medium
- **Preconditions:** on `/tickets`
- **Task:** Open a row's context menu (right-click or `MoreHorizontal`) → Delete; accept the confirm.
- **Expected:** a **native `window.confirm`** appears; on OK the row is removed.

### C4-02 — Bulk delete confirm
- **Tier:** medium
- **Task:** Select ≥2 rows → `[bulk-delete]`; accept.
- **Expected:** native confirm names the count; selected tickets are deleted.

### C4-03 — Prompt to name a saved view
- **Tier:** hard
- **Preconditions:** on `/tickets` with some filters applied.
- **Task:** `[saved-views]` → "Save current view"; enter a name in the **prompt**.
- **Expected:** native `window.prompt` appears; the view is saved and listed.

### C4-04 — Confirm discard on wizard cancel
- **Tier:** medium
- **Preconditions:** `/tickets/new` with unsaved input.
- **Task:** Click Cancel; dismiss (Cancel) first, then accept.
- **Expected:** native confirm asks to discard; cancel keeps you on the wizard, OK leaves to `/tickets`.

---

## C5 — Modals / popups

### C5-01 — In-app edit modal
- **Tier:** easy
- **Preconditions:** on `/inventory`
- **Task:** Click `[adjust-<sku>]`, change stock, Save.
- **Expected:** in-app modal; saving PATCHes and shows a success toast.

### C5-02 — Nested modals (escalation)
- **Tier:** hard
- **Preconditions:** on `/tickets/:id`
- **Task:** `[escalate]` → `[escalate-next]` → `[escalate-confirm]`.
- **Expected:** a second modal stacks over the first; only the top-most closes on Escape.

### C5-03 — Focus-trapped modal
- **Tier:** medium
- **Task:** Open any modal; press Tab repeatedly.
- **Expected:** focus cycles only within the modal; Escape closes it.

---

## C6 — Download

### C6-01 — Export filtered tickets to CSV
- **Tier:** medium
- **Preconditions:** on `/tickets`, filter `status=open`.
- **Task:** Click `[export-tickets]`.
- **Expected:** a file `tickets-<date>.csv` downloads; rows match the active filter.

### C6-02 — Export low-stock inventory
- **Tier:** medium
- **Preconditions:** on `/inventory`, enable `[low-stock-filter]`.
- **Task:** Click `[export-inventory]`.
- **Expected:** `inventory-low-stock-<date>.csv` downloads with only low-stock items.
- **Adversarial:** export button sits above a sticky table header; the button is fine,
  but pagination/rows near the viewport bottom may be covered by the consent banner.

### C6-03 — Download ticket PDF
- **Tier:** easy
- **Task:** On `/tickets/:id` click `[download-pdf]`.
- **Expected:** `<ref>.pdf` downloads (valid PDF).

### C6-04 — Generate then download a report
- **Tier:** hard
- **Task:** On `/reports` click `[generate-summary]`, wait for async completion, then download it.
- **Expected:** after a ~0.9s delay the report appears in `[generated-reports]`; downloading
  yields a PDF.

---

## C7 — Upload

### C7-01 — Attach files via the file picker
- **Tier:** medium
- **Task:** On `/tickets/:id` use `[ticket-attachments]` and select a PNG/PDF.
- **Expected:** file uploads (POST multipart) and is listed; success toast.

### C7-02 — Drag & drop upload
- **Tier:** hard
- **Task:** Drag a file onto the upload dropzone.
- **Expected:** same result as C7-01 via drag & drop.

### C7-03 — Upload validation error
- **Tier:** hard
- **Task:** Upload a file larger than 5 MB (or an unsupported type).
- **Expected:** error toast with the server message; file is rejected.

---

## C8 — Iframes

### C8-01 — Read data inside a cross-origin iframe
- **Tier:** medium
- **Preconditions:** on `/`
- **Task:** Read the heading text inside `[analytics-iframe]`, which embeds the real
  `https://practicetestautomation.com/practice-test-login/` page.
- **Expected:** tool must switch into the cross-origin iframe context to read content that is
  not rendered by the host app.

### C8-02 — Interact with a real third-party site in an iframe
- **Tier:** hard
- **Preconditions:** on `/settings`
- **Task:** Inside `[integration-iframe]` (the real `https://demoqa.com/` site), expand an
  accordion / click a menu item.
- **Expected:** the tool switches into the cross-origin iframe context and drives the external
  page's own DOM (no AcmeDesk selectors apply inside it).

---

## C9 — Toasts / async feedback

### C9-01 — Success toast on save
- **Tier:** easy
- **Task:** Save any settings section / create a ticket.
- **Expected:** `[toast]` appears with variant `success`.

### C9-02 — Wait for async state under latency
- **Tier:** medium
- **Preconditions:** set latency to ~2000ms in Settings.
- **Task:** Navigate to `/tickets`.
- **Expected:** a loading indicator shows; the tool must wait for rows rather than fail fast.

---

## C10 — Long / virtualized lists

### C10-01 — Paginate a table
- **Tier:** easy
- **Task:** On `/tickets` go to page 3 and check `[pagination-summary]`.
- **Expected:** correct range/count.

### C10-02 — Find a row that is not yet in the DOM
- **Tier:** hard
- **Preconditions:** on `/customers`
- **Task:** Find and open a specific customer that is far down the list (e.g. by scrolling).
- **Expected:** the tool must **scroll** `[customer-virtual-list]` — off-screen rows are not
  rendered until scrolled into view.

---

## C11 — Wizard / forms

### C11-01 — Complete create-ticket wizard
- **Tier:** medium
- **Task:** `/tickets/new`: choose customer, subject, details, review, submit.
- **Expected:** validation blocks short input; success toast + redirect to `/tickets`.

### C11-02 — Validation prevents progress
- **Tier:** medium
- **Task:** Click `[wizard-next]` with an empty subject.
- **Expected:** inline error shown; step does not advance.

---

## C12 — Context menu / keyboard

### C12-01 — Right-click context menu
- **Tier:** hard
- **Task:** Right-click a ticket row.
- **Expected:** `[context-menu]` appears at the cursor with actions.

### C12-02 — Keyboard shortcut
- **Tier:** medium
- **Task:** Press `/` (not in an input).
- **Expected:** `[global-search]` receives focus.

---

## C13 — Clipboard / print

### C13-01 — Copy ticket reference
- **Tier:** medium
- **Task:** On `/tickets/:id` click the copy icon next to `[ticket-ref]`.
- **Expected:** clipboard contains the ref; info toast.
- **Note:** clipboard read requires browser permission (test harness must grant it).

### C13-02 — Print
- **Tier:** medium
- **Task:** Click Print on a ticket.
- **Expected:** `window.print()` is invoked (test must handle/deny the print dialog).

---

## C14 — Locale / theme / RTL

### C14-01 — Switch to dark theme
- **Tier:** easy
- **Task:** Use `[theme-toggle]` or Settings `[theme-dark]`.
- **Expected:** `html` gains class `dark`; colors invert.

### C14-02 — Switch to Arabic (RTL)
- **Tier:** medium
- **Task:** Change `[locale-switch]` to العربية.
- **Expected:** `html` gets `dir="rtl"` and `lang="ar"`; nav labels become Arabic and layout mirrors.

---

## C15 — beforeunload guard

### C15-01 — Unsaved-changes guard
- **Tier:** hard
- **Preconditions:** `/tickets/new` with entered data.
- **Task:** Trigger a page unload (e.g. reload or navigate away).
- **Expected:** browser shows the native "Leave site?" beforeunload prompt.

---

## Adversarial scenarios

### AD-01 — Hover-only trigger
- **Tier:** medium — `[open-newtab-<ref>]` and the row menu are hidden until the row is hovered.

### AD-02 — Shadow DOM input
- **Tier:** hard — the wizard tag input is a `<acmedesk-tag-input>` web component
  (`[tag-input]`) inside an open Shadow DOM. Value/change must be read through the shadow root.

### AD-03 — Action inside an iframe
- **Tier:** hard — see C8-02.

### AD-04 — Virtualized list
- **Tier:** hard — see C10-02.

### AD-05 — Ambiguous selectors
- **Tier:** medium — Settings has three buttons labelled "Save" (`[save-appearance]`,
  `[save-language]`, `[save-backend]`). Targeting by text alone is ambiguous.

### AD-06 — Overlay / occlusion
- **Tier:** medium — the consent banner (`[consent-banner]`) overlays the bottom of the
  viewport until accepted (`[consent-accept]`), and inventory uses a sticky table header.

### AD-07 — Fast auto-dismiss
- **Tier:** hard — after a report download, `[flash-message]` disappears in **800 ms**.

### AD-08 — Non-click popup trigger
- **Tier:** hard — `/reports` "Preview in new tab" opens a new tab via **form submit**
  (`target="_blank"`), not a click handler.

### AD-09 — Race conditions / double submit
- **Tier:** hard — submit buttons disable while pending (comment send, wizard submit,
  stock save). A tool that double-clicks must not create duplicates.

---

## Suggested scoring

- Base points by tier: easy = 1, medium = 2, hard = 3.
- Award only if the **expected outcome is verified**, not merely if a click occurred.
- Track per-capability pass rate to surface which browser capabilities the tool handles
  weakly (e.g. native dialogs, windows vs tabs, shadow DOM, iframe context switching).
