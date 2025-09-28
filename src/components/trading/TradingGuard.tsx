import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useLoginStats } from "@/hooks/useLoginStats";

interface TradingGuardProps {
  children: React.ReactNode;
}

export function TradingGuard({ children }: TradingGuardProps) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { trackLogin } = useLoginStats();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/auth');
          return;
        }

        setIsAuthenticated(true);
        
        // Track login in background
        setTimeout(() => {
          trackLogin();
        }, 0);
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Lade Trading-Dashboard...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
}