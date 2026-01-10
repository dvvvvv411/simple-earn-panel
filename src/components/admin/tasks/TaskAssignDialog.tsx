import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  compensation: number;
  logo_path: string | null;
}

interface TaskAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  onSuccess: () => void;
}

export function TaskAssignDialog({ open, onOpenChange, userId, onSuccess }: TaskAssignDialogProps) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    template_id: '',
    contact_email: '',
    contact_phone: '',
    ident_code: '',
    ident_link: '',
    task_password: ''
  });

  useEffect(() => {
    if (open) {
      fetchTemplates();
      resetForm();
    }
  }, [open]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .order('title');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Fehler beim Laden der Vorlagen');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      template_id: '',
      contact_email: '',
      contact_phone: '',
      ident_code: '',
      ident_link: '',
      task_password: ''
    });
  };

  const handleSubmit = async () => {
    if (!userId || !formData.template_id) {
      toast.error('Bitte eine Vorlage auswählen');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('user_tasks')
        .insert({
          user_id: userId,
          template_id: formData.template_id,
          contact_email: formData.contact_email || null,
          contact_phone: formData.contact_phone || null,
          ident_code: formData.ident_code || null,
          ident_link: formData.ident_link || null,
          task_password: formData.task_password || null
        });

      if (error) throw error;

      toast.success('Auftrag wurde zugewiesen');
      onSuccess();
    } catch (error) {
      console.error('Error assigning task:', error);
      toast.error('Fehler beim Zuweisen');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTemplate = templates.find(t => t.id === formData.template_id);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Auftrag zuweisen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Auftragsvorlage *</Label>
            <Select
              value={formData.template_id}
              onValueChange={(value) => setFormData({ ...formData, template_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Vorlage auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.title} ({formatCurrency(template.compensation)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
              <p className="text-sm font-medium mt-2">
                Vergütung: {formatCurrency(selectedTemplate.compensation)}
              </p>
            </div>
          )}

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Optionale Ident-Daten</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="email@beispiel.de"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">Telefonnummer</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="+49..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ident_code">Identcode</Label>
                <Input
                  id="ident_code"
                  value={formData.ident_code}
                  onChange={(e) => setFormData({ ...formData, ident_code: e.target.value })}
                  placeholder="ABC123"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task_password">Passwort</Label>
                <Input
                  id="task_password"
                  value={formData.task_password}
                  onChange={(e) => setFormData({ ...formData, task_password: e.target.value })}
                  placeholder="Passwort"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="ident_link">Identlink</Label>
                <Input
                  id="ident_link"
                  type="url"
                  value={formData.ident_link}
                  onChange={(e) => setFormData({ ...formData, ident_link: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.template_id || submitting}>
            {submitting ? 'Wird zugewiesen...' : 'Zuweisen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
