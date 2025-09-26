import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Clock, CheckCircle2 } from "lucide-react";
import { SupportTicket, SupportTicketMessage, useSupportTickets } from "@/hooks/useSupportTickets";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface SupportTicketDetailDialogProps {
  ticket: SupportTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'open':
      return { label: 'Offen', variant: 'destructive' as const, icon: Clock };
    case 'in_progress':
      return { label: 'In Bearbeitung', variant: 'default' as const, icon: Clock };
    case 'resolved':
      return { label: 'Gelöst', variant: 'default' as const, icon: CheckCircle2 };
    case 'closed':
      return { label: 'Geschlossen', variant: 'secondary' as const, icon: CheckCircle2 };
    default:
      return { label: status, variant: 'secondary' as const, icon: Clock };
  }
};

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case 'low':
      return { label: 'Niedrig', variant: 'secondary' as const };
    case 'medium':
      return { label: 'Mittel', variant: 'default' as const };
    case 'high':
      return { label: 'Hoch', variant: 'destructive' as const };
    case 'urgent':
      return { label: 'Dringend', variant: 'destructive' as const };
    default:
      return { label: priority, variant: 'secondary' as const };
  }
};

export const SupportTicketDetailDialog: React.FC<SupportTicketDetailDialogProps> = ({
  ticket,
  open,
  onOpenChange,
}) => {
  const { messages, messagesLoading, loadTicketMessages, addTicketMessage } = useSupportTickets();
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ticket && open) {
      loadTicketMessages(ticket.id);
    }
  }, [ticket, open, loadTicketMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!ticket || !newMessage.trim()) return;

    setSending(true);
    const success = await addTicketMessage(ticket.id, newMessage.trim());
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

  if (!ticket) return null;

  const statusConfig = getStatusConfig(ticket.status);
  const priorityConfig = getPriorityConfig(ticket.priority);
  const StatusIcon = statusConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{ticket.subject}</DialogTitle>
            <div className="flex items-center space-x-2">
              <Badge variant={priorityConfig.variant}>
                {priorityConfig.label}
              </Badge>
              <Badge variant={statusConfig.variant} className="flex items-center space-x-1">
                <StatusIcon className="h-3 w-3" />
                <span>{statusConfig.label}</span>
              </Badge>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Erstellt am {format(new Date(ticket.created_at), "dd.MM.yyyy 'um' HH:mm", { locale: de })}
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {/* Initial ticket message */}
              <div className="flex justify-start">
                <div className="max-w-[70%] bg-muted rounded-lg p-3">
                  <div className="text-sm font-medium mb-1">Sie</div>
                  <div className="text-sm">{ticket.message}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(new Date(ticket.created_at), "HH:mm", { locale: de })}
                  </div>
                </div>
              </div>

              {/* Admin response if exists */}
              {ticket.admin_response && (
                <div className="flex justify-end">
                  <div className="max-w-[70%] bg-primary text-primary-foreground rounded-lg p-3">
                    <div className="text-sm font-medium mb-1">Support-Team</div>
                    <div className="text-sm">{ticket.admin_response}</div>
                    <div className="text-xs opacity-75 mt-1">
                      {format(new Date(ticket.updated_at), "HH:mm", { locale: de })}
                    </div>
                  </div>
                </div>
              )}

              {/* Chat messages */}
              {messagesLoading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Nachrichten werden geladen...
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`flex ${message.is_admin_message ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-lg p-3 ${
                      message.is_admin_message 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <div className="text-sm font-medium mb-1">
                        {message.is_admin_message ? 'Support-Team' : 'Sie'}
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{message.message}</div>
                      <div className={`text-xs mt-1 ${message.is_admin_message ? 'opacity-75' : 'text-muted-foreground'}`}>
                        {format(new Date(message.created_at), "HH:mm", { locale: de })}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message input */}
          {ticket.status !== 'closed' && (
            <div className="border-t pt-4 mt-4">
              <div className="flex space-x-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Schreiben Sie Ihre Nachricht..."
                  className="flex-1 min-h-[60px] resize-none"
                  disabled={sending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Drücken Sie Enter zum Senden oder Shift+Enter für eine neue Zeile
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};