import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  compensation: number;
  logo_path: string | null;
  created_at: string;
}

export function TaskTemplateManager() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    compensation: 0,
    logo_path: null as string | null
  });
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Fehler beim Laden der Vorlagen');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormData({ title: '', description: '', compensation: 0, logo_path: null });
    setSelectedFile(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (template: TaskTemplate) => {
    setEditingTemplate(template);
    setFormData({
      title: template.title,
      description: template.description,
      compensation: template.compensation,
      logo_path: template.logo_path
    });
    setSelectedFile(null);
    setDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!selectedFile) return formData.logo_path;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('task-logos')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      return filePath;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Fehler beim Hochladen des Logos');
      return formData.logo_path;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) {
      toast.error('Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    try {
      const logoPath = await uploadLogo();

      if (editingTemplate) {
        const { error } = await supabase
          .from('task_templates')
          .update({
            title: formData.title,
            description: formData.description,
            compensation: formData.compensation,
            logo_path: logoPath
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast.success('Vorlage aktualisiert');
      } else {
        const { error } = await supabase
          .from('task_templates')
          .insert({
            title: formData.title,
            description: formData.description,
            compensation: formData.compensation,
            logo_path: logoPath
          });

        if (error) throw error;
        toast.success('Vorlage erstellt');
      }

      setDialogOpen(false);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Fehler beim Speichern');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Vorlage wirklich löschen?')) return;

    try {
      const { error } = await supabase
        .from('task_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Vorlage gelöscht');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  const getLogoUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from('task-logos').getPublicUrl(path);
    return data.publicUrl;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Auftragsvorlagen</CardTitle>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Neue Vorlage
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Laden...</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Keine Vorlagen vorhanden
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Logo</TableHead>
                <TableHead>Titel</TableHead>
                <TableHead>Beschreibung</TableHead>
                <TableHead>Vergütung</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    {template.logo_path ? (
                      <img
                        src={getLogoUrl(template.logo_path) || ''}
                        alt={template.title}
                        className="h-10 w-10 object-contain rounded"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">-</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{template.title}</TableCell>
                  <TableCell className="max-w-xs truncate">{template.description}</TableCell>
                  <TableCell>{formatCurrency(template.compensation)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(template)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Vorlage bearbeiten' : 'Neue Vorlage erstellen'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="z.B. Bank-Registrierung"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detaillierte Beschreibung des Auftrags..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="compensation">Vergütung (EUR)</Label>
              <Input
                id="compensation"
                type="number"
                step="0.01"
                min="0"
                value={formData.compensation}
                onChange={(e) => setFormData({ ...formData, compensation: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label>Auftraggeber-Logo</Label>
              <div className="flex items-center gap-4">
                {(formData.logo_path || selectedFile) && (
                  <div className="relative">
                    <img
                      src={selectedFile ? URL.createObjectURL(selectedFile) : getLogoUrl(formData.logo_path) || ''}
                      alt="Logo Preview"
                      className="h-16 w-16 object-contain rounded border"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-5 w-5"
                      onClick={() => {
                        setFormData({ ...formData, logo_path: null });
                        setSelectedFile(null);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Label htmlFor="logo-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent">
                      <Upload className="h-4 w-4" />
                      Logo hochladen
                    </div>
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit} disabled={uploading}>
              {uploading ? 'Wird hochgeladen...' : editingTemplate ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
