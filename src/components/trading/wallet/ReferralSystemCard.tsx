import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Users, Gift, Share2, CheckCircle, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { useReferralData } from "@/hooks/useReferralData";

interface ReferralSystemCardProps {
  className?: string;
}

export function ReferralSystemCard({ className }: ReferralSystemCardProps) {
  const { data: referralData, loading, error } = useReferralData();
  const [copied, setCopied] = useState(false);
  const isMobile = useIsMobile();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(referralData.code);
      setCopied(true);
      toast.success('Referral-Code kopiert!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Fehler beim Kopieren');
    }
  };

  const shareReferral = (platform: 'whatsapp' | 'email' | 'link') => {
    const baseUrl = window.location.origin;
    const referralUrl = `${baseUrl}/auth?ref=${referralData.code}`;
    const message = `Tritt unserem Krypto-Trading-Programm bei und erhalte einen Bonus! Nutze meinen Referral-Code: ${referralData.code}`;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(message + ' ' + referralUrl)}`);
        break;
      case 'email':
        window.open(`mailto:?subject=Krypto-Trading Einladung&body=${encodeURIComponent(message + '\n\n' + referralUrl)}`);
        break;
      case 'link':
        copyReferralCode();
        break;
    }
  };

  if (error) {
    return (
      <Card className={className}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-text-headline flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Empfehlungs-System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Fehler beim Laden der Referral-Daten
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} border-primary/20 bg-card`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-text-headline flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Empfehlungs-System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Referral Code Section */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 sm:p-6 border border-primary/20">
          <div className="text-center space-y-3">
            <div className="text-sm text-muted-foreground">Referral-Code</div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <code className="bg-background px-4 py-3 rounded-md font-mono text-xl sm:text-2xl lg:text-3xl font-bold text-primary border border-primary/20 break-all min-w-0 tracking-wider">
                {referralData.code}
              </code>
              <Button
                variant="ghost"
                size={isMobile ? "mobile" : "sm"}
                onClick={copyReferralCode}
                className={`${isMobile ? "h-12 w-12" : "h-9 w-9"} p-0 hover:bg-primary/10 shrink-0`}
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4 text-primary" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="text-center p-3 sm:p-4 rounded-lg bg-muted/50 border">
            <div className="text-xl sm:text-2xl font-bold text-foreground mb-1">{referralData.totalReferrals}</div>
            <div className="text-sm text-muted-foreground">Geworbene Freunde</div>
          </div>
          <div className="text-center p-3 sm:p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="text-xl sm:text-2xl font-bold text-primary mb-1">{formatCurrency(referralData.bonusEarned)}</div>
            <div className="text-sm text-primary/70">Verdient</div>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={() => shareReferral('link')}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          size={isMobile ? "mobile" : "lg"}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Code teilen
        </Button>

        {/* Compact Reward Info with Tooltip */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Gift className="h-4 w-4" />
          <span className="font-medium">€50 pro erfolgreich geworbenen Freund</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-64">
                Der geworbene Freund muss Rang "Starter" erreichen, um den Verdienst freizuschalten
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}