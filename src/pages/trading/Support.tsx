import React from "react";
import { SupportTicketForm } from "@/components/trading/support/SupportTicketForm";
import { SupportTicketList } from "@/components/trading/support/SupportTicketList";
import { PersonalConsultantCTA } from "@/components/trading/support/PersonalConsultantCTA";
import { Card, CardContent } from "@/components/ui/card";

const Support: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Support & Beratung</h1>
        <p className="text-muted-foreground">
          Benötigen Sie Hilfe? Sprechen Sie mit Ihrem persönlichen Berater oder erstellen Sie ein Support-Ticket.
        </p>
      </div>

      {/* Personal Consultant CTA */}
      <PersonalConsultantCTA />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Support Ticket Form */}
        <Card>
          <CardContent className="p-6">
            <SupportTicketForm />
          </CardContent>
        </Card>

        {/* Support Ticket List */}
        <Card>
          <CardContent className="p-6">
            <SupportTicketList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Support;