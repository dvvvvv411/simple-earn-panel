import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupportTickets } from "@/hooks/useSupportTickets";
import { Send, MessageCircle, User, Crown, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'open':
      return { label: 'Offen', variant: 'destructive' as const };
    case 'in_progress':
      return { label: 'In Bearbeitung', variant: 'default' as const };
    case 'resolved':
      return { label: 'Gelöst', variant: 'secondary' as const };
    case 'closed':
      return { label: 'Geschlossen', variant: 'outline' as const };
    default:
      return { label: status, variant: 'default' as const };
  }
};

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case 'low':
      return { label: 'Niedrig', className: 'bg-green-100 text-green-800' };
    case 'medium':
      return { label: 'Mittel', className: 'bg-yellow-100 text-yellow-800' };
    case 'high':
      return { label: 'Hoch', className: 'bg-orange-100 text-orange-800' };
    case 'urgent':
      return { label: 'Dringend', className: 'bg-red-100 text-red-800' };
    default:
      return { label: priority, className: 'bg-gray-100 text-gray-800' };
  }
};

const SupportTicketDetail: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { tickets, messages, messagesLoading, loadTicketMessages, addTicketMessage } = useSupportTickets();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ticket = tickets.find(t => t.id === ticketId);

  useEffect(() => {
    if (ticketId) {
      loadTicketMessages(ticketId);
    }
  }, [ticketId, loadTicketMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ticketId) return;

    setSending(true);
    const success = await addTicketMessage(ticketId, newMessage.trim());
    if (success) {
      setNewMessage("");
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!ticket) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/kryptotrading/support')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zum Support
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Ticket nicht gefunden.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = getStatusConfig(ticket.status);
  const priorityConfig = getPriorityConfig(ticket.priority);

  return (
    <div className="space-y-6 p-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/kryptotrading/support')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zum Support
        </Button>
      </div>

      {/* Ticket header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{ticket.subject}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          <Badge className={priorityConfig.className}>{priorityConfig.label}</Badge>
          <span className="text-sm text-muted-foreground">
            Erstellt am {format(new Date(ticket.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
          </span>
        </div>
      </div>

      {/* Chat interface */}
      <Card className="flex flex-col h-[600px]">
        <CardHeader>
          <CardTitle className="text-lg">Ticket-Verlauf</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0 p-6">
          {/* Original ticket message */}
          <div className="mb-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4" />
              <span className="font-medium">Sie</span>
              <span className="text-sm text-muted-foreground">
                {format(new Date(ticket.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
              </span>
            </div>
            <p className="text-sm">{ticket.message}</p>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messagesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                      <div className="max-w-[70%]">
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.is_admin_message ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[70%] ${message.is_admin_message ? 'order-1' : 'order-2'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {message.is_admin_message ? (
                          <>
                            <Crown className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-primary">Support Team</span>
                          </>
                        ) : (
                          <>
                            <User className="h-4 w-4" />
                            <span className="text-sm font-medium">Sie</span>
                          </>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                        </span>
                      </div>
                      <div
                        className={`p-3 rounded-lg text-sm ${
                          message.is_admin_message
                            ? 'bg-primary/10 border border-primary/20'
                            : 'bg-muted'
                        }`}
                      >
                        {message.message}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message input */}
          {ticket.status !== 'closed' ? (
            <div className="mt-4 flex gap-2">
              <Textarea
                placeholder="Ihre Nachricht..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="min-h-[60px] resize-none"
                disabled={sending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                size="icon"
                className="self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="mt-4 p-3 bg-muted rounded-lg text-center text-sm text-muted-foreground">
              Dieses Ticket ist geschlossen. Sie können keine weiteren Nachrichten senden.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportTicketDetail;