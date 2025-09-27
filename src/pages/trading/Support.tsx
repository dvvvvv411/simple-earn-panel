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

      <div className="space-y-6">
        {/* Support Ticket Form */}
        <Card className="relative overflow-hidden rounded-2xl border-2 border-blue-200/50 bg-background/60 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/20" />
          <CardContent className="relative p-6">
            <SupportTicketForm />
          </CardContent>
        </Card>

        {/* Support Ticket List */}
        <Card className="relative overflow-hidden rounded-xl border border-border/50 bg-background/80">
          <div className="absolute inset-0 bg-gradient-to-br from-muted/20 via-transparent to-muted/10" />
          <CardContent className="relative p-6">
            <SupportTicketList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Support;