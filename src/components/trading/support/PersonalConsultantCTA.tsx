import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Clock, User } from "lucide-react";
import { useBranding } from "@/contexts/BrandingContext";

export const PersonalConsultantCTA: React.FC = () => {
  const { branding } = useBranding();
  
  const handleCallClick = () => {
    // You can customize this with actual phone number from branding
    window.open("tel:+49123456789", "_self");
  };

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Persönlicher Berater</h2>
            </div>
            <p className="text-muted-foreground max-w-md">
              Sprechen Sie direkt mit Ihrem persönlichen Trading-Berater. 
              Erhalten Sie professionelle Beratung zu Ihren Investments und Strategien.
            </p>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>Mo-Fr: 9:00-18:00</span>
              </div>
              <div className="flex items-center space-x-1">
                <Phone className="h-4 w-4" />
                <span>Sofortige Verbindung</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-3">
            <Button 
              onClick={handleCallClick}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8"
            >
              <Phone className="h-4 w-4 mr-2" />
              Jetzt anrufen
            </Button>
            <span className="text-xs text-muted-foreground">
              Kostenlose Beratung
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};