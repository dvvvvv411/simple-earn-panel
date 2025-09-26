import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SupportTicket } from "@/hooks/useSupportTickets";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { MessageSquare, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";

interface SupportTicketCardProps {
  ticket: SupportTicket;
}

export const SupportTicketCard: React.FC<SupportTicketCardProps> = ({ ticket }) => {
  const navigate = useNavigate();
  
  const getStatusConfig = (status: SupportTicket['status']) => {
    const configs = {
      open: {
        color: "bg-orange-500/10 text-orange-700 border-orange-200",
        icon: MessageSquare,
        label: "Offen"
      },
      in_progress: {
        color: "bg-blue-500/10 text-blue-700 border-blue-200",
        icon: Clock,
        label: "In Bearbeitung"
      },
      resolved: {
        color: "bg-green-500/10 text-green-700 border-green-200",
        icon: CheckCircle,
        label: "Gelöst"
      },
      closed: {
        color: "bg-gray-500/10 text-gray-700 border-gray-200",
        icon: XCircle,
        label: "Geschlossen"
      }
    };
    return configs[status];
  };

  const getPriorityConfig = (priority: SupportTicket['priority']) => {
    const configs = {
      low: { color: "bg-gray-100 text-gray-800", label: "Niedrig" },
      medium: { color: "bg-blue-100 text-blue-800", label: "Normal" },
      high: { color: "bg-yellow-100 text-yellow-800", label: "Hoch" },
      urgent: { color: "bg-red-100 text-red-800", label: "Dringend" }
    };
    return configs[priority];
  };

  const getCategoryLabel = (category: SupportTicket['category']) => {
    const labels = {
      technical: "Technisch",
      account: "Konto",
      trading: "Trading",
      general: "Allgemein"
    };
    return labels[category];
  };

  const statusConfig = getStatusConfig(ticket.status);
  const priorityConfig = getPriorityConfig(ticket.priority);
  const StatusIcon = statusConfig.icon;

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer" 
      onClick={() => navigate(`/kryptotrading/support/ticket/${ticket.id}`)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{ticket.subject}</h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {ticket.message}
              </p>
            </div>
            <div className="flex items-center space-x-2 ml-3">
              <Badge className={statusConfig.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className={priorityConfig.color}>
                {priorityConfig.label}
              </Badge>
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {getCategoryLabel(ticket.category)}
              </span>
            </div>
            <span>
              {formatDistanceToNow(new Date(ticket.created_at), {
                addSuffix: true,
                locale: de
              })}
            </span>
          </div>

          {/* Click to view hint */}
          <div className="border-t border-border pt-2">
            <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              <span>Klicken Sie hier, um die Konversation zu öffnen</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};