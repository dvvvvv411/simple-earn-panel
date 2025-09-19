import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Users, Gift, Share2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  activeReferrals: number;
  bonusEarned: number;
  pendingBonus: number;
}

interface ReferralSystemCardProps {
  className?: string;
}

export function ReferralSystemCard({ className }: ReferralSystemCardProps) {
  const [referralData, setReferralData] = useState<ReferralData>({
    referralCode: '',
    totalReferrals: 0,
    activeReferrals: 0,
    bonusEarned: 0,
    pendingBonus: 0,
  });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Generate referral code based on user ID (first 8 characters)
      const referralCode = session.user.id.replace(/-/g, '').substring(0, 8).toUpperCase();
      
      // Mock data for now - in real app, fetch from referrals table
      setReferralData({
        referralCode,
        totalReferrals: 3,
        activeReferrals: 2,
        bonusEarned: 150.00,
        pendingBonus: 50.00,
      });
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(referralData.referralCode);
      setCopied(true);
      toast.success('Referral-Code kopiert!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Fehler beim Kopieren');
    }
  };

  const shareReferral = (platform: 'whatsapp' | 'email' | 'link') => {
    const baseUrl = window.location.origin;
    const referralUrl = `${baseUrl}/auth?ref=${referralData.referralCode}`;
    const message = `Tritt unserem Krypto-Trading-Programm bei und erhalte einen Bonus! Nutze meinen Referral-Code: ${referralData.referralCode}`;

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

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 flex-1" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} border-primary/20`}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-text-headline flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Empfehlungs-System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Referral Code */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-2">Ihr Referral-Code</div>
          <div className="flex items-center gap-2">
            <code className="bg-background px-3 py-2 rounded font-mono text-lg font-semibold text-primary border">
              {referralData.referralCode}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={copyReferralCode}
              className="shrink-0"
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <div className="text-2xl font-bold text-foreground">
              {referralData.totalReferrals}
            </div>
            <div className="text-xs text-muted-foreground">
              Eingeladene Freunde
            </div>
            <Badge variant="secondary" className="mt-1 text-xs">
              {referralData.activeReferrals} aktiv
            </Badge>
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/10">
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(referralData.bonusEarned)}
            </div>
            <div className="text-xs text-muted-foreground">
              Verdiente Boni
            </div>
            {referralData.pendingBonus > 0 && (
              <Badge className="mt-1 text-xs bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                +{formatCurrency(referralData.pendingBonus)} ausstehend
              </Badge>
            )}
          </div>
        </div>

        {/* Share Options */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-foreground">Freunde einladen</div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => shareReferral('whatsapp')}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => shareReferral('email')}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              E-Mail
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => shareReferral('link')}
            className="w-full"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Link teilen
          </Button>
        </div>

        {/* Bonus Info */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">Belohnungen</span>
          </div>
          <div className="text-xs text-yellow-700 space-y-1">
            <div>• €25 für jeden Freund der sich registriert</div>
            <div>• €25 zusätzlich wenn er aktiv handelt</div>
            <div>• Bei 5 Freunden: €50 Bonus</div>
            <div>• Bei 10 Freunden: €100 Bonus</div>
          </div>
        </div>

        {/* Next Reward */}
        {referralData.totalReferrals < 5 && (
          <div className="text-center text-sm text-muted-foreground">
            Noch {5 - referralData.totalReferrals} Freunde bis zum nächsten Bonus (€50)
          </div>
        )}
      </CardContent>
    </Card>
  );
}