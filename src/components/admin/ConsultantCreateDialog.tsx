import React, { useState } from "react";
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

interface ConsultantCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ConsultantCreateDialog: React.FC<ConsultantCreateDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imagePath = null;

      // Upload image if provided
      if (image) {
        const fileExt = image.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("consultant-images")
          .upload(fileName, image);

        if (uploadError) throw uploadError;
        imagePath = fileName;
      }

      // Create consultant
      const { error } = await supabase.from("consultants").insert({
        name,
        phone,
        image_path: imagePath,
        is_default: false,
      });

      if (error) throw error;

      toast.success("Berater erfolgreich erstellt");
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast.error("Fehler beim Erstellen: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setImage(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neuen Berater hinzufügen</DialogTitle>
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
            <Label htmlFor="image">Profilbild (optional)</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
            />
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
              Erstellen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
