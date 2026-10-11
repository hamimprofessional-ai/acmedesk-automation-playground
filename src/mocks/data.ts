import { faker } from '@faker-js/faker';

// Deterministic seed so practice runs are reproducible.
faker.seed(20241011);

export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Ticket {
  id: string;
  ref: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  customerId: string;
  customerName: string;
  assignee: string;
  tags: string[];
  attachments: number;
  createdAt: string;
  updatedAt: string;
  dueDate: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  plan: 'free' | 'pro' | 'enterprise';
  country: string;
  status: 'active' | 'trial' | 'churned';
  totalTickets: number;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  reorderLevel: number;
  warehouse: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

export interface Activity {
  id: string;
  actor: string;
  action: string;
  target: string;
  time: string;
}

export interface Comment {
  id: string;
  ticketId: string;
  author: string;
  body: string;
  createdAt: string;
  internal: boolean;
}

export const CATEGORIES = ['Billing', 'Technical', 'Account', 'Shipping', 'Feature Request', 'Bug'];
export const ASSIGNEES = [
  'Maya Chen',
  'Liam Novak',
  'Priya Nair',
  'Noah Fischer',
  'Sofia Marino',
  'Ethan Brooks',
  'Aisha Khan',
  'Diego Alvarez',
];

export const CURRENT_USER = 'Alex Vance';
export const WAREHOUSES = ['Amsterdam', 'Rotterdam', 'Berlin', 'Utrecht'];
export const PRODUCT_CATEGORIES = ['Accessories', 'Peripherals', 'Networking', 'Storage', 'Displays'];

function iso(d: Date): string {
  return d.toISOString();
}

export const customers: Customer[] = Array.from({ length: 60 }, () => {
  const name = faker.person.fullName();
  return {
    id: faker.string.uuid(),
    name,
    email: faker.internet.email({ firstName: name.split(' ')[0] }),
    company: faker.company.name(),
    plan: faker.helpers.arrayElement(['free', 'pro', 'enterprise']) as Customer['plan'],
    country: faker.location.country(),
    status: faker.helpers.arrayElement(['active', 'trial', 'churned']) as Customer['status'],
    totalTickets: faker.number.int({ min: 0, max: 40 }),
    createdAt: iso(faker.date.past({ years: 3 })),
  };
});

export const tickets: Ticket[] = Array.from({ length: 220 }, () => {
  const customer = faker.helpers.arrayElement(customers);
  const created = faker.date.past({ years: 1 });
  const status = faker.helpers.arrayElement([
    'open',
    'pending',
    'resolved',
    'closed',
  ]) as TicketStatus;
  return {
    id: faker.string.uuid(),
    ref: `TCK-${faker.number.int({ min: 1000, max: 9999 })}`,
    subject: faker.helpers.arrayElement([
      `Cannot ${faker.hacker.verb()} the ${faker.commerce.product()}`,
      `Issue with ${faker.commerce.productName()}`,
      `Request: ${faker.company.buzzPhrase()}`,
      `${faker.hacker.adjective()} ${faker.hacker.noun()} not working`,
      `Refund request for order ${faker.string.alphanumeric({ length: 8, casing: 'upper' })}`,
    ]),
    description: faker.lorem.paragraphs(2, '\n\n'),
    status,
    priority: faker.helpers.arrayElement([
      'low',
      'medium',
      'high',
      'urgent',
    ]) as TicketPriority,
    category: faker.helpers.arrayElement(CATEGORIES),
    customerId: customer.id,
    customerName: customer.name,
    assignee: faker.helpers.arrayElement(ASSIGNEES),
    tags: faker.helpers.arrayElements(
      ['billing', 'urgent', 'vip', 'bug', 'integration', 'how-to', 'refund'],
      { min: 0, max: 3 },
    ),
    attachments: faker.number.int({ min: 0, max: 5 }),
    createdAt: iso(created),
    updatedAt: iso(faker.date.between({ from: created, to: new Date() })),
    dueDate: iso(faker.date.soon({ days: 21, refDate: new Date() })),
  };
});

export const products: Product[] = Array.from({ length: 90 }, () => ({
  id: faker.string.uuid(),
  sku: `SKU-${faker.string.alphanumeric({ length: 6, casing: 'upper' })}`,
  name: faker.commerce.productName(),
  category: faker.helpers.arrayElement(PRODUCT_CATEGORIES),
  price: Number(faker.commerce.price({ min: 5, max: 900 })),
  stock: faker.number.int({ min: 0, max: 500 }),
  reorderLevel: faker.number.int({ min: 10, max: 60 }),
  warehouse: faker.helpers.arrayElement(WAREHOUSES),
  updatedAt: iso(faker.date.recent({ days: 30 })),
}));

export const notifications: Notification[] = Array.from({ length: 8 }, () => ({
  id: faker.string.uuid(),
  title: faker.helpers.arrayElement([
    'New ticket assigned',
    'SLA breach warning',
    'Customer reply received',
    'Low stock alert',
    'Payment failed',
  ]),
  body: faker.lorem.sentence(),
  time: iso(faker.date.recent({ days: 2 })),
  read: faker.datatype.boolean(),
}));

export const activity: Activity[] = tickets.slice(0, 12).map((t) => ({
  id: faker.string.uuid(),
  actor: faker.helpers.arrayElement(ASSIGNEES),
  action: faker.helpers.arrayElement([
    'resolved',
    'commented on',
    'reassigned',
    'closed',
    'reopened',
  ]),
  target: t.ref,
  time: iso(faker.date.recent({ days: 3 })),
}));

export const comments: Comment[] = tickets.slice(0, 40).flatMap((t) =>
  Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () => ({
    id: faker.string.uuid(),
    ticketId: t.id,
    author: faker.helpers.arrayElement(ASSIGNEES),
    body: faker.lorem.sentences(2),
    createdAt: iso(faker.date.recent({ days: 10 })),
    internal: faker.datatype.boolean(),
  })),
);

