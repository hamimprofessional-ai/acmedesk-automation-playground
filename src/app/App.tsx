import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './Layout';
import { Dashboard } from '@/pages/Dashboard';
import { Tickets } from '@/pages/Tickets';
import { TicketDetail } from '@/pages/TicketDetail';
import { NewTicketWizard } from '@/pages/NewTicketWizard';
import { Customers } from '@/pages/Customers';
import { CustomerDetail } from '@/pages/CustomerDetail';
import { Inventory } from '@/pages/Inventory';
import { Reports } from '@/pages/Reports';
import { Settings } from '@/pages/Settings';
import { NotFound } from '@/pages/NotFound';
import { PopoutWidget } from '@/pages/PopoutWidget';
import { applyDocumentChrome, useUIStore } from '@/store/ui';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const theme = useUIStore((s) => s.theme);
  const locale = useUIStore((s) => s.locale);

  useEffect(() => {
    applyDocumentChrome(theme, locale);
  }, [theme, locale]);

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/tickets/new" element={<NewTicketWizard />} />
          <Route path="/tickets/:id" element={<TicketDetail />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
        {/* Routes rendered outside the main chrome (opened in new window/tab) */}
        <Route path="/popout/widget" element={<PopoutWidget />} />
      </Routes>
    </>
  );
}
