import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './Layout';
import { RequireAuth } from './RequireAuth';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Tickets } from '@/pages/Tickets';
import { TicketDetail } from '@/pages/TicketDetail';
import { NewTicketWizard } from '@/pages/NewTicketWizard';
import { Customers } from '@/pages/Customers';
import { CustomerDetail } from '@/pages/CustomerDetail';
import { Inventory } from '@/pages/Inventory';
import { Orders } from '@/pages/Orders';
import { NewOrder } from '@/pages/NewOrder';
import { OrderDetail } from '@/pages/OrderDetail';
import { Shipments } from '@/pages/Shipments';
import { Returns } from '@/pages/Returns';
import { Reports } from '@/pages/Reports';
import { Settings } from '@/pages/Settings';
import { Capabilities } from '@/pages/Capabilities';
import { ChallengeHub } from '@/pages/ChallengeHub';
import { ChallengeDetail } from '@/pages/ChallengeDetail';
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
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/tickets/new" element={<NewTicketWizard />} />
            <Route path="/tickets/:id" element={<TicketDetail />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/new" element={<NewOrder />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/shipments" element={<Shipments />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/capabilities" element={<Capabilities />} />
            <Route path="/challenges" element={<ChallengeHub />} />
            <Route path="/challenges/:slug" element={<ChallengeDetail />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>
          {/* Routes rendered outside the main chrome (opened in new window/tab) */}
          <Route path="/popout/widget" element={<PopoutWidget />} />
        </Route>
      </Routes>
    </>
  );
}
