import React from "react";
import { AdminTicketList } from "@/components/admin/support/AdminTicketList";
import { SupportAnalytics } from "@/components/admin/support/SupportAnalytics";

const AdminSupport: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Support-Verwaltung</h1>
        <p className="text-muted-foreground">
          Verwalten Sie alle Support-Tickets und bearbeiten Sie Kundenanfragen.
        </p>
      </div>

      {/* Analytics */}
      <SupportAnalytics />

      {/* Ticket Management */}
      <AdminTicketList />
    </div>
  );
};

export default AdminSupport;