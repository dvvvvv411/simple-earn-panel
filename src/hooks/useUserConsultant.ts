import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Consultant {
  id: string;
  name: string;
  phone: string;
  image_path: string | null;
  is_default: boolean;
}

export function useUserConsultant() {
  const [consultant, setConsultant] = useState<Consultant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConsultant();
  }, []);

  const loadConsultant = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get user's profile with consultant
      const { data: profile } = await supabase
        .from('profiles')
        .select('consultant_id')
        .eq('id', session.user.id)
        .single();

      if (profile?.consultant_id) {
        // Get assigned consultant
        const { data: consultantData } = await supabase
          .from('consultants')
          .select('*')
          .eq('id', profile.consultant_id)
          .single();
        
        if (consultantData) {
          setConsultant(consultantData);
        }
      } else {
        // Get default consultant
        const { data: defaultConsultant } = await supabase
          .from('consultants')
          .select('*')
          .eq('is_default', true)
          .single();
        
        if (defaultConsultant) {
          setConsultant(defaultConsultant);
          
          // Automatically assign default consultant to user
          await supabase
            .from('profiles')
            .update({ consultant_id: defaultConsultant.id })
            .eq('id', session.user.id);
        }
      }
    } catch (error) {
      console.error('Error loading consultant:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return null;
    const { data } = supabase.storage
      .from('consultant-images')
      .getPublicUrl(imagePath);
    return data.publicUrl;
  };

  return {
    consultant,
    loading,
    getImageUrl,
  };
}
