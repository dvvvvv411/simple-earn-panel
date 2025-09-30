import React, { useState, useEffect } from "react";
import { ConsultantList } from "@/components/admin/ConsultantList";
import { ConsultantCreateDialog } from "@/components/admin/ConsultantCreateDialog";
import { ConsultantEditDialog } from "@/components/admin/ConsultantEditDialog";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface Consultant {
  id: string;
  name: string;
  phone: string;
  image_path: string | null;
  is_default: boolean;
}

const Consultants: React.FC = () => {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);

  useEffect(() => {
    fetchConsultants();
  }, []);

  const fetchConsultants = async () => {
    try {
      const { data, error } = await supabase
        .from("consultants")
        .select("*")
        .order("is_default", { ascending: false })
        .order("name", { ascending: true });

      if (error) throw error;
      setConsultants(data || []);
    } catch (error) {
      console.error("Error fetching consultants:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (consultant: Consultant) => {
    setSelectedConsultant(consultant);
    setEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConsultantList
        consultants={consultants}
        onEdit={handleEdit}
        onRefresh={fetchConsultants}
        onCreateClick={() => setCreateDialogOpen(true)}
      />

      <ConsultantCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchConsultants}
      />

      <ConsultantEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchConsultants}
        consultant={selectedConsultant}
      />
    </div>
  );
};

export default Consultants;
