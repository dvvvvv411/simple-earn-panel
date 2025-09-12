import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Branding {
  id: string;
  name: string;
  accent_color: string | null;
  logo_path: string | null;
  domain: string | null;
}

interface BrandingContextType {
  branding: Branding | null;
  loading: boolean;
  logoUrl: string | null;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<Branding | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    loadUserBranding();
  }, []);

  useEffect(() => {
    if (branding?.accent_color) {
      // Set CSS custom property for dynamic accent color
      document.documentElement.style.setProperty('--brand-accent', branding.accent_color);
    }
  }, [branding]);

  const loadUserBranding = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get user profile with branding
      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          branding_id,
          brandings:branding_id (
            id,
            name,
            accent_color,
            logo_path,
            domain
          )
        `)
        .eq('id', session.user.id)
        .single();

      if (profile?.brandings) {
        const brandingData = Array.isArray(profile.brandings) 
          ? profile.brandings[0] 
          : profile.brandings;
        
        setBranding(brandingData);

        // Load logo if exists
        if (brandingData.logo_path) {
          const { data: logoData } = supabase.storage
            .from('branding-logos')
            .getPublicUrl(brandingData.logo_path);
          
          setLogoUrl(logoData.publicUrl);
        }
      }
    } catch (error) {
      console.error('Error loading branding:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BrandingContext.Provider value={{ branding, loading, logoUrl }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}