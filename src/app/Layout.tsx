import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket as TicketIcon,
  Users,
  Boxes,
  FileBarChart,
  Settings as SettingsIcon,
  ListChecks,
  Search,
  Moon,
  Sun,
  Menu,
} from 'lucide-react';
import { useUIStore } from '@/store/ui';
import { LOCALES, useTranslation } from '@/lib/i18n';
import { NotificationBell } from '@/components/NotificationBell';
import { ConsentBanner } from '@/components/ConsentBanner';
import { ToastHost } from '@/components/ToastHost';
import { cn } from '@/lib/cn';

const navItems = [
  { to: '/', key: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/tickets', key: 'nav.tickets', icon: TicketIcon },
  { to: '/customers', key: 'nav.customers', icon: Users },
  { to: '/inventory', key: 'nav.inventory', icon: Boxes },
  { to: '/reports', key: 'nav.reports', icon: FileBarChart },
  { to: '/settings', key: 'nav.settings', icon: SettingsIcon },
  { to: '/capabilities', key: 'nav.capabilities', icon: ListChecks },
];

export function Layout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const locale = useUIStore((s) => s.locale);
  const setLocale = useUIStore((s) => s.setLocale);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const [q, setQ] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: "/" focuses the global search.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
      if (e.key === '/' && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    navigate(`/tickets?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="flex min-h-screen">
      <ToastHost />
      <ConsentBanner />

      <aside
        className={cn(
          'sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-e border-slate-200 bg-white md:flex dark:border-slate-800 dark:bg-slate-900',
          !sidebarOpen && 'md:hidden',
        )}
        data-testid="sidebar"
      >
        <Link to="/" className="flex items-center gap-2 px-5 py-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 font-bold text-white">
            A
          </span>
          <span className="text-lg font-semibold tracking-tight">AcmeDesk</span>
        </Link>
        <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Primary">
          {navItems.map(({ to, key, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {t(key)}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-400 dark:border-slate-800">
          v1.0 · benchmark harness
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <button
            type="button"
            className="btn-ghost px-2 md:hidden"
            aria-label="Toggle navigation"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </button>

          <form onSubmit={onSearch} className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              type="search"
              name="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search tickets… (press /)"
              aria-label="Search tickets"
              data-testid="global-search"
              className="input ps-9"
            />
          </form>

          <div className="ms-auto flex items-center gap-1">
            <select
              aria-label="Language"
              data-testid="locale-switch"
              value={locale}
              onChange={(e) => setLocale(e.target.value as typeof locale)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            >
              {LOCALES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.native}
                </option>
              ))}
            </select>
            <button
              type="button"
              data-testid="theme-toggle"
              aria-label="Toggle theme"
              onClick={toggleTheme}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
            <NotificationBell />
            <Link
              to="/settings"
              className="ms-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white"
              aria-label="Your profile"
            >
              AV
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
