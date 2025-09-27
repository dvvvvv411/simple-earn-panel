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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/20">
            <Inbox className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground">Ihre Support-Tickets</h3>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                {userTickets.length} Tickets
              </Badge>
              <span className="text-muted-foreground">Übersicht Ihrer Anfragen</span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={refetch}
          className="text-muted-foreground hover:text-foreground hover:bg-primary/5 rounded-xl"
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