import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SupportTicket, useSupportTickets } from "@/hooks/useSupportTickets";
import { Send, MessageCircle, User, Crown } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface SupportTicketDetailDialogProps {
  ticket: SupportTicket;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

export const SupportTicketDetailDialog: React.FC<SupportTicketDetailDialogProps> = ({
  ticket,
  open,
  onOpenChange,
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { messages, messagesLoading, loadTicketMessages, addTicketMessage } = useSupportTickets();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const statusConfig = getStatusConfig(ticket.status);
  const priorityConfig = getPriorityConfig(ticket.priority);

  useEffect(() => {
    if (open && ticket.id) {
      loadTicketMessages(ticket.id);
    }
  }, [open, ticket.id, loadTicketMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {ticket.subject}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 flex-wrap">
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            <Badge className={priorityConfig.className}>{priorityConfig.label}</Badge>
            <span className="text-sm text-muted-foreground">
              Erstellt am {format(new Date(ticket.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
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
          {ticket.status !== 'closed' && (
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
          )}

          {ticket.status === 'closed' && (
            <div className="mt-4 p-3 bg-muted rounded-lg text-center text-sm text-muted-foreground">
              Dieses Ticket ist geschlossen. Sie können keine weiteren Nachrichten senden.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};