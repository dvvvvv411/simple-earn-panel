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
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-foreground">Ihre Support-Tickets</h3>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {userTickets.length} Tickets
              </Badge>
              <span className="text-xs text-muted-foreground">Übersicht Ihrer Anfragen</span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={refetch}
          className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg"
        >
          <RefreshCw className="h-3 w-3" />
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