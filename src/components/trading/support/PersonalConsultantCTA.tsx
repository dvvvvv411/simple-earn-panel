import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Clock, CheckCircle, Award } from "lucide-react";
import { useBranding } from "@/contexts/BrandingContext";
import consultantImage from "@/assets/consultant-profile.jpg";

export const PersonalConsultantCTA: React.FC = () => {
  const { branding } = useBranding();
  
  const handleCallClick = () => {
    window.open("tel:0800123123", "_self");
  };

  return (
    <Card className="relative overflow-hidden rounded-3xl border-4 border-primary/30 bg-background/40 backdrop-blur-xl shadow-2xl hover:shadow-primary/20 hover:shadow-3xl transition-all duration-500">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <CardContent className="relative p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-4 flex-1 pr-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/20">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Persönlicher Berater</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-green-600 font-medium">Jetzt verfügbar</span>
                </div>
              </div>
            </div>
            
            <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
              Sprechen Sie direkt mit Ihrem persönlichen Trading-Berater. 
              Erhalten Sie professionelle Beratung zu Ihren Investments und Strategien.
            </p>
            
            <div className="flex items-center space-x-6 text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-medium">Mo-Fr: 9:00-18:00</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">Kostenlose Beratung</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <img 
                src={consultantImage} 
                alt="Persönlicher Trading-Berater" 
                className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-background shadow-md" />
            </div>
            
            <div className="text-center space-y-2">
              <div 
                onClick={handleCallClick}
                className="cursor-pointer group"
              >
                <div className="flex items-center justify-center space-x-2 px-6 py-3 bg-primary/10 hover:bg-primary/20 border-2 border-primary/30 rounded-2xl transition-all duration-300 group-hover:scale-105">
                  <Phone className="h-5 w-5 text-primary" />
                  <span className="text-primary font-bold text-lg">0800 123123</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Direkte Hotline
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};