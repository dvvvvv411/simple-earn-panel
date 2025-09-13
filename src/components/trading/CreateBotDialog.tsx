import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, TrendingUp, Euro } from "lucide-react";
import { useCoinMarketCap } from "@/contexts/CoinMarketCapContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CreateBotDialogProps {
  userBalance: number;
  onBotCreated: () => void;
}

export function CreateBotDialog({ userBalance, onBotCreated }: CreateBotDialogProps) {
  const [open, setOpen] = useState(false);
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

      // Create the bot
      const { data: bot, error: botError } = await supabase
        .from('trading_bots')
        .insert({
          user_id: user.id,
          cryptocurrency: selectedCoin.name,
          symbol: selectedCoin.symbol.toUpperCase(),
          start_amount: investmentAmount,
          current_balance: investmentAmount,
          status: 'active'
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

      // Start the trading simulation
      console.log('🤖 Starting trading simulation for bot:', bot.id);
      console.log('📊 Current price:', selectedCoin.current_price);
      
      const { data: functionResponse, error: functionError } = await supabase.functions.invoke('trading-bot-simulator', {
        body: { 
          bot_id: bot.id,
          current_price: selectedCoin.current_price 
        }
      });

      console.log('🔄 Function response:', functionResponse);
      console.log('❌ Function error:', functionError);

      if (functionError) {
        console.error('Function invocation error details:', {
          message: functionError.message,
          details: functionError.details,
          hint: functionError.hint,
          code: functionError.code
        });
        toast({
          title: "Warnung",
          description: `Bot wurde erstellt, aber Trading-Simulation konnte nicht gestartet werden: ${functionError.message}`,
          variant: "destructive"
        });
      } else {
        console.log('✅ Trading simulation started successfully');
      }

      toast({
        title: "Bot erstellt!",
        description: `Trading-Bot für ${selectedCoin.name} wurde erfolgreich gestartet.`,
      });

      setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="sm">
          <Bot className="w-4 h-4 mr-2" />
          Bot erstellen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            Neuen Trading-Bot erstellen
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cryptocurrency">Kryptowährung auswählen</Label>
            <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
              <SelectTrigger>
                <SelectValue placeholder="Kryptowährung wählen..." />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <SelectItem value="loading" disabled>
                    Lade Daten...
                  </SelectItem>
                ) : (
                  coins.map((coin) => (
                    <SelectItem key={coin.id} value={coin.id}>
                      <div className="flex items-center gap-2">
                        <img src={coin.image} alt={coin.name} className="w-4 h-4" />
                        <span>{coin.name}</span>
                        <span className="text-muted-foreground">({coin.symbol.toUpperCase()})</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedCoin && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={selectedCoin.image} alt={selectedCoin.name} className="w-6 h-6" />
                    <div>
                      <p className="font-medium">{selectedCoin.name}</p>
                      <p className="text-sm text-muted-foreground">Aktueller Preis</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{selectedCoin.current_price.toLocaleString('de-DE', { 
                      style: 'currency', 
                      currency: 'EUR' 
                    })}</p>
                    <div className={`flex items-center gap-1 text-sm ${
                      selectedCoin.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <TrendingUp className="w-3 h-3" />
                      {selectedCoin.price_change_percentage_24h.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Startbetrag (EUR)</Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
                min="0"
                max={userBalance}
                step="0.01"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Verfügbares Guthaben: {userBalance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleCreateBot}
              disabled={isCreating || !selectedCrypto || !amount}
              className="flex-1"
            >
              {isCreating ? "Erstelle..." : "Bot starten"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}