export const ticketCounts = {
  total: tickets.length,
  byStatus: tickets.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {}),
};

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type ShipmentStage =
  | 'label_created'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'exception';
export type ReturnStatus = 'requested' | 'approved' | 'rejected' | 'received' | 'refunded';
export type OrderChannel = 'web' | 'phone' | 'email' | 'partner';

export interface OrderLine {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  ref: string;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  channel: OrderChannel;
  items: OrderLine[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  shippingAddress: string;
  carrier?: string;
  trackingNumber?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentEvent {
  id: string;
  orderId: string;
  orderRef: string;
  stage: ShipmentStage;
  carrier: string;
  trackingNumber: string;
  location: string;
  note: string;
  at: string;
}

export interface ReturnRequest {
  id: string;
  ref: string;
  orderId: string;
  orderRef: string;
  customerName: string;
  reason: string;
  status: ReturnStatus;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];
export const PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded'];
export const SHIPMENT_STAGES: ShipmentStage[] = [
  'label_created',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'exception',
];
export const RETURN_STATUSES: ReturnStatus[] = [
  'requested',
  'approved',
  'rejected',
  'received',
  'refunded',
];
export const ORDER_CHANNELS: OrderChannel[] = ['web', 'phone', 'email', 'partner'];
export const CARRIERS = ['ParcelPal', 'SwiftShip', 'Northline', 'EuroFreight'];
export const RETURN_REASONS = [
  'Damaged on arrival',
  'Wrong item shipped',
  'No longer needed',
  'Not as described',
  'Arrived too late',
];

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function weighted<T>(pairs: [T, number][]): T {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let roll = faker.number.int({ min: 1, max: total });
  for (const [value, w] of pairs) {
    roll -= w;
    if (roll <= 0) return value;
  }
  return pairs[pairs.length - 1][0];
}

export const orders: Order[] = Array.from({ length: 84 }, (_, i) => {
  const customer = faker.helpers.arrayElement(customers);
  const items: OrderLine[] = Array.from(
    { length: faker.number.int({ min: 1, max: 4 }) },
    () => {
      const product = faker.helpers.arrayElement(products);
      return {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        quantity: faker.number.int({ min: 1, max: 4 }),
        unitPrice: product.price,
      };
    },
  );
  const subtotal = round2(items.reduce((s, it) => s + it.quantity * it.unitPrice, 0));
  const shipping = subtotal > 150 ? 0 : 9.95;
  const tax = round2(subtotal * 0.21);
  const status = weighted<OrderStatus>([
    ['pending', 2],
    ['processing', 3],
    ['shipped', 3],
    ['delivered', 5],
    ['cancelled', 1],
    ['refunded', 1],
  ]);
  const paymentStatus: PaymentStatus =
    status === 'refunded'
      ? 'refunded'
      : status === 'cancelled'
        ? weighted<PaymentStatus>([
            ['failed', 1],
            ['refunded', 2],
          ])
        : status === 'pending'
          ? weighted<PaymentStatus>([
              ['pending', 2],
              ['paid', 3],
            ])
          : 'paid';
  const created = faker.date.recent({ days: 90 });
  const fulfilled = status === 'shipped' || status === 'delivered' || status === 'refunded';
  return {
    id: faker.string.uuid(),
    ref: `ORD-${10000 + i}`,
    customerId: customer.id,
    customerName: customer.name,
    status,
    paymentStatus,
    channel: faker.helpers.arrayElement(ORDER_CHANNELS),
    items,
    subtotal,
    shipping,
    tax,
    total: round2(subtotal + shipping + tax),
    currency: 'EUR',
    shippingAddress: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.country()}`,
    carrier: fulfilled ? faker.helpers.arrayElement(CARRIERS) : undefined,
    trackingNumber: fulfilled
      ? faker.string.alphanumeric({ length: 12, casing: 'upper' })
      : undefined,
    notes: faker.datatype.boolean() ? faker.lorem.sentence() : '',
    createdAt: iso(created),
    updatedAt: iso(faker.date.between({ from: created, to: new Date() })),
  };
});

export const shipments: ShipmentEvent[] = orders.flatMap((o) => {
  if (o.status !== 'shipped' && o.status !== 'delivered' && o.status !== 'refunded') return [];
  const stages: ShipmentStage[] =
    o.status === 'shipped'
      ? ['label_created', 'picked_up', 'in_transit']
      : ['label_created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
  const base = new Date(o.createdAt).getTime();
  return stages.map((stage, idx) => ({
    id: faker.string.uuid(),
    orderId: o.id,
    orderRef: o.ref,
    stage,
    carrier: o.carrier ?? faker.helpers.arrayElement(CARRIERS),
    trackingNumber: o.trackingNumber ?? faker.string.alphanumeric({ length: 12, casing: 'upper' }),
    location: `${faker.location.city()}, ${faker.location.country()}`,
    note: faker.helpers.arrayElement([
      'Shipping label created',
      'Parcel picked up',
      'Departed sorting facility',
      'Out for delivery',
      'Delivered to recipient',
    ]),
    at: iso(new Date(base + (idx + 1) * 12 * 60 * 60 * 1000)),
  }));
});

export const returns: ReturnRequest[] = orders
  .filter((o) => o.status === 'delivered' || o.status === 'refunded')
  .slice(0, 18)
  .map((o, i) => {
    const status = weighted<ReturnStatus>([
      ['requested', 3],
      ['approved', 2],
      ['rejected', 1],
      ['received', 1],
      ['refunded', 1],
    ]);
    const created = faker.date.recent({ days: 30 });
    return {
      id: faker.string.uuid(),
      ref: `RMA-${5000 + i}`,
      orderId: o.id,
      orderRef: o.ref,
      customerName: o.customerName,
      reason: faker.helpers.arrayElement(RETURN_REASONS),
      status,
      amount: o.total,
      createdAt: iso(created),
      updatedAt: iso(faker.date.between({ from: created, to: new Date() })),
    };
  });

// Mutable in-memory store used by MSW handlers (writes persist for the session).
export const db = {
  tickets: [...tickets],
  customers: [...customers],
  products: [...products],
  notifications: [...notifications],
  comments: [...comments],
  activity: [...activity],
  orders: [...orders],
  shipments: [...shipments],
  returns: [...returns],
};
