export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  urgentTickets: number;
  customers: number;
  lowStock: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
  volume: { day: string; created: number; resolved: number }[];
}
