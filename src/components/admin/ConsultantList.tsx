import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Phone, Edit, Trash2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Consultant {
  id: string;
  name: string;
  phone: string;
  image_path: string | null;
  is_default: boolean;
}

interface ConsultantListProps {
  consultants: Consultant[];
  onEdit: (consultant: Consultant) => void;
  onRefresh: () => void;
  onCreateClick: () => void;
}

export const ConsultantList: React.FC<ConsultantListProps> = ({
  consultants,
  onEdit,
  onRefresh,
  onCreateClick,
}) => {
  const handleDelete = async (id: string) => {
    if (!confirm("Möchten Sie diesen Berater wirklich löschen?")) return;

    try {
      const { error } = await supabase
        .from("consultants")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Berater erfolgreich gelöscht");
      onRefresh();
    } catch (error: any) {
      toast.error("Fehler beim Löschen: " + error.message);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      // Remove default from all consultants
      await supabase
        .from("consultants")
        .update({ is_default: false })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      // Set new default
      const { error } = await supabase
        .from("consultants")
        .update({ is_default: true })
        .eq("id", id);

      if (error) throw error;

      toast.success("Standard-Berater festgelegt");
      onRefresh();
    } catch (error: any) {
      toast.error("Fehler: " + error.message);
    }
  };

  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return null;
    const { data } = supabase.storage
      .from("consultant-images")
      .getPublicUrl(imagePath);
    return data.publicUrl;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Berater</h2>
        <Button onClick={onCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Berater hinzufügen
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {consultants.map((consultant) => (
          <Card key={consultant.id} className="relative">
            {consultant.is_default && (
              <Badge className="absolute top-2 right-2" variant="default">
                <Star className="h-3 w-3 mr-1" />
                Standard
              </Badge>
            )}
            <CardHeader>
              <div className="flex items-center space-x-4">
                {consultant.image_path ? (
                  <img
                    src={getImageUrl(consultant.image_path) || ""}
                    alt={consultant.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">
                      {consultant.name.charAt(0)}
                    </span>
                  </div>
                )}
                <CardTitle>{consultant.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-muted-foreground">
                <Phone className="h-4 w-4 mr-2" />
                <span>{consultant.phone}</span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(consultant)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Bearbeiten
                </Button>
                {!consultant.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetDefault(consultant.id)}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(consultant.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
