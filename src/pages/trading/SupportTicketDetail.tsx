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
      return { label: 'Niedrig', variant: 'secondary' as const };
    case 'medium':
      return { label: 'Mittel', variant: 'outline' as const };
    case 'high':
      return { label: 'Hoch', variant: 'destructive' as const };
    case 'urgent':
      return { label: 'Dringend', variant: 'destructive' as const };
    default:
      return { label: priority, variant: 'secondary' as const };
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
          <Badge variant={priorityConfig.variant}>{priorityConfig.label}</Badge>
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
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <span className="font-semibold text-foreground">Ursprüngliche Anfrage</span>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(ticket.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                </div>
              </div>
            </div>
            <p className="text-sm leading-relaxed pl-11">{ticket.message}</p>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : messages.length === 0 && !ticket.admin_response ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Noch keine Nachrichten in diesem Ticket.</p>
                  <p className="text-sm">Senden Sie eine Nachricht, um die Unterhaltung zu beginnen.</p>
                </div>
              ) : (
                <>
                  {/* Fallback: Show admin_response if no messages exist but admin_response is present */}
                  {messages.length === 0 && ticket.admin_response && (
                    <div className="flex justify-start group">
                      <div className="max-w-[80%] sm:max-w-[70%]">
                        <div className="flex items-center gap-2 mb-2 justify-start">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Crown className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-semibold text-primary">Support Team</span>
                        </div>
                        <div className="relative p-4 rounded-2xl shadow-sm border transition-all duration-200 bg-card border-border rounded-tl-md">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{ticket.admin_response}</p>
                          <div className="mt-2 flex justify-start">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(ticket.updated_at), "dd.MM.yyyy HH:mm", { locale: de })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Regular messages */}
                  {messages.length > 0 && (
                    <>
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.is_admin_message ? 'justify-start' : 'justify-end'} group`}
                        >
                          <div className={`max-w-[80%] sm:max-w-[70%]`}>
                            <div className={`flex items-center gap-2 mb-2 ${message.is_admin_message ? 'justify-start' : 'justify-end'}`}>
                              {message.is_admin_message ? (
                                <>
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Crown className="h-4 w-4 text-primary" />
                                  </div>
                                  <span className="text-sm font-semibold text-primary">Support Team</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-sm font-medium text-foreground">Sie</span>
                                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                </>
                              )}
                            </div>
                            <div
                              className={`relative p-4 rounded-2xl shadow-sm border transition-all duration-200 ${
                                message.is_admin_message
                                  ? 'bg-card border-border rounded-tl-md'
                                  : 'bg-primary/5 border-primary/20 rounded-tr-md'
                              }`}
                            >
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message}</p>
                              <div className={`mt-2 flex ${message.is_admin_message ? 'justify-start' : 'justify-end'}`}>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(message.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </>
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