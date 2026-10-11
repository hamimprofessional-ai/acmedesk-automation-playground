import { useUIStore, type Locale } from '@/store/ui';

export const LOCALES: { code: Locale; label: string; native: string; dir: 'ltr' | 'rtl' }[] = [
  { code: 'en', label: 'English', native: 'English', dir: 'ltr' },
  { code: 'de', label: 'German', native: 'Deutsch', dir: 'ltr' },
  { code: 'ar', label: 'Arabic', native: 'العربية', dir: 'rtl' },
];

type Dict = Record<string, string>;

const en: Dict = {
  'nav.dashboard': 'Dashboard',
  'nav.tickets': 'Tickets',
  'nav.customers': 'Customers',
  'nav.inventory': 'Inventory',
  'nav.orders': 'Orders',
  'nav.shipments': 'Shipments',
  'nav.returns': 'Returns',
  'nav.reports': 'Reports',
  'nav.settings': 'Settings',
  'nav.capabilities': 'Capabilities',
  'nav.challenges': 'Challenge Lab',
  'action.save': 'Save',
  'action.cancel': 'Cancel',
  'action.delete': 'Delete',
  'action.create': 'Create',
  'action.export': 'Export',
  'action.search': 'Search',
  'common.loading': 'Loading…',
  'common.noResults': 'No results found',
  'tickets.title': 'Support Tickets',
  'tickets.new': 'New ticket',
  'dashboard.title': 'Operations Dashboard',
};

const de: Dict = {
  'nav.dashboard': 'Übersicht',
  'nav.tickets': 'Tickets',
  'nav.customers': 'Kunden',
  'nav.inventory': 'Inventar',
  'nav.orders': 'Bestellungen',
  'nav.shipments': 'Sendungen',
  'nav.returns': 'Rücksendungen',
  'nav.reports': 'Berichte',
  'nav.settings': 'Einstellungen',
  'nav.capabilities': 'Fähigkeiten',
  'nav.challenges': 'Übungslabor',
  'action.save': 'Speichern',
  'action.cancel': 'Abbrechen',
  'action.delete': 'Löschen',
  'action.create': 'Erstellen',
  'action.export': 'Exportieren',
  'action.search': 'Suchen',
  'common.loading': 'Wird geladen…',
  'common.noResults': 'Keine Ergebnisse gefunden',
  'tickets.title': 'Support-Tickets',
  'tickets.new': 'Neues Ticket',
  'dashboard.title': 'Betriebsübersicht',
};

const ar: Dict = {
  'nav.dashboard': 'لوحة التحكم',
  'nav.tickets': 'التذاكر',
  'nav.customers': 'العملاء',
  'nav.inventory': 'المخزون',
  'nav.orders': 'الطلبات',
  'nav.shipments': 'الشحنات',
  'nav.returns': 'المرتجعات',
  'nav.reports': 'التقارير',
  'nav.settings': 'الإعدادات',
  'nav.capabilities': 'القدرات',
  'nav.challenges': 'مختبر التحديات',
  'action.save': 'حفظ',
  'action.cancel': 'إلغاء',
  'action.delete': 'حذف',
  'action.create': 'إنشاء',
  'action.export': 'تصدير',
  'action.search': 'بحث',
  'common.loading': 'جار التحميل…',
  'common.noResults': 'لا توجد نتائج',
  'tickets.title': 'تذاكر الدعم',
  'tickets.new': 'تذكرة جديدة',
  'dashboard.title': 'لوحة تحكم العمليات',
};

const DICTS: Record<Locale, Dict> = { en, de, ar };

export function useTranslation() {
  const locale = useUIStore((s) => s.locale);
  const t = (key: string, fallback?: string): string =>
    DICTS[locale]?.[key] ?? DICTS.en[key] ?? fallback ?? key;
  return { t, locale };
}
