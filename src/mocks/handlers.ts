import { http, HttpResponse, delay } from 'msw';
import {
  db,
  CARRIERS,
  ORDER_STATUSES,
  RETURN_STATUSES,
  SHIPMENT_STAGES,
  type Order,
  type OrderChannel,
  type OrderLine,
  type Product,
  type ReturnRequest,
  type ReturnStatus,
  type ShipmentEvent,
  type ShipmentStage,
  type Ticket,
} from './data';
import { mockConfig } from './config';
import { createPdf } from './pdf';

const ok = <T>(data: T) => HttpResponse.json(data as object);
const fail = (status: number, message: string) =>
  HttpResponse.json({ message }, { status });

const round2 = (n: number) => Math.round(n * 100) / 100;

const SHIPMENT_PROGRESSION: ShipmentStage[] = [
  'label_created',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
];

const fakerCarrier = () => CARRIERS[Math.floor(Math.random() * CARRIERS.length)];

// Rolling counter for the Challenge Lab rate-limit endpoint.
let rateLimitHits = 0;

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

function filterOrders(url: URL): Order[] {
  const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();
  const statuses = url.searchParams.getAll('status');
  const payment = url.searchParams.get('payment');
  const channel = url.searchParams.get('channel');
  const customerId = url.searchParams.get('customerId');

  const items = db.orders.filter((o) => {
    if (statuses.length && !statuses.includes(o.status)) return false;
    if (payment && o.paymentStatus !== payment) return false;
    if (channel && o.channel !== channel) return false;
    if (customerId && o.customerId !== customerId) return false;
    if (q && !`${o.ref} ${o.customerName} ${o.trackingNumber ?? ''}`.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });

  const sort = url.searchParams.get('sort') ?? 'createdAt';
  const dir = url.searchParams.get('dir') === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => {
    const av = (a as unknown as Record<string, unknown>)[sort];
    const bv = (b as unknown as Record<string, unknown>)[sort];
    if (av == null || bv == null) return 0;
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
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

  // ----- Orders & fulfillment ----------------------------------------------
  http.get('/api/orders', async ({ request }) => {
    if (await sim()) return fail(500, 'Failed to load orders');
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? mockConfig.pageSize);
    const items = filterOrders(url);
    return ok({
      ...paginate(items, page, pageSize),
      counts: ORDER_STATUSES.reduce<Record<string, number>>((acc, s) => {
        acc[s] = db.orders.filter((o) => o.status === s).length;
        return acc;
      }, {}),
    });
  }),

  http.get('/api/orders/export.csv', async ({ request }) => {
    if (await sim(500)) return fail(500, 'Export failed');
    const url = new URL(request.url);
    const items = filterOrders(url);
    const csv = toCsv(
      ['Ref', 'Customer', 'Items', 'Currency', 'Subtotal', 'Shipping', 'Tax', 'Total', 'Payment', 'Status', 'Channel', 'Created'],
      items.map((o) => [
        o.ref,
        o.customerName,
        String(o.items.length),
        o.currency,
        o.subtotal.toFixed(2),
        o.shipping.toFixed(2),
        o.tax.toFixed(2),
        o.total.toFixed(2),
        o.paymentStatus,
        o.status,
        o.channel,
        o.createdAt.slice(0, 10),
      ]),
    );
    const stamp = new Date().toISOString().slice(0, 10);
    return csvResponse(`orders-${stamp}.csv`, csv);
  }),

  http.get('/api/orders/:id', async ({ params }) => {
    if (await sim()) return fail(500, 'Order not found');
    const order = db.orders.find((x) => x.id === params.id || x.ref === params.id);
    if (!order) return fail(404, 'Order not found');
    return ok({
      order,
      shipments: db.shipments
        .filter((s) => s.orderId === order.id)
        .sort((a, b) => a.at.localeCompare(b.at)),
      returns: db.returns.filter((r) => r.orderId === order.id),
    });
  }),

  http.post('/api/orders', async ({ request }) => {
    if (await sim()) return fail(500, 'Could not create order');
    const body = (await request.json()) as Partial<Order> & { items?: OrderLine[] };
    if (!body.customerId) return fail(422, 'Select a customer');
    if (!body.items || body.items.length === 0) return fail(422, 'Add at least one line item');
    const customer = db.customers.find((c) => c.id === body.customerId) ?? db.customers[0];
    const items: OrderLine[] = body.items.map((it) => ({
      productId: it.productId,
      sku: it.sku,
      name: it.name,
      quantity: Math.max(1, Number(it.quantity) || 1),
      unitPrice: Number(it.unitPrice) || 0,
    }));
    const subtotal = round2(items.reduce((s, it) => s + it.quantity * it.unitPrice, 0));
    const shipping = subtotal > 150 ? 0 : 9.95;
    const tax = round2(subtotal * 0.21);
    const now = new Date().toISOString();
    const order: Order = {
      id: crypto.randomUUID(),
      ref: `ORD-${Math.floor(10000 + Math.random() * 89999)}`,
      customerId: customer.id,
      customerName: customer.name,
      status: 'pending',
      paymentStatus: 'pending',
      channel: (body.channel as OrderChannel) ?? 'web',
      items,
      subtotal,
      shipping,
      tax,
      total: round2(subtotal + shipping + tax),
      currency: 'EUR',
      shippingAddress: body.shippingAddress ?? '',
      notes: body.notes ?? '',
      createdAt: now,
      updatedAt: now,
    };
    db.orders.unshift(order);
    return ok(order);
  }),

  http.patch('/api/orders/:id', async ({ params, request }) => {
    if (await sim()) return fail(500, 'Could not update order');
    const idx = db.orders.findIndex((x) => x.id === params.id);
    if (idx === -1) return fail(404, 'Order not found');
    const body = (await request.json()) as Partial<Order>;
    db.orders[idx] = { ...db.orders[idx], ...body, updatedAt: new Date().toISOString() };
    return ok(db.orders[idx]);
  }),

  http.post('/api/orders/:id/ship', async ({ params, request }) => {
    if (await sim()) return fail(500, 'Could not create shipment');
    const idx = db.orders.findIndex((x) => x.id === params.id);
    if (idx === -1) return fail(404, 'Order not found');
    const body = (await request.json()) as { carrier?: string; trackingNumber?: string };
    const carrier = body.carrier || fakerCarrier();
    const trackingNumber =
      body.trackingNumber || Math.random().toString(36).slice(2, 13).toUpperCase();
    const now = new Date().toISOString();
    const order = db.orders[idx];
    db.orders[idx] = {
      ...order,
      status: 'shipped',
      paymentStatus: order.paymentStatus === 'pending' ? 'paid' : order.paymentStatus,
      carrier,
      trackingNumber,
      updatedAt: now,
    };
    const event: ShipmentEvent = {
      id: crypto.randomUUID(),
      orderId: order.id,
      orderRef: order.ref,
      stage: 'label_created',
      carrier,
      trackingNumber,
      location: 'Fulfillment center',
      note: 'Shipping label created',
      at: now,
    };
    db.shipments.push(event);
    return ok({ order: db.orders[idx], event });
  }),

  http.post('/api/orders/:id/advance', async ({ params, request }) => {
    if (await sim()) return fail(500, 'Could not advance shipment');
    const order = db.orders.find((x) => x.id === params.id);
    if (!order) return fail(404, 'Order not found');
    const body = (await request.json().catch(() => ({}))) as { stage?: ShipmentStage };
    const events = db.shipments.filter((s) => s.orderId === order.id);
    const current = events.length ? events[events.length - 1].stage : 'label_created';
    const next =
      body.stage && SHIPMENT_STAGES.includes(body.stage)
        ? body.stage
        : SHIPMENT_PROGRESSION[Math.min(SHIPMENT_PROGRESSION.indexOf(current) + 1, SHIPMENT_PROGRESSION.length - 1)];
    const now = new Date().toISOString();
    const carrier = order.carrier ?? fakerCarrier();
    const trackingNumber = order.trackingNumber ?? Math.random().toString(36).slice(2, 13).toUpperCase();
    const event: ShipmentEvent = {
      id: crypto.randomUUID(),
      orderId: order.id,
      orderRef: order.ref,
      stage: next,
      carrier,
      trackingNumber,
      location: 'Sorting facility',
      note: `Shipment ${next.replace(/_/g, ' ')}`,
      at: now,
    };
    db.shipments.push(event);
    const idx = db.orders.findIndex((x) => x.id === order.id);
    db.orders[idx] = {
      ...order,
      carrier,
      trackingNumber,
      status: next === 'delivered' ? 'delivered' : 'shipped',
      updatedAt: now,
    };
    return ok(event);
  }),

  http.post('/api/orders/:id/reset-shipment', async ({ params }) => {
    if (await sim()) return fail(500, 'Could not reset shipment');
    const idx = db.orders.findIndex((x) => x.id === params.id);
    if (idx === -1) return fail(404, 'Order not found');
    const order = db.orders[idx];
    db.shipments = db.shipments.filter((s) => s.orderId !== order.id);
    db.orders[idx] = {
      ...order,
      status: 'processing',
      carrier: undefined,
      trackingNumber: undefined,
      updatedAt: new Date().toISOString(),
    };
    return ok(db.orders[idx]);
  }),

  http.post('/api/orders/:id/refund', async ({ params }) => {
    if (await sim()) return fail(500, 'Could not refund order');
    const idx = db.orders.findIndex((x) => x.id === params.id);
    if (idx === -1) return fail(404, 'Order not found');
    db.orders[idx] = {
      ...db.orders[idx],
      status: 'refunded',
      paymentStatus: 'refunded',
      updatedAt: new Date().toISOString(),
    };
    return ok(db.orders[idx]);
  }),

  http.post('/api/orders/:id/cancel', async ({ params }) => {
    if (await sim()) return fail(500, 'Could not cancel order');
    const idx = db.orders.findIndex((x) => x.id === params.id);
    if (idx === -1) return fail(404, 'Order not found');
    db.orders[idx] = { ...db.orders[idx], status: 'cancelled', updatedAt: new Date().toISOString() };
    return ok(db.orders[idx]);
  }),

  // ----- Shipments (fulfillment queue) --------------------------------------
  http.get('/api/shipments', async ({ request }) => {
    if (await sim()) return fail(500, 'Failed to load shipments');
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const carrier = url.searchParams.get('carrier');
    const q = (url.searchParams.get('q') ?? '').toLowerCase();
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? mockConfig.pageSize);
    const queue = db.orders
      .filter((o) => ['processing', 'shipped', 'delivered'].includes(o.status))
      .map((o) => {
        const events = db.shipments
          .filter((s) => s.orderId === o.id)
          .sort((a, b) => a.at.localeCompare(b.at));
        const latest = events[events.length - 1];
        return {
          orderId: o.id,
          orderRef: o.ref,
          customerName: o.customerName,
          status: o.status,
          carrier: o.carrier ?? '—',
          trackingNumber: o.trackingNumber ?? '—',
          stage: latest?.stage ?? 'not_shipped',
          location: latest?.location ?? '—',
          items: o.items.reduce((s, it) => s + it.quantity, 0),
          updatedAt: o.updatedAt,
        };
      })
      .filter((row) => {
        if (status && row.status !== status) return false;
        if (carrier && row.carrier !== carrier) return false;
        if (q && !`${row.orderRef} ${row.customerName} ${row.trackingNumber}`.toLowerCase().includes(q)) {
          return false;
        }
        return true;
      });
    return ok({ ...paginate(queue, page, pageSize), carriers: CARRIERS });
  }),

  // ----- Returns / RMA ------------------------------------------------------
  http.get('/api/returns', async ({ request }) => {
    if (await sim()) return fail(500, 'Failed to load returns');
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const q = (url.searchParams.get('q') ?? '').toLowerCase();
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? mockConfig.pageSize);
    const items = db.returns
      .filter((r) => {
        if (status && r.status !== status) return false;
        if (q && !`${r.ref} ${r.orderRef} ${r.customerName} ${r.reason}`.toLowerCase().includes(q)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return ok({
      ...paginate(items, page, pageSize),
      counts: RETURN_STATUSES.reduce<Record<string, number>>((acc, s) => {
        acc[s] = db.returns.filter((r) => r.status === s).length;
        return acc;
      }, {}),
    });
  }),

  http.post('/api/returns', async ({ request }) => {
    if (await sim()) return fail(500, 'Could not create return');
    const body = (await request.json()) as { orderId?: string; reason?: string };
    const order = db.orders.find((x) => x.id === body.orderId || x.ref === body.orderId);
    if (!order) return fail(404, 'Order not found');
    const now = new Date().toISOString();
    const ret: ReturnRequest = {
      id: crypto.randomUUID(),
      ref: `RMA-${Math.floor(1000 + Math.random() * 8999)}`,
      orderId: order.id,
      orderRef: order.ref,
      customerName: order.customerName,
      reason: body.reason || 'No longer needed',
      status: 'requested',
      amount: order.total,
      createdAt: now,
      updatedAt: now,
    };
    db.returns.unshift(ret);
    return ok(ret);
  }),

  http.patch('/api/returns/:id', async ({ params, request }) => {
    if (await sim()) return fail(500, 'Could not update return');
    const idx = db.returns.findIndex((x) => x.id === params.id);
    if (idx === -1) return fail(404, 'Return not found');
    const body = (await request.json()) as { status?: ReturnStatus };
    db.returns[idx] = { ...db.returns[idx], ...body, updatedAt: new Date().toISOString() };
    return ok(db.returns[idx]);
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

  // ----- Challenge Lab endpoints -------------------------------------------
  http.get('/api/challenges/slow', async () => {
    const latencyMs = Math.round(1500 + Math.random() * 3000);
    await delay(latencyMs);
    return ok({
      latencyMs,
      servedAt: new Date().toISOString(),
      items: [
        { id: 'api', label: 'API calls', value: 1284 + Math.round(Math.random() * 500) },
        { id: 'seats', label: 'Seats in use', value: 34 },
        { id: 'storage', label: 'Storage (GB)', value: 128 },
        { id: 'jobs', label: 'Queued jobs', value: Math.round(Math.random() * 20) },
      ],
    });
  }),

  http.get('/api/challenges/flaky', async () => {
    await delay(300);
    if (Math.random() < 0.5) return fail(500, 'Upstream error (simulated)');
    return ok({ value: Math.round((120 + Math.random() * 4800) * 100) / 100 });
  }),

  http.get('/api/challenges/ratelimit', async () => {
    await delay(200);
    rateLimitHits += 1;
    if (rateLimitHits <= 2) {
      return new HttpResponse(JSON.stringify({ message: 'Too many requests — retry shortly' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '1' },
      });
    }
    rateLimitHits = 0;
    return ok({ ok: true });
  }),

  http.get('/api/challenges/timeout', async () => {
    await delay(6000);
    return ok({ ok: true });
  }),

  // ----- Nested iframe: vendor portal (level 1) embedding status widget (level 2) --
  http.get('/embed/vendor', async () => {
    await delay(180);
    const html = `<!doctype html><html><head><meta charset="utf-8"/><style>
      body{font-family:system-ui,sans-serif;margin:0;padding:16px;background:#f8fafc;color:#0f172a}
      h2{margin:0 0 4px;font-size:15px}
      .sub{font-size:12px;color:#64748b;margin-bottom:12px}
      .lvl{display:inline-block;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#6366f1;background:#e0e7ff;border-radius:999px;padding:2px 8px;margin-bottom:10px}
      .frame{border:1px solid #cbd5e1;border-radius:10px;overflow:hidden;background:#fff}
      iframe{display:block;width:100%;height:230px;border:0}
    </style></head><body>
      <span class="lvl">level 1 iframe</span>
      <h2>ParcelPal — Vendor Portal</h2>
      <div class="sub">Third-party logistics portal embedding its own status widget.</div>
      <div class="frame">
        <iframe data-testid="vendor-status-iframe" title="Vendor status" src="/embed/vendor/status"></iframe>
      </div>
      <script>
        window.addEventListener('message', function(e){
          if(e.data && e.data.source==='acmedesk-vendor-status'){
            parent.postMessage({source:'acmedesk-vendor', type:'status-refreshed', payload:e.data.payload}, '*');
          }
        });
      </script>
    </body></html>`;
    return new HttpResponse(html, { headers: { 'Content-Type': 'text/html' } });
  }),

  http.get('/embed/vendor/status', async () => {
    await delay(140);
    const html = `<!doctype html><html><head><meta charset="utf-8"/><style>
      body{font-family:system-ui,sans-serif;margin:0;padding:14px;background:#fff;color:#0f172a}
      .lvl{display:inline-block;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#0891b2;background:#cffafe;border-radius:999px;padding:2px 8px;margin-bottom:8px}
      .row{display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px}
      .val{font-weight:700;color:#4f46e5}
      button{background:#4f46e5;color:#fff;border:0;border-radius:8px;padding:8px 14px;cursor:pointer;font-size:13px;margin-top:12px}
    </style></head><body>
      <span class="lvl">level 2 iframe</span>
      <div class="row"><span>In transit</span><span class="val" id="transit" data-testid="vendor-transit">42</span></div>
      <div class="row"><span>Delivered today</span><span class="val" id="delivered">18</span></div>
      <div class="row"><span>Exceptions</span><span class="val" id="exceptions">2</span></div>
      <button id="refresh" data-testid="vendor-refresh">Refresh status</button>
      <script>
        var n = 0;
        document.getElementById('refresh').addEventListener('click', function(){
          n++;
          document.getElementById('transit').textContent = 42 + n;
          parent.postMessage({source:'acmedesk-vendor-status', payload:{transit:42+n}}, '*');
        });
      </script>
    </body></html>`;
    return new HttpResponse(html, { headers: { 'Content-Type': 'text/html' } });
  }),
];
