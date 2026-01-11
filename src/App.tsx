import React from "react";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Auth from "./pages/Auth";
import { AdminLayout } from "./components/admin/AdminLayout";
import { TradingLayout } from "./components/trading/TradingLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Brandings from "./pages/admin/Brandings";
import UsersPage from "./pages/admin/Users";
import UserDetailPage from "./pages/admin/UserDetail";
import Consultants from "./pages/admin/Consultants";
import AdminSupportPage from "./pages/admin/Support";
import Withdrawals from "./pages/admin/Withdrawals";
import Deposits from "./pages/admin/Deposits";
import EmailTemplates from "./pages/admin/EmailTemplates";
import TelegramSettings from "./pages/admin/Telegram";
import KYCManagement from "./pages/admin/KYC";
import EurDeposits from "./pages/admin/EurDeposits";
import Credits from "./pages/admin/Credits";
import ActiveBots from "./pages/admin/ActiveBots";
import Tasks from "./pages/admin/Tasks";
import TradingDashboard from "./pages/trading/Dashboard";
import TradingHistory from "./pages/trading/TradingHistory";
import Wallet from "./pages/trading/Wallet";
import Bots from "./pages/trading/Bots";
import Support from "./pages/trading/Support";
import SupportTicketDetail from "./pages/trading/SupportTicketDetail";
import Settings from "./pages/trading/Settings";
import KYCVerification from "./pages/trading/KYCVerification";
import BankDeposit from "./pages/trading/BankDeposit";
import CreditApplication from "./pages/trading/CreditApplication";
import EarnMoney from "./pages/trading/EarnMoney";
import TaskDetail from "./pages/trading/TaskDetail";
import NotFound from "./pages/NotFound";

const App: React.FC = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/brandings" replace />} />
            <Route path="brandings" element={<Brandings />} />
            <Route path="benutzer" element={<UsersPage />} />
            <Route path="benutzer/:userId" element={<UserDetailPage />} />
            <Route path="kyc" element={<KYCManagement />} />
            <Route path="berater" element={<Consultants />} />
            <Route path="aktive-bots" element={<ActiveBots />} />
            <Route path="einzahlungen" element={<Deposits />} />
            <Route path="bank-kyc" element={<EurDeposits />} />
            <Route path="kredit" element={<Credits />} />
            <Route path="auftraege" element={<Tasks />} />
            <Route path="auszahlungen" element={<Withdrawals />} />
            <Route path="email-vorlagen" element={<EmailTemplates />} />
            <Route path="support" element={<AdminSupportPage />} />
            <Route path="telegram" element={<TelegramSettings />} />
          </Route>
          <Route path="/kryptotrading" element={<TradingLayout />}>
            <Route index element={<TradingDashboard />} />
            <Route path="bot" element={<Bots />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="historie" element={<TradingHistory />} />
            <Route path="support" element={<Support />} />
            <Route path="support/ticket/:ticketId" element={<SupportTicketDetail />} />
            <Route path="einstellungen" element={<Settings />} />
            <Route path="kyc" element={<KYCVerification />} />
            <Route path="bankeinzahlung" element={<BankDeposit />} />
            <Route path="kredit" element={<CreditApplication />} />
            <Route path="geld-verdienen" element={<EarnMoney />} />
            <Route path="geld-verdienen/:taskId" element={<TaskDetail />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </ThemeProvider>
  );
};

export default App;
