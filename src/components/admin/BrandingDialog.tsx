import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

const brandingSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  type: z.enum(["kryptotrading", "festgeld", "sonstiges"]),
  fromName: z.string().min(1, "Absender-Name ist erforderlich"),
  fromEmail: z.string().email("Ungültige E-Mail-Adresse"),
  replyTo: z.string().email("Ungültige E-Mail-Adresse").optional().or(z.literal("")),
});

type BrandingFormData = z.infer<typeof brandingSchema>;

interface BrandingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branding?: {
    id: string;
    name: string;
    type: 'kryptotrading' | 'festgeld' | 'sonstiges';
    logo_path: string | null;
    branding_resend_configs?: {
      from_name: string;
      from_email: string;
      reply_to?: string;
    };
  } | null;
}

export function BrandingDialog({ open, onOpenChange, branding }: BrandingDialogProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    branding?.logo_path 
      ? `${supabase.storage.from('branding-logos').getPublicUrl(branding.logo_path).data.publicUrl}`
      : null
  );
  const queryClient = useQueryClient();

  const form = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      name: branding?.name || "",
      type: branding?.type || "sonstiges",
      fromName: branding?.branding_resend_configs?.from_name || "",
      fromEmail: branding?.branding_resend_configs?.from_email || "",
      replyTo: branding?.branding_resend_configs?.reply_to || "",
    },
  });

  const saveBrandingMutation = useMutation({
    mutationFn: async (data: BrandingFormData) => {
      let logoPath = branding?.logo_path;

      // Upload logo if a new file was selected
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('branding-logos')
          .upload(fileName, logoFile);

        if (uploadError) throw uploadError;
        logoPath = fileName;
      }

      // Create or update branding
      let brandingId = branding?.id;
      
      if (branding) {
        const { error: updateError } = await supabase
          .from('brandings')
          .update({
            name: data.name,
            type: data.type,
            logo_path: logoPath,
          })
          .eq('id', branding.id);

        if (updateError) throw updateError;
      } else {
        const { data: newBranding, error: insertError } = await supabase
          .from('brandings')
          .insert({
            name: data.name,
            type: data.type,
            logo_path: logoPath,
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        brandingId = newBranding.id;
      }

      // Upsert resend config
      const { error: configError } = await supabase
        .from('branding_resend_configs')
        .upsert({
          branding_id: brandingId,
          from_name: data.fromName,
          from_email: data.fromEmail,
          reply_to: data.replyTo || null,
        });

      if (configError) throw configError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brandings'] });
      toast.success(branding ? 'Branding aktualisiert' : 'Branding erstellt');
      onOpenChange(false);
      form.reset();
      setLogoFile(null);
      setLogoPreview(null);
    },
    onError: (error) => {
      toast.error('Fehler beim Speichern des Brandings');
      console.error('Save error:', error);
    },
  });

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const onSubmit = (data: BrandingFormData) => {
    saveBrandingMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background border-border/50">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {branding ? 'Branding bearbeiten' : 'Neues Branding erstellen'}
          </DialogTitle>
          <DialogDescription>
            Konfigurieren Sie Ihr Branding und die E-Mail-Einstellungen.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Branding Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Typ</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wählen Sie einen Typ" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="kryptotrading">Krypto Trading</SelectItem>
                        <SelectItem value="festgeld">Festgeld</SelectItem>
                        <SelectItem value="sonstiges">Sonstiges</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <label className="text-sm font-medium">Logo</label>
                {logoPreview ? (
                  <div className="relative inline-block">
                    <img 
                      src={logoPreview} 
                      alt="Logo Preview" 
                      className="w-24 h-24 object-contain border border-border rounded-lg bg-muted/50"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={removeLogo}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="border border-dashed border-border rounded-lg p-6 text-center bg-muted/20">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <span className="text-sm text-foreground">Logo hochladen</span>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Resend Konfiguration</h4>
              
              <FormField
                control={form.control}
                name="fromName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Absender-Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Ihr Unternehmen" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fromEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Absender-E-Mail</FormLabel>
                    <FormControl>
                      <Input placeholder="noreply@ihredomain.de" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="replyTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Antworten an (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="support@ihredomain.de" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                variant="hero"
                disabled={saveBrandingMutation.isPending}
              >
                {saveBrandingMutation.isPending ? 'Speichern...' : 'Speichern'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}