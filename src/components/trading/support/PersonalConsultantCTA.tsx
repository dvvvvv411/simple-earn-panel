import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Clock, CheckCircle, Award } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserConsultant } from "@/hooks/useUserConsultant";
import { Skeleton } from "@/components/ui/skeleton";
import consultantImage from "@/assets/consultant-profile.jpg";

export const PersonalConsultantCTA: React.FC = () => {
  const isMobile = useIsMobile();
  const { consultant, loading, getImageUrl } = useUserConsultant();
  
  const handleCallClick = () => {
    if (consultant?.phone) {
      window.open(`tel:${consultant.phone.replace(/\s/g, "")}`, "_self");
    }
  };

  if (loading) {
    return (
      <Card className="relative overflow-hidden rounded-3xl border-4 border-primary/30 bg-background/40 backdrop-blur-xl">
        <CardContent className={`relative ${isMobile ? 'p-4' : 'p-8'}`}>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const consultantName = consultant?.name || "Fabian Schmidt";
  const consultantPhone = consultant?.phone || "0800 123123";
  const consultantImageUrl = consultant?.image_path 
    ? getImageUrl(consultant.image_path) 
    : consultantImage;

  return (
    <Card className="relative overflow-hidden rounded-3xl border-4 border-primary/30 bg-background/40 backdrop-blur-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <CardContent className={`relative ${isMobile ? 'p-4' : 'p-8'}`}>
        <div className={isMobile ? "space-y-6" : "flex items-center justify-between"}>
          <div className={`space-y-4 ${isMobile ? '' : 'flex-1 pr-6'}`}>
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/20">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className={`font-bold text-foreground ${isMobile ? 'text-xl' : 'text-2xl'}`}>Persönlicher Berater</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-green-600 font-medium">Jetzt verfügbar</span>
                </div>
              </div>
            </div>
            
            <p className={`text-muted-foreground leading-relaxed ${isMobile ? 'text-base max-w-none' : 'text-lg max-w-md'}`}>
              Sprechen Sie direkt mit Ihrem persönlichen Trading-Berater. 
              Erhalten Sie professionelle Beratung zu Ihren Investments und Strategien.
            </p>
            
            <div className={`${isMobile ? 'flex-col space-y-3' : 'flex items-center space-x-6'} text-muted-foreground`}>
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
          
          <div className={`flex ${isMobile ? 'flex-row items-center justify-between' : 'flex-col items-center space-y-4'}`}>
            <div className="relative">
              <img 
                src={consultantImageUrl || consultantImage} 
                alt="Persönlicher Trading-Berater" 
                className={`rounded-full object-cover border-4 border-primary/20 ${isMobile ? 'w-16 h-16' : 'w-24 h-24'}`}
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-background" />
            </div>
            
            <div className={`${isMobile ? 'flex-1 ml-4' : 'text-center'} space-y-2`}>
              <p className={`font-semibold text-foreground ${isMobile ? 'text-base' : 'text-lg'}`}>
                {consultantName}
              </p>
              <div 
                onClick={handleCallClick}
                className="cursor-pointer group"
              >
                <div className={`flex items-center ${isMobile ? 'justify-start' : 'justify-center'} space-x-2 bg-primary/10 border-2 border-primary/30 rounded-2xl ${isMobile ? 'px-4 py-2' : 'px-6 py-3'} hover:bg-primary/20 transition-colors`}>
                  <Phone className="h-5 w-5 text-primary" />
                  <span className={`text-primary font-bold ${isMobile ? 'text-base' : 'text-lg'}`}>{consultantPhone}</span>
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