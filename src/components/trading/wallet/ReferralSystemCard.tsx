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
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
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
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-text-headline flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Empfehlungs-System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Referral Code - Compact */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-3">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Referral-Code</div>
            <div className="flex items-center justify-center gap-2">
              <code className="bg-background px-2 py-1 rounded font-mono text-sm font-bold text-primary">
                {referralData.referralCode}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyReferralCode}
                className="h-8 w-8 p-0"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Compact Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-secondary/30">
            <div className="text-lg font-bold text-foreground">{referralData.totalReferrals}</div>
            <div className="text-xs text-muted-foreground">Freunde</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-green-50">
            <div className="text-lg font-bold text-green-600">{referralData.activeReferrals}</div>
            <div className="text-xs text-green-700">Aktiv</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-primary/10">
            <div className="text-lg font-bold text-primary">{formatCurrency(referralData.bonusEarned)}</div>
            <div className="text-xs text-primary/70">Verdient</div>
          </div>
        </div>

        {/* Pending Bonus - If exists */}
        {referralData.pendingBonus > 0 && (
          <div className="bg-yellow-50 rounded-lg p-2 text-center">
            <div className="text-sm font-medium text-yellow-800">
              {formatCurrency(referralData.pendingBonus)} ausstehend
            </div>
          </div>
        )}

        {/* Single Share Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => shareReferral('link')}
          className="w-full"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Code teilen
        </Button>

        {/* Compact Reward Info */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Gift className="h-4 w-4 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-800">€25 pro Freund</span>
            </div>
            {referralData.totalReferrals < 5 && (
              <span className="text-xs text-muted-foreground">
                {5 - referralData.totalReferrals} bis €50 Bonus
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}