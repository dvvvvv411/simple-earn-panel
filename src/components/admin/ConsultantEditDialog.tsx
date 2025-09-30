import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Consultant {
  id: string;
  name: string;
  phone: string;
  image_path: string | null;
  is_default: boolean;
}

interface ConsultantEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  consultant: Consultant | null;
}

export const ConsultantEditDialog: React.FC<ConsultantEditDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  consultant,
}) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState<File | null>(null);

  useEffect(() => {
    if (consultant) {
      setName(consultant.name);
      setPhone(consultant.phone);
    }
  }, [consultant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultant) return;
    setLoading(true);

    try {
      let imagePath = consultant.image_path;

      // Upload new image if provided
      if (image) {
        const fileExt = image.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("consultant-images")
          .upload(fileName, image);

        if (uploadError) throw uploadError;
        imagePath = fileName;

        // Delete old image if exists
        if (consultant.image_path) {
          await supabase.storage
            .from("consultant-images")
            .remove([consultant.image_path]);
        }
      }

      // Update consultant
      const { error } = await supabase
        .from("consultants")
        .update({
          name,
          phone,
          image_path: imagePath,
        })
        .eq("id", consultant.id);

      if (error) throw error;

      toast.success("Berater erfolgreich aktualisiert");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Fehler beim Aktualisieren: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Berater bearbeiten</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Fabian Schmidt"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefonnummer</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0800 123123"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Neues Profilbild (optional)</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
            />
            {consultant?.image_path && !image && (
              <p className="text-sm text-muted-foreground">
                Aktuelles Bild wird beibehalten
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Speichern
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
