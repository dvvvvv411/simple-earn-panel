import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSupportTickets } from "@/hooks/useSupportTickets";
import { AdminTicketDetail } from "./AdminTicketDetail";
import { AdminSupportTicketDialog } from "./AdminSupportTicketDialog";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { Search, Filter, Eye, Plus } from "lucide-react";

export const AdminTicketList: React.FC = () => {
  const { tickets, loading, refetch } = useSupportTickets();
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusConfig = (status: string) => {
    const configs = {
      open: { color: "bg-orange-100 text-orange-800", label: "Offen" },
      in_progress: { color: "bg-blue-100 text-blue-800", label: "In Bearbeitung" },
      resolved: { color: "bg-green-100 text-green-800", label: "Gelöst" },
      closed: { color: "bg-gray-100 text-gray-800", label: "Geschlossen" }
    };
    return configs[status as keyof typeof configs] || configs.open;
  };

  const getPriorityConfig = (priority: string) => {
    const configs = {
      low: { color: "bg-gray-100 text-gray-800", label: "Niedrig" },
      medium: { color: "bg-blue-100 text-blue-800", label: "Normal" },
      high: { color: "bg-yellow-100 text-yellow-800", label: "Hoch" },
      urgent: { color: "bg-red-100 text-red-800", label: "Dringend" }
    };
    return configs[priority as keyof typeof configs] || configs.medium;
  };

  if (selectedTicket) {
    const ticket = tickets.find(t => t.id === selectedTicket);
    if (ticket) {
      return (
        <AdminTicketDetail 
          ticket={ticket} 
          onBack={() => setSelectedTicket(null)} 
        />
      );
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Support-Tickets verwalten</span>
            </CardTitle>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Neues Ticket
            </Button>
          </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tickets durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Status filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="open">Offen</SelectItem>
              <SelectItem value="in_progress">In Bearbeitung</SelectItem>
              <SelectItem value="resolved">Gelöst</SelectItem>
              <SelectItem value="closed">Geschlossen</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Priorität filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Prioritäten</SelectItem>
              <SelectItem value="urgent">Dringend</SelectItem>
              <SelectItem value="high">Hoch</SelectItem>
              <SelectItem value="medium">Normal</SelectItem>
              <SelectItem value="low">Niedrig</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Keine Tickets gefunden.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => {
              const statusConfig = getStatusConfig(ticket.status);
              const priorityConfig = getPriorityConfig(ticket.priority);
              
              return (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium truncate">{ticket.subject}</h4>
                      <Badge className={statusConfig.color}>
                        {statusConfig.label}
                      </Badge>
                      <Badge className={priorityConfig.color}>
                        {priorityConfig.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {ticket.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(ticket.created_at), {
                        addSuffix: true,
                        locale: de
                      })}
                    </p>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTicket(ticket.id)}
                    className="ml-4"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Anzeigen
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>

      <AdminSupportTicketDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={refetch}
      />
    </>
  );
};