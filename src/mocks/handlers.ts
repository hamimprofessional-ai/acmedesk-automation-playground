import { http, HttpResponse, delay } from 'msw';
import { db, type Product, type Ticket } from './data';
import { mockConfig } from './config';
import { createPdf } from './pdf';

const ok = <T>(data: T) => HttpResponse.json(data as object);
const fail = (status: number, message: string) =>
  HttpResponse.json({ message }, { status });

async function sim(delayOverride?: number) {
  const ms = delayOverride ?? mockConfig.latencyMs;
  if (ms > 0) await delay(ms);
  return Math.random() < mockConfig.failureRate;
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

function csvEscape(v: unknown): string {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((r) => r.map(csvEscape).join(',')).join('\r\n');
}

function csvResponse(filename: string, csv: string) {
  return new HttpResponse('\uFEFF' + csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

function filterTickets(url: URL): Ticket[] {
  const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();
  const statuses = url.searchParams.getAll('status');
  const priorities = url.searchParams.getAll('priority');
  const categories = url.searchParams.getAll('category');
  const assignees = url.searchParams.getAll('assignee');
  const customerId = url.searchParams.get('customerId');

  let items = db.tickets.filter((t) => {
    if (statuses.length && !statuses.includes(t.status)) return false;
    if (priorities.length && !priorities.includes(t.priority)) return false;
    if (categories.length && !categories.includes(t.category)) return false;
    if (assignees.length && !assignees.includes(t.assignee)) return false;
    if (customerId && t.customerId !== customerId) return false;
    if (q) {
      const hay = `${t.ref} ${t.subject} ${t.customerName} ${t.tags.join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const sort = url.searchParams.get('sort') ?? 'updatedAt';
  const dir = url.searchParams.get('dir') === 'asc' ? 1 : -1;
  items = [...items].sort((a, b) => {
    const av = (a as unknown as Record<string, unknown>)[sort];
    const bv = (b as unknown as Record<string, unknown>)[sort];
    if (av == null || bv == null) return 0;
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
  return items;
}

export const handlers = [
  // ----- Config introspection (handy for a health check) --------------------
  http.get('/api/_config', async () => {
    await delay(60);
    return ok({ ...mockConfig });
  }),

  // ----- Tickets ------------------------------------------------------------
  http.get('/api/tickets', async ({ request }) => {
    if (await sim()) return fail(500, 'Failed to load tickets');
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? mockConfig.pageSize);
    const items = filterTickets(url);
    return ok(paginate(items, page, pageSize));
  }),

  // Must be declared before '/api/tickets/:id' so it is not captured as an id.
  http.get('/api/tickets/export.csv', async ({ request }) => {
    if (await sim(500)) return fail(500, 'Export failed');
    const url = new URL(request.url);
    const items = filterTickets(url);
    const csv = toCsv(
      ['Ref', 'Subject', 'Status', 'Priority', 'Category', 'Customer', 'Assignee', 'Updated'],
      items.map((t) => [
        t.ref,
        t.subject,
        t.status,
        t.priority,
        t.category,
        t.customerName,
        t.assignee,
        t.updatedAt.slice(0, 10),
      ]),
    );
    const stamp = new Date().toISOString().slice(0, 10);
    return csvResponse(`tickets-${stamp}.csv`, csv);
  }),

  http.get('/api/tickets/:id', async ({ params }) => {
    if (await sim()) return fail(500, 'Ticket not found');
    const t = db.tickets.find((x) => x.id === params.id || x.ref === params.id);
    if (!t) return fail(404, 'Ticket not found');
    const comments = db.comments.filter((c) => c.ticketId === t.id);
    return ok({ ticket: t, comments });
  }),

  http.post('/api/tickets', async ({ request }) => {
    if (await sim()) return fail(500, 'Could not create ticket');
    const body = (await request.json()) as Partial<Ticket>;
    if (!body.subject || body.subject.trim().length < 4) {
      return fail(422, 'Subject must be at least 4 characters');
    }
    const now = new Date().toISOString();
    const customer = db.customers.find((c) => c.id === body.customerId) ?? db.customers[0];
    const ticket: Ticket = {
      id: crypto.randomUUID(),
      ref: `TCK-${Math.floor(1000 + Math.random() * 8999)}`,
      subject: body.subject,
      description: body.description ?? '',
      status: body.status ?? 'open',
      priority: body.priority ?? 'medium',
      category: body.category ?? 'Technical',
      customerId: customer.id,
      customerName: customer.name,
      assignee: body.assignee ?? 'Unassigned',
      tags: body.tags ?? [],
      attachments: 0,
      createdAt: now,
      updatedAt: now,
      dueDate: body.dueDate ?? now,
    };
    db.tickets.unshift(ticket);
    return ok(ticket);
  }),

  http.patch('/api/tickets/:id', async ({ params, request }) => {
    if (await sim()) return fail(500, 'Could not update ticket');
    const idx = db.tickets.findIndex((x) => x.id === params.id);
    if (idx === -1) return fail(404, 'Ticket not found');
    const body = (await request.json()) as Partial<Ticket>;
    db.tickets[idx] = { ...db.tickets[idx], ...body, updatedAt: new Date().toISOString() };
    return ok(db.tickets[idx]);
  }),

  http.delete('/api/tickets/:id', async ({ params }) => {
    if (await sim()) return fail(500, 'Could not delete ticket');
    const idx = db.tickets.findIndex((x) => x.id === params.id);
    if (idx === -1) return fail(404, 'Ticket not found');
    db.tickets.splice(idx, 1);
    return ok({ ok: true });
  }),

  http.get('/api/tickets/:id/comments', async ({ params }) => {
    await delay(120);
    return ok(db.comments.filter((c) => c.ticketId === params.id));
  }),

  http.post('/api/tickets/:id/comments', async ({ params, request }) => {
    if (await sim()) return fail(500, 'Could not add comment');
    const body = (await request.json()) as { body: string; internal?: boolean };
    if (!body.body || body.body.trim().length < 2) return fail(422, 'Comment is too short');
    const comment = {
      id: crypto.randomUUID(),
      ticketId: String(params.id),
      author: 'You',
      body: body.body,
      createdAt: new Date().toISOString(),
      internal: !!body.internal,
    };
    db.comments.push(comment);
    return ok(comment);
  }),

  // ----- Customers ----------------------------------------------------------
  http.get('/api/customers', async ({ request }) => {
    if (await sim()) return fail(500, 'Failed to load customers');
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').toLowerCase();
    const plan = url.searchParams.get('plan');
    const status = url.searchParams.get('status');
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? mockConfig.pageSize);
    const items = db.customers.filter((c) => {
      if (plan && c.plan !== plan) return false;
      if (status && c.status !== status) return false;
      if (q && !`${c.name} ${c.email} ${c.company}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return ok(paginate(items, page, pageSize));
  }),

  http.get('/api/customers/:id', async ({ params }) => {
    if (await sim()) return fail(500, 'Customer not found');
    const c = db.customers.find((x) => x.id === params.id);
    if (!c) return fail(404, 'Customer not found');
    const tickets = db.tickets.filter((t) => t.customerId === c.id).slice(0, 10);
    return ok({ customer: c, tickets });
  }),

  // ----- Inventory ----------------------------------------------------------
  http.get('/api/inventory', async ({ request }) => {
    if (await sim()) return fail(500, 'Failed to load inventory');
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').toLowerCase();
    const category = url.searchParams.get('category');
    const warehouse = url.searchParams.get('warehouse');
    const lowStock = url.searchParams.get('lowStock') === 'true';
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? mockConfig.pageSize);
    const items = db.products.filter((p) => {
      if (category && p.category !== category) return false;
      if (warehouse && p.warehouse !== warehouse) return false;
      if (lowStock && p.stock > p.reorderLevel) return false;
      if (q && !`${p.name} ${p.sku}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return ok({
      ...paginate(items, page, pageSize),
      categories: [...new Set(db.products.map((p) => p.category))],
      warehouses: [...new Set(db.products.map((p) => p.warehouse))],
    });
  }),

  http.patch('/api/inventory/:id', async ({ params, request }) => {
    if (await sim()) return fail(500, 'Could not update stock');
    const idx = db.products.findIndex((x) => x.id === params.id);
    if (idx === -1) return fail(404, 'Product not found');
    const body = (await request.json()) as Partial<Product>;
    db.products[idx] = { ...db.products[idx], ...body, updatedAt: new Date().toISOString() };
    return ok(db.products[idx]);
  }),

  http.get('/api/inventory/export.csv', async ({ request }) => {
    if (await sim(500)) return fail(500, 'Export failed');
    const url = new URL(request.url);
    const lowStock = url.searchParams.get('lowStock') === 'true';
    const category = url.searchParams.get('category');
    const warehouse = url.searchParams.get('warehouse');
    const items = db.products.filter((p) => {
      if (category && p.category !== category) return false;
      if (warehouse && p.warehouse !== warehouse) return false;
      if (lowStock && p.stock > p.reorderLevel) return false;
      return true;
    });
    const csv = toCsv(
      ['SKU', 'Name', 'Category', 'Warehouse', 'Price', 'Stock', 'Reorder Level'],
      items.map((p) => [
        p.sku,
        p.name,
        p.category,
        p.warehouse,
        p.price.toFixed(2),
        p.stock,
        p.reorderLevel,
      ]),
    );
    const suffix = lowStock ? 'low-stock' : 'all';
    const stamp = new Date().toISOString().slice(0, 10);
    return csvResponse(`inventory-${suffix}-${stamp}.csv`, csv);
  }),

  // ----- Reports ------------------------------------------------------------
  http.post('/api/reports/generate', async ({ request }) => {
    if (await sim(900)) return fail(500, 'Report generation failed');
    const body = (await request.json()) as { type?: string };
    const id = crypto.randomUUID();
    return ok({
      id,
      name: `${body.type ?? 'summary'}-report-${new Date().toISOString().slice(0, 10)}.pdf`,
    });
  }),

  http.get('/api/reports/:name.pdf', async ({ params }) => {
    if (await sim(500)) return fail(500, 'Report not found');
    const lines = db.tickets
      .slice(0, 30)
      .map((t) => `${t.ref}  ${t.status.padEnd(9)}  ${t.customerName}`);
    const pdf = createPdf(`AcmeDesk Report — ${params.name}`, [
      `Generated: ${new Date().toISOString()}`,
      '',
      ...lines,
    ]);
    return new HttpResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${params.name}.pdf"`,
      },
    });
  }),

  // ----- Uploads ------------------------------------------------------------
  http.post('/api/uploads', async ({ request }) => {
    if (await sim(600)) return fail(500, 'Upload failed');
    const form = await request.formData();
    const files = form.getAll('files').filter((f): f is File => f instanceof File);
    if (files.length === 0) return fail(422, 'No files provided');
    const maxBytes = 5 * 1024 * 1024;
    const allowed = ['image/png', 'image/jpeg', 'application/pdf', 'text/csv'];
    for (const f of files) {
      if (f.size > maxBytes) return fail(413, `"${f.name}" exceeds the 5 MB limit`);
      if (f.type && !allowed.includes(f.type)) {
        return fail(415, `"${f.name}" has an unsupported type (${f.type})`);
      }
    }
    return ok({
      ok: true,
      files: files.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
        url: `/files/${encodeURIComponent(f.name)}`,
      })),
    });
  }),

  // ----- Notifications & activity ------------------------------------------
  http.get('/api/notifications', async () => {
    await delay(150);
    return ok(db.notifications);
  }),

  http.post('/api/notifications/:id/read', async ({ params }) => {
    const n = db.notifications.find((x) => x.id === params.id);
    if (n) n.read = true;
    return ok({ ok: true });
  }),

  http.post('/api/notifications/read-all', async () => {
    db.notifications.forEach((n) => (n.read = true));
    return ok({ ok: true });
  }),

  http.get('/api/activity', async () => {
    await delay(120);
    return ok(db.activity);
  }),

  // ----- Dashboard stats ----------------------------------------------------
  http.get('/api/stats', async () => {
    if (await sim()) return fail(500, 'Failed to load stats');
    const byStatus = db.tickets.reduce<Record<string, number>>((acc, t) => {
      acc[t.status] = (acc[t.status] ?? 0) + 1;
      return acc;
    }, {});
    const byPriority = db.tickets.reduce<Record<string, number>>((acc, t) => {
      acc[t.priority] = (acc[t.priority] ?? 0) + 1;
      return acc;
    }, {});
    const byCategory = db.tickets.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + 1;
      return acc;
    }, {});
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return d;
    });
    const volume = days.map((d) => {
      const key = d.toISOString().slice(0, 10);
      const count = db.tickets.filter((t) => t.createdAt.slice(0, 10) === key).length;
      return { day: key.slice(5), created: count, resolved: Math.max(0, count - 2) };
    });
    return ok({
      totalTickets: db.tickets.length,
      openTickets: byStatus.open ?? 0,
      urgentTickets: byPriority.urgent ?? 0,
      customers: db.customers.length,
      lowStock: db.products.filter((p) => p.stock <= p.reorderLevel).length,
      byStatus,
      byPriority,
      byCategory,
      volume,
    });
  }),

  // ----- Embedded analytics iframe (served as HTML) -------------------------
  http.get('/embed/analytics', async () => {
    await delay(200);
    const html = `<!doctype html><html><head><meta charset="utf-8"/><style>
      body{font-family:system-ui,sans-serif;margin:0;padding:16px;background:#0f172a;color:#e2e8f0}
      h2{margin:0 0 12px;font-size:15px}
      .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
      .tile{background:#1e293b;border-radius:10px;padding:14px}
      .v{font-size:22px;font-weight:700;color:#818cf8}
      .l{font-size:11px;text-transform:uppercase;color:#94a3b8}
    </style></head><body>
      <h2>Embedded Analytics</h2>
      <div class="grid">
        <div class="tile"><div class="v">${db.tickets.length}</div><div class="l">Tickets</div></div>
        <div class="tile"><div class="v">${db.customers.length}</div><div class="l">Customers</div></div>
        <div class="tile"><div class="v">${db.products.length}</div><div class="l">SKUs</div></div>
        <div class="tile"><div class="v">${db.products.filter((p) => p.stock <= p.reorderLevel).length}</div><div class="l">Low stock</div></div>
      </div>
    </body></html>`;
    return new HttpResponse(html, { headers: { 'Content-Type': 'text/html' } });
  }),

  // ----- Third-party consent / integration iframe ---------------------------
  http.get('/embed/consent', async () => {
    await delay(150);
    const html = `<!doctype html><html><head><meta charset="utf-8"/><style>
      body{font-family:system-ui,sans-serif;margin:0;padding:20px;background:#fff;color:#0f172a}
      h2{margin:0 0 8px;font-size:16px}
      button{background:#4f46e5;color:#fff;border:0;border-radius:8px;padding:10px 16px;cursor:pointer;font-size:14px}
      #done{display:none;color:#16a34a;font-weight:600;margin-top:12px}
    </style></head><body>
      <h2>Third-party Integration</h2>
      <p style="font-size:13px;color:#475569">Authorize AcmeDesk to sync with the warehouse provider.</p>
      <button id="authorize" data-testid="authorize">Authorize integration</button>
      <div id="done">✓ Integration authorized</div>
      <script>
        document.getElementById('authorize').addEventListener('click', function(){
          this.style.display='none';
          document.getElementById('done').style.display='block';
          parent.postMessage({source:'acmedesk-consent',type:'authorized'}, '*');
        });
      </script>
    </body></html>`;
    return new HttpResponse(html, { headers: { 'Content-Type': 'text/html' } });
  }),
];
