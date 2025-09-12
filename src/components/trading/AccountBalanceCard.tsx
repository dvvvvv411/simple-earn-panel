import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function AccountBalanceCard() {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setBalance(profile.balance);
      }
    } catch (error) {
      console.error('Error loading balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Placeholder trend data
  const trendPercentage = 2.3;
  const isPositive = trendPercentage > 0;

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            Kontostand
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-40 mb-4" />
          <Skeleton className="h-5 w-28" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          Kontostand
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="text-4xl font-bold text-foreground">
            {balance !== null ? formatBalance(balance) : '€0.00'}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" style={{ color: 'hsl(var(--brand-accent, var(--primary)))' }} />
              <span className="font-semibold" style={{ color: 'hsl(var(--brand-accent, var(--primary)))' }}>
                {isPositive ? '+' : ''}{trendPercentage}%
              </span>
            </div>
            <span className="text-muted-foreground">heute</span>
          </div>
        </div>
        
        <div className="pt-4 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Verfügbares Guthaben</span>
            <span className="font-semibold text-foreground text-lg">
              {balance !== null ? formatBalance(balance * 0.95) : '€0.00'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}