import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket as TicketIcon,
  Users,
  Boxes,
  ShoppingCart,
  Truck,
  RotateCcw,
  FileBarChart,
  Settings as SettingsIcon,
  ListChecks,
  FlaskConical,
  Search,
  Moon,
  Sun,
  Menu,
  User,
  LogOut,
} from 'lucide-react';
import { useUIStore } from '@/store/ui';
import { initialsOf, useAuthStore } from '@/store/auth';
import { CURRENT_USER } from '@/mocks/data';
import { LOCALES, useTranslation } from '@/lib/i18n';
import { NotificationBell } from '@/components/NotificationBell';
import { ConsentBanner } from '@/components/ConsentBanner';
import { ToastHost } from '@/components/ToastHost';
import { HoverClickDropdown } from '@/components/HoverClickDropdown';
import { Tooltip } from '@/components/Tooltip';
import { cn } from '@/lib/cn';
import { useMediaQuery } from '@/lib/useMediaQuery';

const navItems = [
  { to: '/', key: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/tickets', key: 'nav.tickets', icon: TicketIcon },
  { to: '/customers', key: 'nav.customers', icon: Users },
  { to: '/inventory', key: 'nav.inventory', icon: Boxes },
  { to: '/orders', key: 'nav.orders', icon: ShoppingCart },
  { to: '/shipments', key: 'nav.shipments', icon: Truck },
  { to: '/returns', key: 'nav.returns', icon: RotateCcw },
  { to: '/reports', key: 'nav.reports', icon: FileBarChart },
  { to: '/settings', key: 'nav.settings', icon: SettingsIcon },
  { to: '/challenges', key: 'nav.challenges', icon: FlaskConical },
  { to: '/capabilities', key: 'nav.capabilities', icon: ListChecks },
];

export function Layout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const locale = useUIStore((s) => s.locale);
  const setLocale = useUIStore((s) => s.setLocale);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const sidebarMode = useUIStore((s) => s.sidebarMode);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const closeSidebar = useUIStore((s) => s.closeSidebar);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const pinned = sidebarMode === 'pinned' && isDesktop;
  const showSidebar = pinned || sidebarOpen;
  const [q, setQ] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!sidebarOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSidebar();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [sidebarOpen, closeSidebar]);

  useEffect(() => {
    closeSidebar();
  }, [closeSidebar]);

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

      {showSidebar && !pinned && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 start-0 z-50 flex h-screen w-60 flex-col border-e border-slate-200 bg-white transition-transform duration-200 ease-out dark:border-slate-800 dark:bg-slate-900',
          pinned ? 'md:z-30' : 'shadow-xl',
          showSidebar ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full',
        )}
        data-testid="sidebar"
        data-sidebar-pinned={pinned ? 'true' : 'false'}
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
              onClick={closeSidebar}
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
          v1.0 · test automation practice site
        </div>
      </aside>

      <div className={cn('flex min-w-0 flex-1 flex-col', pinned && 'md:ps-60')}>
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <button
            type="button"
            className={cn('btn-ghost px-2', pinned && 'md:hidden')}
            aria-label="Toggle navigation"
            aria-expanded={showSidebar}
            data-testid="nav-drawer-toggle"
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
              className="me-2 h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            >
              {LOCALES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.native}
                </option>
              ))}
            </select>
            <Tooltip label="Toggle theme" side="bottom" testId="tooltip-theme">
              <button
                type="button"
                data-testid="theme-toggle"
                aria-label="Toggle theme"
                onClick={toggleTheme}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </button>
            </Tooltip>
            <Tooltip label="Notifications" side="bottom" testId="tooltip-notifications">
              <NotificationBell />
            </Tooltip>
            <HoverClickDropdown
              testId="profile-menu"
              ariaLabel="Account menu"
              triggerClassName="rounded-full px-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              trigger={
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                  {user ? initialsOf(user.name || user.username) : 'AV'}
                </span>
              }
              items={[
                {
                  label: 'Profile',
                  icon: <User className="h-4 w-4" />,
                  onSelect: () => navigate('/profile'),
                },
                {
                  label: 'My tickets',
                  icon: <TicketIcon className="h-4 w-4" />,
                  onSelect: () => navigate(`/tickets?assignee=${encodeURIComponent(CURRENT_USER)}`),
                },
                {
                  label: 'Preferences',
                  icon: <SettingsIcon className="h-4 w-4" />,
                  onSelect: () => navigate('/settings'),
                },
                {
                  label: 'Sign out',
                  icon: <LogOut className="h-4 w-4" />,
                  danger: true,
                  onSelect: () => {
                    signOut();
                    navigate('/login', { replace: true });
                  },
                },
              ]}
            />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
