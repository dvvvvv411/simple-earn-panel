import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function UsersPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Benutzer</h2>
        <p className="text-muted-foreground">
          Benutzerverwaltung und Rollenzuweisungen.
        </p>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Users className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Benutzerverwaltung</h3>
          <p className="text-muted-foreground text-center">
            Diese Funktion wird in einer zukünftigen Version verfügbar sein.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}