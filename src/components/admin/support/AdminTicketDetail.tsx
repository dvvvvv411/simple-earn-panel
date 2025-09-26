import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SupportTicket, useSupportTickets } from "@/hooks/useSupportTickets";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { ArrowLeft, Send, MessageSquare, User, Calendar, Tag, AlertTriangle, CheckCircle } from "lucide-react";

interface AdminTicketDetailProps {
  ticket: SupportTicket;
  onBack: () => void;
}

export const AdminTicketDetail: React.FC<AdminTicketDetailProps> = ({ ticket, onBack }) => {
  const { updateTicketStatus } = useSupportTickets();
  const [response, setResponse] = useState("");
  const [newStatus, setNewStatus] = useState(ticket.status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleSubmit = async () => {
    if (!response.trim() && newStatus === ticket.status) return;
    
    setIsSubmitting(true);
    const success = await updateTicketStatus(
      ticket.id, 
      newStatus as SupportTicket['status'], 
      response.trim() || undefined
    );
    
    if (success) {
      setResponse("");
      onBack();
    }
    setIsSubmitting(false);
  };

  const handleCloseTicket = async () => {
    setIsClosing(true);
    const success = await updateTicketStatus(ticket.id, 'closed');
    if (success) {
      onBack();
    }
    setIsClosing(false);
  };

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

  const getCategoryLabel = (category: string) => {
    const labels = {
      technical: "Technisches Problem",
      account: "Konto & Einstellungen",
      trading: "Trading & Bots",
      general: "Allgemeine Anfrage"
    };
    return labels[category as keyof typeof labels] || "Unbekannt";
  };

  const statusConfig = getStatusConfig(ticket.status);
  const priorityConfig = getPriorityConfig(ticket.priority);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zur Liste
          </Button>
          <h1 className="text-2xl font-bold">Ticket Details</h1>
        </div>
        {ticket.status !== 'closed' && (
          <Button 
            variant="secondary" 
            onClick={handleCloseTicket}
            disabled={isClosing}
          >
            {isClosing ? (
              "Wird geschlossen..."
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Als abgeschlossen markieren
              </>
            )}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>{ticket.subject}</span>
                </span>
                <div className="flex items-center space-x-2">
                  <Badge className={statusConfig.color}>
                    {statusConfig.label}
                  </Badge>
                  <Badge className={priorityConfig.color}>
                    {priorityConfig.label}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Nachricht:</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">{ticket.message}</p>
                </div>
              </div>

              {ticket.admin_response && (
                <div>
                  <h4 className="font-medium mb-2">Vorherige Antwort:</h4>
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap">{ticket.admin_response}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Response Form */}
          <Card>
            <CardHeader>
              <CardTitle>Antwort senden</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status ändern:</label>
                <Select value={newStatus} onValueChange={(value) => setNewStatus(value as SupportTicket['status'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Offen</SelectItem>
                    <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                    <SelectItem value="resolved">Gelöst</SelectItem>
                    <SelectItem value="closed">Geschlossen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Antwort (optional):</label>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Ihre Antwort an den Kunden..."
                  className="min-h-[120px]"
                />
              </div>

              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting || (!response.trim() && newStatus === ticket.status)}
                className="w-full"
              >
                {isSubmitting ? (
                  "Wird gespeichert..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Antwort senden & Status aktualisieren
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Ticket Metadata */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ticket-Informationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Benutzer-ID</p>
                  <p className="text-sm text-muted-foreground">{ticket.user_id}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Erstellt</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(ticket.created_at), {
                      addSuffix: true,
                      locale: de
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Kategorie</p>
                  <p className="text-sm text-muted-foreground">
                    {getCategoryLabel(ticket.category)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Priorität</p>
                  <Badge className={priorityConfig.color}>
                    {priorityConfig.label}
                  </Badge>
                </div>
              </div>

              {ticket.resolved_at && (
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Gelöst am</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(ticket.resolved_at), {
                        addSuffix: true,
                        locale: de
                      })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};