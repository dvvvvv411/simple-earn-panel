import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  domain: z.string().min(1, "Domain ist erforderlich"),
  type: z.enum(["kryptotrading", "festgeld", "sonstiges"]),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Ungültiges Hex-Farbformat (z.B. #1e90ff)").optional().or(z.literal("")),
  fromName: z.string().min(1, "Absender-Name ist erforderlich"),
  fromEmail: z.string().email("Ungültige E-Mail-Adresse"),
  replyTo: z.string().email("Ungültige E-Mail-Adresse").optional().or(z.literal("")),
  apiKey: z.string().min(1, "Resend API Key ist erforderlich"),
});

type BrandingFormData = z.infer<typeof brandingSchema>;

interface BrandingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branding?: {
    id: string;
    name: string;
    domain?: string;
    type: 'kryptotrading' | 'festgeld' | 'sonstiges';
    accent_color?: string | null;
    logo_path: string | null;
    branding_resend_configs?: {
      from_name: string;
      from_email: string;
      reply_to?: string;
      api_key?: string;
    };
  } | null;
}

export function BrandingDialog({ open, onOpenChange, branding }: BrandingDialogProps) {
  console.log('BrandingDialog component loaded successfully');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    branding?.logo_path 
      ? `${supabase.storage.from('branding-logos').getPublicUrl(branding.logo_path).data.publicUrl}`
      : null
  );
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      name: "",
      domain: "",
      type: "sonstiges",
      accentColor: "#e91e63",
      fromName: "",
      fromEmail: "",
      replyTo: "",
      apiKey: "",
    },
  });

  // Reset form values when branding prop changes
  useEffect(() => {
    if (branding) {
      form.reset({
        name: branding.name || "",
        domain: branding.domain || "",
        type: branding.type || "sonstiges",
        accentColor: branding.accent_color || "#e91e63", // Pinke Fallback-Farbe
        fromName: branding.branding_resend_configs?.from_name || "",
        fromEmail: branding.branding_resend_configs?.from_email || "",
        replyTo: branding.branding_resend_configs?.reply_to || "",
        apiKey: branding.branding_resend_configs?.api_key || "",
      });
      setLogoPreview(branding.logo_path 
        ? `${supabase.storage.from('branding-logos').getPublicUrl(branding.logo_path).data.publicUrl}`
        : null
      );
    } else {
      // Für neues Branding - Fallback-Werte
      form.reset({
        name: "",
        domain: "",
        type: "sonstiges",
        accentColor: "#e91e63", // Pinke Fallback-Farbe auch für neue Brandings
        fromName: "",
        fromEmail: "",
        replyTo: "",
        apiKey: "",
      });
      setLogoPreview(null);
    }
  }, [branding, form]);

  const saveBranding = async (data: BrandingFormData) => {
    setIsSaving(true);
    try {
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
            domain: data.domain,
            type: data.type,
            accent_color: data.accentColor || null,
            logo_path: logoPath,
          })
          .eq('id', branding.id);

        if (updateError) throw updateError;
      } else {
        const { data: newBranding, error: insertError } = await supabase
          .from('brandings')
          .insert({
            name: data.name,
            domain: data.domain,
            type: data.type,
            accent_color: data.accentColor || null,
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
          api_key: data.apiKey,
        }, { 
          onConflict: 'branding_id' 
        });

      if (configError) throw configError;

      toast.success(branding ? 'Branding aktualisiert' : 'Branding erstellt');
      
      // Reset form and close dialog
      form.reset();
      setLogoFile(null);
      setLogoPreview(null);
      onOpenChange(false);
    } catch (error) {
      toast.error('Fehler beim Speichern des Brandings');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

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

  const onSubmit = async (data: BrandingFormData) => {
    await saveBranding(data);
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
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domain</FormLabel>
                    <FormControl>
                      <Input placeholder="example.com" {...field} />
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

              <FormField
                control={form.control}
                name="accentColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Akzentfarbe</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={field.value || "#e91e63"}
                          onChange={field.onChange}
                          className="w-12 h-10 p-1 border border-border rounded cursor-pointer"
                        />
                        <Input
                          placeholder="#e91e63"
                          value={field.value || ""}
                          onChange={field.onChange}
                          className="flex-1"
                        />
                      </div>
                    </FormControl>
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

              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resend API Key</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
                        {...field} 
                      />
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
                disabled={isSaving}
              >
                {isSaving ? 'Speichern...' : 'Speichern'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}