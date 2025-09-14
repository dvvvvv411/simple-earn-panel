import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, TrendingUp, Euro, Sparkles, Shield, Clock, Zap, Bitcoin, ArrowRight } from "lucide-react";
import { useCoinMarketCap } from "@/contexts/CoinMarketCapContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CreateBotDialogProps {
  userBalance: number;
  onBotCreated: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateBotDialog({ userBalance, onBotCreated, open, onOpenChange }: CreateBotDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Use controlled state if provided, otherwise use internal state
  const dialogOpen = open !== undefined ? open : isOpen;
  const setDialogOpen = onOpenChange || setIsOpen;
  const [selectedCrypto, setSelectedCrypto] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const { coins, loading } = useCoinMarketCap();
  const { toast } = useToast();

  const selectedCoin = coins.find(coin => coin.id === selectedCrypto);

  const handleCreateBot = async () => {
    if (!selectedCrypto || !amount || !selectedCoin) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie eine Kryptowährung und geben Sie einen Betrag ein.",
        variant: "destructive"
      });
      return;
    }

    const investmentAmount = parseFloat(amount);
    if (investmentAmount <= 0 || investmentAmount > userBalance) {
      toast({
        title: "Ungültiger Betrag",
        description: `Der Betrag muss zwischen 0 und ${userBalance.toFixed(2)} € liegen.`,
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Fehler",
          description: "Sie müssen eingeloggt sein, um einen Bot zu erstellen.",
          variant: "destructive"
        });
        return;
      }

      // Calculate completion time (30-60 minutes from now)
      const now = new Date();
      const randomMinutes = Math.floor(Math.random() * 31) + 30; // 30-60 minutes
      const expectedCompletionTime = new Date(now.getTime() + randomMinutes * 60 * 1000);

      // Create the bot
      const { data: bot, error: botError } = await supabase
        .from('trading_bots')
        .insert({
          user_id: user.id,
          cryptocurrency: selectedCoin.name,
          symbol: selectedCoin.symbol.toUpperCase(),
          start_amount: investmentAmount,
          current_balance: investmentAmount,
          status: 'active',
          expected_completion_time: expectedCompletionTime.toISOString()
        })
        .select()
        .single();

      if (botError) {
        console.error('Bot creation error:', botError);
        toast({
          title: "Fehler",
          description: "Bot konnte nicht erstellt werden.",
          variant: "destructive"
        });
        return;
      }

      // Deduct amount from user balance
      const { error: balanceError } = await supabase.rpc('update_user_balance', {
        target_user_id: user.id,
        amount_change: -investmentAmount,
        transaction_type: 'debit',
        transaction_description: `Trading-Bot Erstellung: ${selectedCoin.name}`,
        admin_user_id: user.id
      });

      if (balanceError) {
        console.error('Balance update error:', balanceError);
        // If balance update fails, we should delete the bot
        await supabase.from('trading_bots').delete().eq('id', bot.id);
        toast({
          title: "Fehler",
          description: "Guthaben konnte nicht aktualisiert werden.",
          variant: "destructive"
        });
        return;
      }

      // Log bot creation success
      console.log('🤖 Trading bot created successfully:', bot.id);
      console.log('⏰ Expected completion time:', expectedCompletionTime.toISOString());
      console.log('📊 Current price:', selectedCoin.current_price);

      toast({
        title: "Bot erstellt!",
        description: `Trading-Bot für ${selectedCoin.name} wurde erfolgreich gestartet.`,
      });

      setDialogOpen(false);
      setSelectedCrypto("");
      setAmount("");
      onBotCreated();

    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {/* Only show trigger if not controlled externally */}
      {open === undefined && (
        <DialogTrigger asChild>
          <Button className="w-full" size="sm">
            <Bot className="w-4 h-4 mr-2" />
            Bot erstellen
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 animate-pulse" />
          <div className="relative">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Neuen Trading-Bot erstellen
                </span>
                <p className="text-sm font-normal text-muted-foreground mt-1">
                  KI-gestützter automatisierter Handel
                </p>
              </div>
            </DialogTitle>
            
            {/* Trust Badges */}
            <div className="flex gap-2 mt-4">
              <Badge variant="secondary" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Sicher
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                24/7 Trading
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                KI-gestützt
              </Badge>
            </div>
          </div>
        </DialogHeader>
        
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          {/* Left Column - Form */}
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="cryptocurrency" className="text-base font-medium">
                Kryptowährung auswählen
              </Label>
              <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Wählen Sie eine Kryptowährung..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {loading ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-muted animate-pulse" />
                        <span>Lade Daten...</span>
                      </div>
                    </SelectItem>
                  ) : (
                    coins.map((coin) => (
                       <SelectItem key={coin.id} value={coin.id}>
                            <div className="flex items-center gap-3">
                              <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{coin.name}</span>
                                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                    {coin.symbol.toUpperCase()}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Rang #{coin.market_cap_rank}
                                </div>
                              </div>
                            </div>
                       </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label htmlFor="amount" className="text-base font-medium">
                Startbetrag (EUR)
              </Label>
              
              {/* Balance Display */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-muted/50 to-muted/30 border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Verfügbares Guthaben</span>
                  <span className="font-semibold">
                    {userBalance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                    style={{ width: `${Math.min((parseFloat(amount) || 0) / userBalance * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Amount Input */}
              <div className="relative">
                <Euro className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-12 h-12 text-base"
                  min="0"
                  max={userBalance}
                  step="0.01"
                />
              </div>

              {/* Preset Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 75, 100].map((percentage) => (
                  <Button
                    key={percentage}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(((userBalance * percentage) / 100).toFixed(2))}
                    className="text-xs"
                  >
                    {percentage}%
                  </Button>
                ))}
              </div>

              {/* Investment Info */}
              {amount && parseFloat(amount) > 0 && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="font-medium">Geplante Investition:</span>
                    <span className="font-semibold text-primary">
                      {parseFloat(amount).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Preview & Info */}
          <div className="space-y-6">
            {/* Crypto Selection Call-to-Action */}
            {!selectedCoin && (
              <Card className="hidden lg:block relative overflow-hidden border-dashed border-2 border-primary/30">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 animate-pulse" />
                <CardContent className="relative p-3 text-center">
                  <div className="flex justify-center mb-2">
                    <div className="relative">
                      {/* Rotating Crypto Icons */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center animate-pulse">
                        <div className="animate-spin">
                          <Bitcoin className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                      {/* Animated indicators around the icon */}
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary animate-bounce" />
                    </div>
                  </div>
                  
                  {/* Animated Arrow pointing left */}
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <div className="animate-bounce">
                      <ArrowRight className="w-3 h-3 text-primary rotate-180" />
                    </div>
                    <div className="text-xs font-medium text-primary">
                      Dropdown auswählen
                    </div>
                  </div>
                  
                  {/* Call-to-Action Text */}
                  <h3 className="text-sm font-semibold text-foreground">
                    Wählen Sie eine Kryptowährung
                  </h3>
                </CardContent>
              </Card>
            )}
            
            {selectedCoin && (
              <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
                <CardContent className="relative p-6">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <img src={selectedCoin.image} alt={selectedCoin.name} className="w-12 h-12 rounded-full shadow-lg" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border-2 border-border flex items-center justify-center">
                        <div className={`w-2 h-2 rounded-full ${
                          selectedCoin.price_change_percentage_24h >= 0 ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold">{selectedCoin.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          #{selectedCoin.market_cap_rank}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {selectedCoin.symbol.toUpperCase()} • Live-Preis
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold">
                            {selectedCoin.current_price.toLocaleString('de-DE', { 
                              style: 'currency', 
                              currency: 'EUR',
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        </div>
                        
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          selectedCoin.price_change_percentage_24h >= 0 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                            : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          <TrendingUp className={`w-3 h-3 ${
                            selectedCoin.price_change_percentage_24h < 0 ? 'rotate-180' : ''
                          }`} />
                          {selectedCoin.price_change_percentage_24h >= 0 ? '+' : ''}
                          {selectedCoin.price_change_percentage_24h.toFixed(2)}% (24h)
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bot Features */}
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Trading-Bot Features
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm">Automatisierte Kauf-/Verkaufsentscheidungen</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm">Kontinuierliche Marktanalyse</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm">Risikomanagement integriert</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm">Echtzeit-Performance-Tracking</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t">

          <Button
            variant="outline"
            onClick={() => setDialogOpen(false)}
            className="flex-1 h-12"
            disabled={isCreating}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleCreateBot}
            disabled={isCreating || !selectedCrypto || !amount}
            className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-glow transition-all duration-300"
          >
            {isCreating ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Bot wird erstellt...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                <span>Trading-Bot starten</span>
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}