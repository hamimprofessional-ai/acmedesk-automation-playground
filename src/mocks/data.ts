import { faker } from '@faker-js/faker';

// Deterministic seed so benchmark runs are reproducible.
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

export const activity: Activity[] = Array.from({ length: 12 }, () => ({
  id: faker.string.uuid(),
  actor: faker.helpers.arrayElement(ASSIGNEES),
  action: faker.helpers.arrayElement([
    'resolved',
    'commented on',
    'reassigned',
    'closed',
    'reopened',
  ]),
  target: `TCK-${faker.number.int({ min: 1000, max: 9999 })}`,
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

// Mutable in-memory store used by MSW handlers (writes persist for the session).
export const db = {
  tickets: [...tickets],
  customers: [...customers],
  products: [...products],
  notifications: [...notifications],
  comments: [...comments],
  activity: [...activity],
};
