import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, Settings } from "lucide-react";

export default function AdminDashboard() {
  const stats = [
    {
      title: "Brandings",
      value: "0",
      description: "Aktive Marken",
      icon: Package,
    },
    {
      title: "Benutzer",
      value: "1",
      description: "Registrierte Nutzer",
      icon: Users,
    },
    {
      title: "Konfiguration",
      value: "Aktiv",
      description: "System Status",
      icon: Settings,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
        <p className="text-muted-foreground">
          Übersicht über Ihr Admin Panel und wichtige Metriken.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Willkommen im Admin Panel</CardTitle>
          <CardDescription>
            Verwalten Sie Ihre Brandings, Benutzer und Systemkonfiguration von hier aus.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border border-border/50 rounded-lg bg-background/50">
              <h3 className="font-semibold text-foreground mb-2">Brandings verwalten</h3>
              <p className="text-sm text-muted-foreground">
                Erstellen und bearbeiten Sie Ihre Marken, laden Sie Logos hoch und konfigurieren Sie E-Mail-Einstellungen.
              </p>
            </div>
            <div className="p-4 border border-border/50 rounded-lg bg-background/50">
              <h3 className="font-semibold text-foreground mb-2">Benutzer verwalten</h3>
              <p className="text-sm text-muted-foreground">
                Verwalten Sie Benutzerrollen und Zugriffsberechtigungen für Ihr System.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}