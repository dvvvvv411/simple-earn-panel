import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Package, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { BrandingDialog } from "@/components/admin/BrandingDialog";

interface Branding {
  id: string;
  name: string;
  domain?: string;
  type: 'kryptotrading' | 'festgeld' | 'sonstiges';
  logo_path: string | null;
  created_at: string;
  updated_at: string;
  branding_resend_configs?: {
    from_name: string;
    from_email: string;
    reply_to?: string;
    api_key?: string;
  };
}

export default function Brandings() {
  console.log('Brandings page component loaded successfully');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranding, setEditingBranding] = useState<Branding | null>(null);
  const [brandings, setBrandings] = useState<Branding[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBrandings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('brandings')
        .select(`
          *,
          branding_resend_configs (
            from_name,
            from_email,
            reply_to,
            api_key
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBrandings((data || []) as Branding[]);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Fehler beim Laden der Brandings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrandings();
  }, []);

  const handleEdit = (branding: Branding) => {
    setEditingBranding(branding);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Sind Sie sicher, dass Sie dieses Branding löschen möchten?')) return;
    try {
      const { error } = await supabase.from('brandings').delete().eq('id', id);
      if (error) throw error;
      setBrandings(prev => prev.filter(b => b.id !== id));
      toast.success('Branding erfolgreich gelöscht');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Fehler beim Löschen des Brandings');
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingBranding(null);
    // Refresh list after closing the dialog (create/update)
    fetchBrandings();
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'kryptotrading':
        return 'Krypto Trading';
      case 'festgeld':
        return 'Festgeld';
      case 'sonstiges':
        return 'Sonstiges';
      default:
        return type;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'kryptotrading':
        return 'default';
      case 'festgeld':
        return 'secondary';
      case 'sonstiges':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Brandings</h2>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Marken und deren Konfigurationen.
          </p>
        </div>
        <Button 
          variant="hero" 
          size="lg"
          onClick={() => setDialogOpen(true)}
          className="shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Branding hinzufügen
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-border/50 animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : brandings.length === 0 ? (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Keine Brandings vorhanden</h3>
            <p className="text-muted-foreground text-center mb-6">
              Erstellen Sie Ihr erstes Branding, um mit der Konfiguration zu beginnen.
            </p>
            <Button 
              variant="hero" 
              onClick={() => setDialogOpen(true)}
              className="shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Erstes Branding erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {brandings.map((branding) => (
            <Card key={branding.id} className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold text-foreground">
                      {branding.name}
                    </CardTitle>
                    <Badge variant={getTypeBadgeVariant(branding.type)} className="text-xs">
                      {getTypeLabel(branding.type)}
                    </Badge>
                  </div>
                  {branding.logo_path && (
                    <div className="w-12 h-12 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center">
                      <img 
                        src={`${supabase.storage.from('branding-logos').getPublicUrl(branding.logo_path).data.publicUrl}`}
                        alt={`${branding.name} Logo`}
                        className="w-10 h-10 object-contain rounded"
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {branding.branding_resend_configs && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{branding.branding_resend_configs.from_email}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(branding)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Bearbeiten
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(branding.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BrandingDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        branding={editingBranding}
      />
    </div>
  );
}
