import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { User, UpdateUserData } from "@/types/user";

const updateUserSchema = z.object({
  first_name: z.string().min(1, "Vorname ist erforderlich"),
  last_name: z.string().min(1, "Nachname ist erforderlich"),
  phone: z.string().optional(),
  branding_id: z.string().optional(),
});

interface UserEditDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
}

interface Branding {
  id: string;
  name: string;
}

export function UserEditDialog({ user, open, onOpenChange, onUserUpdated }: UserEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [brandings, setBrandings] = useState<Branding[]>([]);

  const form = useForm<UpdateUserData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      branding_id: "",
    },
  });

  useEffect(() => {
    if (open) {
      fetchBrandings();
    }
  }, [open]);

  useEffect(() => {
    if (user) {
      form.reset({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
        branding_id: user.branding_id || "",
      });
    }
  }, [user, form]);

  const fetchBrandings = async () => {
    try {
      const { data, error } = await supabase
        .from('brandings')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setBrandings(data || []);
    } catch (error) {
      console.error('Error fetching brandings:', error);
      toast({
        title: "Fehler",
        description: "Brandings konnten nicht geladen werden.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: UpdateUserData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone || null,
          branding_id: data.branding_id || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Benutzer wurde erfolgreich aktualisiert.",
      });

      onOpenChange(false);
      onUserUpdated();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Fehler",
        description: error.message || "Benutzer konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background border border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Benutzer bearbeiten</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Bearbeiten Sie die Informationen des Benutzers.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Vorname</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Vorname eingeben" 
                        {...field} 
                        className="bg-background border-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Nachname</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nachname eingeben" 
                        {...field} 
                        className="bg-background border-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Telefonnummer</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Telefonnummer eingeben" 
                      {...field} 
                      className="bg-background border-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="branding_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Branding</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background border-input">
                        <SelectValue placeholder="Branding auswählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="">Kein Branding</SelectItem>
                      {brandings.map((branding) => (
                        <SelectItem key={branding.id} value={branding.id}>
                          {branding.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="border-input hover:bg-accent/50"
              >
                Abbrechen
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}