import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Search, Loader2, MessageSquarePlus, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UserForTicket {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface AdminSupportTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedUserId?: string;
  onSuccess?: () => void;
}

const ticketSchema = z.object({
  subject: z.string().min(5, "Betreff muss mindestens 5 Zeichen haben"),
  message: z.string().min(10, "Nachricht muss mindestens 10 Zeichen haben"),
  category: z.enum(["technical", "account", "trading", "general"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

type TicketFormData = z.infer<typeof ticketSchema>;

export function AdminSupportTicketDialog({
  open,
  onOpenChange,
  preselectedUserId,
  onSuccess,
}: AdminSupportTicketDialogProps) {
  const [users, setUsers] = useState<UserForTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(preselectedUserId || null);
  const [selectedUser, setSelectedUser] = useState<UserForTicket | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: "",
      message: "",
      category: "general",
      priority: "medium",
    },
  });

  useEffect(() => {
    if (open) {
      if (preselectedUserId) {
        setSelectedUserId(preselectedUserId);
        fetchUserById(preselectedUserId);
      } else {
        setSelectedUserId(null);
        setSelectedUser(null);
        fetchUsers();
      }
      form.reset();
      setSearchTerm("");
    }
  }, [open, preselectedUserId]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setUsers((data || []) as UserForTicket[]);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserById = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setSelectedUser(data as UserForTicket);
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const getDisplayName = (user: UserForTicket) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) return user.first_name;
    if (user.last_name) return user.last_name;
    return user.email || "Unbekannt";
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    const name = `${user.first_name || ""} ${user.last_name || ""}`.toLowerCase();
    const email = user.email?.toLowerCase() || "";
    return name.includes(searchLower) || email.includes(searchLower);
  });

  const handleSelectUser = (user: UserForTicket) => {
    setSelectedUserId(user.id);
    setSelectedUser(user);
    setShowUserDropdown(false);
    setSearchTerm("");
  };

  const onSubmit = async (data: TicketFormData) => {
    if (!selectedUserId) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie einen Benutzer aus.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("support_tickets").insert([
        {
          user_id: selectedUserId,
          subject: data.subject,
          message: data.message,
          category: data.category,
          priority: data.priority,
          status: "open",
        },
      ]);

      if (error) throw error;

      // Send Telegram notification (fire and forget)
      supabase.functions
        .invoke("send-telegram-notification", {
          body: {
            event_type: "support_ticket",
            data: {
              user_id: selectedUserId,
              subject: data.subject,
              priority: data.priority,
              is_admin_created: true,
            },
          },
        })
        .catch((err) => console.log("Telegram notification error:", err));

      toast({
        title: "Ticket erstellt",
        description: "Das Support-Ticket wurde erfolgreich erstellt.",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast({
        title: "Fehler",
        description: "Ticket konnte nicht erstellt werden.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const categoryLabels = {
    technical: "Technisch",
    account: "Konto",
    trading: "Trading",
    general: "Allgemein",
  };

  const priorityLabels = {
    low: "Niedrig",
    medium: "Normal",
    high: "Hoch",
    urgent: "Dringend",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5" />
            Neues Support-Ticket erstellen
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* User Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Benutzer *</label>
              {preselectedUserId && selectedUser ? (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{getDisplayName(selectedUser)}</span>
                  {selectedUser.email && (
                    <span className="text-sm text-muted-foreground">
                      ({selectedUser.email})
                    </span>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={
                        selectedUser
                          ? getDisplayName(selectedUser)
                          : "Benutzer suchen..."
                      }
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowUserDropdown(true);
                      }}
                      onFocus={() => setShowUserDropdown(true)}
                      className="pl-10"
                    />
                  </div>
                  {showUserDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg">
                      <ScrollArea className="max-h-[200px]">
                        {loading ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-5 w-5 animate-spin" />
                          </div>
                        ) : filteredUsers.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground text-sm">
                            Keine Benutzer gefunden.
                          </div>
                        ) : (
                          filteredUsers.slice(0, 10).map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              className="w-full px-4 py-2 text-left hover:bg-muted transition-colors flex items-center justify-between"
                              onClick={() => handleSelectUser(user)}
                            >
                              <span className="font-medium">
                                {getDisplayName(user)}
                              </span>
                              <span className="text-sm text-muted-foreground truncate ml-2">
                                {user.email}
                              </span>
                            </button>
                          ))
                        )}
                      </ScrollArea>
                    </div>
                  )}
                  {selectedUser && !showUserDropdown && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Ausgewählt: {getDisplayName(selectedUser)} ({selectedUser.email})
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Subject */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Betreff *</FormLabel>
                  <FormControl>
                    <Input placeholder="Betreff des Tickets" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategorie *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Kategorie wählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priorität *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Priorität wählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(priorityLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Message */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nachricht *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Beschreiben Sie das Anliegen..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={submitting || !selectedUserId}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <MessageSquarePlus className="h-4 w-4 mr-2" />
                )}
                Ticket erstellen
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
