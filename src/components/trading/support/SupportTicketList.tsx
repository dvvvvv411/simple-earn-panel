import React from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSupportTickets } from "@/hooks/useSupportTickets";
import { SupportTicketCard } from "./SupportTicketCard";
import { Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const SupportTicketList: React.FC = () => {
  const { tickets, loading, refetch } = useSupportTickets();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Ihre Support-Tickets</h3>
        </div>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const userTickets = tickets.filter(ticket => ticket.user_id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Inbox className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Ihre Support-Tickets</h3>
          <Badge variant="secondary" className="ml-2">
            {userTickets.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={refetch}
          className="text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {userTickets.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Sie haben noch keine Support-Tickets erstellt.</p>
          <p className="text-sm">Erstellen Sie ein Ticket, wenn Sie Hilfe benötigen.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {userTickets.map((ticket) => (
            <SupportTicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
};