import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import type { CreateUserData } from "@/types/user";

const createUserSchema = z.object({
  first_name: z.string().min(1, "Vorname ist erforderlich"),
  last_name: z.string().min(1, "Nachname ist erforderlich"),
  email: z.string().email("Gültige E-Mail-Adresse eingeben"),
  phone: z.string().optional(),
  branding_id: z.string().optional(),
  consultant_id: z.string().optional(),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen haben"),
});

interface UserCreateDialogProps {
  onUserCreated: () => void;
}

interface Branding {
  id: string;
  name: string;
}

interface Consultant {
  id: string;
  name: string;
}

export function UserCreateDialog({ onUserCreated }: UserCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [brandings, setBrandings] = useState<Branding[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [defaultConsultantId, setDefaultConsultantId] = useState<string | null>(null);

  const form = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      branding_id: "none",
      consultant_id: "",
      password: "",
    },
  });

  useEffect(() => {
    if (open) {
      fetchBrandings();
      fetchConsultants();
    }
  }, [open]);

  useEffect(() => {
    if (defaultConsultantId && !form.getValues('consultant_id')) {
      form.setValue('consultant_id', defaultConsultantId);
    }
  }, [defaultConsultantId, form]);

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

  const fetchConsultants = async () => {
    try {
      const { data, error } = await supabase
        .from('consultants')
        .select('id, name, is_default')
        .order('name');

      if (error) throw error;
      setConsultants(data || []);
      
      const defaultConsultant = data?.find(c => c.is_default);
      if (defaultConsultant) {
        setDefaultConsultantId(defaultConsultant.id);
      }
    } catch (error) {
      console.error('Error fetching consultants:', error);
      toast({
        title: "Fehler",
        description: "Berater konnten nicht geladen werden.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: CreateUserData) => {
    setIsLoading(true);
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.first_name,
            last_name: data.last_name,
            phone: data.phone,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update profile with branding_id and consultant_id if provided
        const updates: any = {};
        if (data.branding_id && data.branding_id !== "none") {
          updates.branding_id = data.branding_id;
        }
        if (data.consultant_id && data.consultant_id !== "none") {
          updates.consultant_id = data.consultant_id;
        }
        
        if (Object.keys(updates).length > 0) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', authData.user.id);

          if (profileError) throw profileError;
        }

        toast({
          title: "Erfolg",
          description: "Benutzer wurde erfolgreich erstellt.",
        });

        form.reset();
        setOpen(false);
        onUserCreated();
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Fehler",
        description: error.message || "Benutzer konnte nicht erstellt werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Benutzer erstellen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-background border border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Neuen Benutzer erstellen</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Fügen Sie einen neuen Benutzer zum System hinzu.
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">E-Mail</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="E-Mail eingeben" 
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background border-input">
                        <SelectValue placeholder="Branding auswählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="none">Kein Branding</SelectItem>
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
            <FormField
              control={form.control}
              name="consultant_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Berater</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || defaultConsultantId || undefined}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-background border-input">
                        <SelectValue placeholder="Berater auswählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="none">Kein Berater</SelectItem>
                      {consultants.map((consultant) => (
                        <SelectItem key={consultant.id} value={consultant.id}>
                          {consultant.name}
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Passwort</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Passwort eingeben" 
                      {...field} 
                      className="bg-background border-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
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
                Benutzer erstellen
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}