import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Bot, TrendingUp, Euro, Sparkles, Shield, Clock, Zap, Bitcoin, ArrowRight, AlertTriangle, Crown } from "lucide-react";
import { useCoinMarketCap } from "@/contexts/CoinMarketCapContext";
import { useToast } from "@/hooks/use-toast";
import { useDailyTradeLimit } from "@/hooks/useDailyTradeLimit";
import { supabase } from "@/integrations/supabase/client";

interface CreateBotFormProps {
  userBalance: number;
  onBotCreated: () => void;
}

export function CreateBotForm({ userBalance, onBotCreated }: CreateBotFormProps) {
  const [selectedCrypto, setSelectedCrypto] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const { coins, loading } = useCoinMarketCap();
  const { toast } = useToast();
  const { dailyLimit, usedToday, canCreateBot, remainingTrades, rankName, loading: limitLoading } = useDailyTradeLimit();

  const selectedCoin = coins.find(coin => coin.id === selectedCrypto);

  const handleCreateBot = async () => {
    if (!canCreateBot) {
      toast({
        title: "Tägliches Limit erreicht",
        description: `Sie haben Ihr tägliches Trading-Limit von ${dailyLimit} Bots erreicht.`,
        variant: "destructive"
      });
      return;
    }

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
      const now = new Date();
      const randomMinutes = Math.floor(Math.random() * 31) + 30;
      const expectedCompletionTime = new Date(now.getTime() + randomMinutes * 60 * 1000);

      const { data: botId, error } = await supabase.rpc('create_trading_bot_atomic', {
        p_cryptocurrency: selectedCoin.name,
        p_symbol: selectedCoin.symbol.toUpperCase(),
        p_start_amount: investmentAmount,
        p_expected_completion_time: expectedCompletionTime.toISOString()
      });

      if (error) {
        console.error('Atomic bot creation error:', error);
        
        let errorMessage = "Bot konnte nicht erstellt werden.";
        if (error.message.includes('Unzureichendes Guthaben')) {
          errorMessage = "Unzureichendes Guthaben für diese Investition.";
        } else if (error.message.includes('Nicht authentifiziert')) {
          errorMessage = "Sie müssen eingeloggt sein, um einen Bot zu erstellen.";
        }
        
        toast({
          title: "Fehler",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      console.log('🤖 Trading bot created successfully (atomic):', botId);

      toast({
        title: "Bot erstellt!",
        description: `Trading-Bot für ${selectedCoin.name} wurde erfolgreich gestartet.`,
      });

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
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5" />
      <CardHeader className="relative">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-xl bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Neuen Trading-Bot erstellen
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              KI-gestützter automatisierter Handel
            </p>
          </div>
        </div>
        
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
      </CardHeader>
      
      <CardContent className="relative">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="cryptocurrency" className="text-base font-medium">
                Kryptowährung auswählen
              </Label>
              <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                <SelectTrigger className="h-12">
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
                    coins
                      .filter(coin => !['usdt', 'usdc', 'dai', 'busd'].includes(coin.symbol.toLowerCase()))
                      .map((coin) => (
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

              <div className="relative">
                <Euro className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-12 h-12"
                  min="0"
                  max={userBalance}
                  step="0.01"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 75, 100].map((percentage) => (
                  <Button
                    key={percentage}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(((userBalance * percentage) / 100).toFixed(2))}
                  >
                    {percentage}%
                  </Button>
                ))}
              </div>

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

              {!limitLoading && (
                <div className={`p-3 rounded-lg border ${
                  canCreateBot 
                    ? 'bg-muted/50 border-border' 
                    : 'bg-destructive/10 border-destructive/30'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>Tägliches Trading-Limit</span>
                    </div>
                    {rankName && (
                      <Badge variant="outline" className="text-xs">
                        <Crown className="w-3 h-3 mr-1" />
                        {rankName}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Trades heute</span>
                      <span className={canCreateBot ? 'text-foreground' : 'text-destructive font-semibold'}>
                        {usedToday} / {dailyLimit}
                      </span>
                    </div>
                    <Progress 
                      value={dailyLimit > 0 ? (usedToday / dailyLimit) * 100 : 100} 
                      className="h-2"
                    />
                    {!canCreateBot && (
                      <div className="flex items-start gap-2 mt-2 p-2 rounded bg-destructive/5">
                        <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                        <div className="text-xs text-destructive">
                          <p className="font-medium">Limit erreicht</p>
                          <p className="text-destructive/80">Erhöhen Sie Ihren Rang für mehr tägliche Trades.</p>
                        </div>
                      </div>
                    )}
                    {canCreateBot && remainingTrades > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Noch {remainingTrades} {remainingTrades === 1 ? 'Trade' : 'Trades'} heute verfügbar
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Preview & Info */}
          <div className="space-y-6">
            {!selectedCoin && (
              <Card className="relative overflow-hidden border-dashed border-2 border-primary/30">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 animate-pulse" />
                <CardContent className="relative p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center animate-pulse">
                        <div className="animate-spin">
                          <Bitcoin className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-bounce" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="animate-bounce">
                      <ArrowRight className="w-4 h-4 text-primary rotate-180" />
                    </div>
                    <div className="text-sm font-medium text-primary">
                      Dropdown auswählen
                    </div>
                  </div>
                  
                  <h3 className="text-base font-semibold text-foreground">
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
                      <img src={selectedCoin.image} alt={selectedCoin.name} className="w-14 h-14 rounded-full shadow-lg" />
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
                        <span className="text-2xl font-bold">
                          {selectedCoin.current_price.toLocaleString('de-DE', { 
                            style: 'currency', 
                            currency: 'EUR',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                        
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

            <Button
              onClick={handleCreateBot}
              disabled={isCreating || !selectedCrypto || !amount || !canCreateBot}
              className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg transition-all duration-300"
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
        </div>
      </CardContent>
    </Card>
  );
}
