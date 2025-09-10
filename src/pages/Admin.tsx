import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Admin = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/auth");
          return;
        }

        setUser(session.user);

        // Check if user has admin role
        const { data: userRoles, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);

        if (error) {
          console.error("Error fetching user role:", error);
          toast({
            title: "Fehler",
            description: "Berechtigung konnte nicht überprüft werden.",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        const isAdmin = userRoles?.some(role => role.role === "admin");
        if (!isAdmin) {
          toast({
            title: "Zugriff verweigert",
            description: "Sie haben keine Berechtigung für den Adminbereich.",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error("Error checking admin access:", error);
        navigate("/auth");
      }
    };

    checkAdminAccess();
  }, [navigate]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Fehler",
        description: "Abmeldung fehlgeschlagen.",
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Berechtigung wird überprüft...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Panel Admin</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Willkommen, {user?.email}
            </span>
            <Button variant="outline" onClick={handleLogout}>
              Abmelden
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-text-headline mb-2">Adminbereich</h2>
              <p className="text-text-hero">
                Willkommen im Administrationsbereich. Hier können Sie das Panel verwalten und konfigurieren.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-2">Benutzerverwaltung</h3>
                <p className="text-muted-foreground mb-4">
                  Verwalten Sie Benutzer und deren Berechtigungen.
                </p>
                <Button disabled variant="outline" className="w-full">
                  Bald verfügbar
                </Button>
              </div>

              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-2">Systemstatistiken</h3>
                <p className="text-muted-foreground mb-4">
                  Überblick über Systemleistung und Nutzung.
                </p>
                <Button disabled variant="outline" className="w-full">
                  Bald verfügbar
                </Button>
              </div>

              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-2">Konfiguration</h3>
                <p className="text-muted-foreground mb-4">
                  Systemeinstellungen und Konfiguration.
                </p>
                <Button disabled variant="outline" className="w-full">
                  Bald verfügbar
                </Button>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Entwicklungshinweis</h3>
              <p className="text-muted-foreground">
                Diese Seite befindet sich noch in der Entwicklung. Weitere Funktionen werden in Kürze hinzugefügt.
                Sie können diese Seite nach Ihren Anforderungen erweitern.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;