import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSupportTickets, CreateTicketData } from "@/hooks/useSupportTickets";
import { MessageSquarePlus, Loader2 } from "lucide-react";

const formSchema = z.object({
  subject: z.string().min(5, "Betreff muss mindestens 5 Zeichen lang sein").max(100, "Betreff darf maximal 100 Zeichen lang sein"),
  message: z.string().min(20, "Nachricht muss mindestens 20 Zeichen lang sein").max(1000, "Nachricht darf maximal 1000 Zeichen lang sein"),
  category: z.enum(["technical", "account", "trading", "general"], {
    required_error: "Bitte wählen Sie eine Kategorie",
  }),
  priority: z.enum(["low", "medium", "high", "urgent"], {
    required_error: "Bitte wählen Sie eine Priorität",
  }),
});

export const SupportTicketForm: React.FC = () => {
  const { createTicket } = useSupportTickets();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      message: "",
      category: "general",
      priority: "medium",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const success = await createTicket(values as CreateTicketData);
    if (success) {
      form.reset();
    }
    setIsSubmitting(false);
  };

  const categoryLabels = {
    technical: "Technisches Problem",
    account: "Konto & Einstellungen", 
    trading: "Trading & Bots",
    general: "Allgemeine Anfrage"
  };

  const priorityLabels = {
    low: "Niedrig",
    medium: "Normal",
    high: "Hoch",
    urgent: "Dringend"
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/20">
          <MessageSquarePlus className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-foreground">Support-Ticket erstellen</h3>
          <p className="text-muted-foreground">Beschreiben Sie Ihr Anliegen und erhalten Sie schnelle Hilfe</p>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Betreff</FormLabel>
                <FormControl>
                  <Input placeholder="Beschreiben Sie Ihr Anliegen kurz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategorie</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <FormLabel>Priorität</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nachricht</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Beschreiben Sie Ihr Problem oder Ihre Frage detailliert..."
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ticket wird erstellt...
              </>
            ) : (
              <>
                <MessageSquarePlus className="mr-2 h-4 w-4" />
                Ticket erstellen
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};