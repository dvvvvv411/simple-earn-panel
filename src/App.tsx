import React from "react";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import { AdminLayout } from "./components/admin/AdminLayout";
import { TradingLayout } from "./components/trading/TradingLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Brandings from "./pages/admin/Brandings";
import UsersPage from "./pages/admin/Users";
import Consultants from "./pages/admin/Consultants";
import AdminSupportPage from "./pages/admin/Support";
import Withdrawals from "./pages/admin/Withdrawals";
import TradingDashboard from "./pages/trading/Dashboard";
import TradingHistory from "./pages/trading/TradingHistory";
import Wallet from "./pages/trading/Wallet";
import Support from "./pages/trading/Support";
import SupportTicketDetail from "./pages/trading/SupportTicketDetail";
import Settings from "./pages/trading/Settings";
import NotFound from "./pages/NotFound";

const App: React.FC = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/brandings" replace />} />
            <Route path="brandings" element={<Brandings />} />
            <Route path="benutzer" element={<UsersPage />} />
            <Route path="berater" element={<Consultants />} />
            <Route path="auszahlungen" element={<Withdrawals />} />
            <Route path="support" element={<AdminSupportPage />} />
          </Route>
          <Route path="/kryptotrading" element={<TradingLayout />}>
            <Route index element={<TradingDashboard />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="historie" element={<TradingHistory />} />
            <Route path="support" element={<Support />} />
            <Route path="support/ticket/:ticketId" element={<SupportTicketDetail />} />
            <Route path="einstellungen" element={<Settings />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
