import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';
export type Locale = 'en' | 'de' | 'ar';
export type Density = 'comfortable' | 'compact';
export type SidebarMode = 'pinned' | 'drawer';

interface UIState {
  theme: Theme;
  locale: Locale;
  density: Density;
  sidebarOpen: boolean;
  sidebarMode: SidebarMode;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setLocale: (locale: Locale) => void;
  setDensity: (density: Density) => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  setSidebarMode: (mode: SidebarMode) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'light',
      locale: 'en',
      density: 'comfortable',
      sidebarOpen: false,
      sidebarMode: 'pinned',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      setLocale: (locale) => set({ locale }),
      setDensity: (density) => set({ density }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      closeSidebar: () => set({ sidebarOpen: false }),
      setSidebarMode: (sidebarMode) => set({ sidebarMode }),
    }),
    { name: 'acmedesk-ui' },
  ),
);

export function applyDocumentChrome(theme: Theme, locale: Locale) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.lang = locale;
  root.dir = locale === 'ar' ? 'rtl' : 'ltr';
}
