import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Euro,
  Calculator,
  Loader2,
  CheckCircle,
  Info,
  Skull,
  Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ActiveBot {
  id: string;
  user_id: string;
  cryptocurrency: string;
  symbol: string;
  start_amount: number;
  current_balance: number;
  status: string;
  position_type: string | null;
  leverage: number | null;
  created_at: string;
  expected_completion_time: string | null;
  profiles: {
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface TradePreview {
  trade_type: string;
  buy_price: number;
  sell_price: number;
  entry_price: number;
  exit_price: number;
  natural_movement: number;
  leverage: number;
  profit_percent: number;
  profit_amount: number;
  final_balance: number;
  price_data_from: string;
  price_data_to: string;
  price_points_analyzed: number;
}

interface ManualBotCompleteDialogProps {
  bot: ActiveBot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ManualBotCompleteDialog({
  bot,
  open,
  onOpenChange,
  onSuccess
}: ManualBotCompleteDialogProps) {
  const [tradeType, setTradeType] = useState<'long' | 'short'>('long');
  const [targetProfit, setTargetProfit] = useState<number>(1.5);
  const [isUnlucky, setIsUnlucky] = useState(false);
  const [isExtremeEvent, setIsExtremeEvent] = useState(false);
  const [preview, setPreview] = useState<TradePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [priceMovement, setPriceMovement] = useState<{min: number; max: number; percent: number} | null>(null);
  const { toast } = useToast();

  // Reset state when dialog opens/closes or bot changes
  useEffect(() => {
    if (open && bot) {
      setTradeType('long');
      setTargetProfit(1.5);
      setIsUnlucky(false);
      setIsExtremeEvent(false);
      setPreview(null);
      fetchPriceMovement();
    }
  }, [open, bot?.id]);

  const fetchPriceMovement = async () => {
    if (!bot) return;
    
    try {
      const { data, error } = await supabase
        .from('crypto_price_history')
        .select('price')
        .eq('symbol', bot.symbol)
        .gte('timestamp', bot.created_at)
        .order('timestamp', { ascending: true });

      if (error || !data || data.length < 2) {
        setPriceMovement(null);
        return;
      }

      const prices = data.map(d => d.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      const percent = ((max - min) / avg) * 100;

      setPriceMovement({ min, max, percent });
    } catch (err) {
      console.error('Error fetching price movement:', err);
      setPriceMovement(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getRuntime = (createdAt: string) => {
    const start = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    if (hours > 0) {
      return `${hours} Stunde${hours > 1 ? 'n' : ''} ${minutes} Minute${minutes !== 1 ? 'n' : ''}`;
    }
    return `${minutes} Minute${minutes !== 1 ? 'n' : ''}`;
  };

  const getUserName = (bot: ActiveBot) => {
    if (bot.profiles?.first_name || bot.profiles?.last_name) {
      return `${bot.profiles.first_name || ''} ${bot.profiles.last_name || ''}`.trim();
    }
    return bot.profiles?.email || 'Unbekannt';
  };

  const handleCalculatePreview = async () => {
    if (!bot) return;
    
    setLoadingPreview(true);
    setPreview(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-complete-bot', {
        body: {
          bot_id: bot.id,
          trade_type: tradeType,
          target_profit_percent: targetProfit,
          is_unlucky: isUnlucky,
          is_extreme: isExtremeEvent,
          preview: true
        }
      });

      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Vorschau konnte nicht berechnet werden');
      }

      setPreview(data.trade);
    } catch (err: any) {
      console.error('Error calculating preview:', err);
      toast({
        title: "Fehler",
        description: err.message || "Vorschau konnte nicht berechnet werden.",
        variant: "destructive",
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExecuteTrade = async () => {
    if (!bot || !preview) return;
    
    setExecuting(true);
    setConfirmDialogOpen(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-complete-bot', {
        body: {
          bot_id: bot.id,
          trade_type: tradeType,
          target_profit_percent: targetProfit,
          is_unlucky: isUnlucky,
          is_extreme: isExtremeEvent,
          preview: false
        }
      });

      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Trade konnte nicht ausgeführt werden');
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error executing trade:', err);
      toast({
        title: "Fehler",
        description: err.message || "Trade konnte nicht ausgeführt werden.",
        variant: "destructive",
      });
    } finally {
      setExecuting(false);
    }
  };

  if (!bot) return null;

  const estimatedProfit = (bot.start_amount * targetProfit) / 100;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Bot manuell abschließen
            </DialogTitle>
            <DialogDescription>
              Wählen Sie Trade-Parameter und führen Sie den Bot manuell zu Ende.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Bot Information */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Bot-Informationen
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Benutzer:</span>
                    <p className="font-medium">{getUserName(bot)}</p>
                    <p className="text-xs text-muted-foreground">{bot.profiles?.email}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Kryptowährung:</span>
                    <p className="font-medium">{bot.cryptocurrency} ({bot.symbol})</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Startbetrag:</span>
                    <p className="font-medium text-lg">{formatCurrency(bot.start_amount)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Laufzeit:</span>
                    <p className="font-medium flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {getRuntime(bot.created_at)}
                    </p>
                  </div>
                </div>

                {priceMovement && (
                  <div className="mt-3 p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">Marktbewegung während Bot-Laufzeit:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={priceMovement.percent < 0.5 ? 'border-orange-300 text-orange-700' : 'border-green-300 text-green-700'}>
                        {priceMovement.percent.toFixed(3)}%
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        (Min: {formatCurrency(priceMovement.min)}, Max: {formatCurrency(priceMovement.max)})
                      </span>
                    </div>
                    {priceMovement.percent < 0.1 && (
                      <div className="flex items-center gap-2 mt-2 text-orange-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs">Preisbewegung sehr gering - höherer Hebel wird benötigt</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* Trade Parameters */}
            <div className="space-y-4">
              <h4 className="font-semibold">Trade-Parameter</h4>
              
              {/* Trade Type Selection */}
              <div className="space-y-3">
                <Label>Trade-Typ</Label>
                <RadioGroup 
                  value={tradeType} 
                  onValueChange={(v) => {
                    setTradeType(v as 'long' | 'short');
                    setPreview(null);
                  }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem value="long" id="long" className="peer sr-only" />
                    <Label
                      htmlFor="long"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:bg-green-50 dark:peer-data-[state=checked]:bg-green-950/30 cursor-pointer"
                    >
                      <TrendingUp className="mb-3 h-6 w-6 text-green-600" />
                      <span className="font-semibold">LONG</span>
                      <span className="text-xs text-muted-foreground text-center mt-1">
                        Kauft tief, verkauft hoch
                      </span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="short" id="short" className="peer sr-only" />
                    <Label
                      htmlFor="short"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-red-500 peer-data-[state=checked]:bg-red-50 dark:peer-data-[state=checked]:bg-red-950/30 cursor-pointer"
                    >
                      <TrendingDown className="mb-3 h-6 w-6 text-red-600" />
                      <span className="font-semibold">SHORT</span>
                      <span className="text-xs text-muted-foreground text-center mt-1">
                        Verkauft hoch, kauft tief
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Unlucky Mode Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-900">
                <div className="space-y-0.5">
                  <Label htmlFor="unlucky-mode" className="flex items-center gap-2 cursor-pointer">
                    <Skull className="w-4 h-4 text-orange-500" />
                    Pechsträhne aktivieren
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Bot macht Verlust statt Gewinn
                  </p>
                </div>
                <Switch
                  id="unlucky-mode"
                  checked={isUnlucky}
                  onCheckedChange={(checked) => {
                    setIsUnlucky(checked);
                    setPreview(null);
                  }}
                />
              </div>

              {/* Extreme Event Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900">
                <div className="space-y-0.5">
                  <Label htmlFor="extreme-mode" className="flex items-center gap-2 cursor-pointer">
                    <Zap className="w-4 h-4 text-red-500" />
                    Extremes Ereignis
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Erlaubt Gewinn/Verlust bis 100%
                  </p>
                </div>
                <Switch
                  id="extreme-mode"
                  checked={isExtremeEvent}
                  onCheckedChange={(checked) => {
                    setIsExtremeEvent(checked);
                    // Reset targetProfit wenn aus extremem Modus gewechselt wird
                    if (!checked && targetProfit > 3) {
                      setTargetProfit(3);
                    }
                    setPreview(null);
                  }}
                />
              </div>

              {/* Warning for Extreme Loss */}
              {isExtremeEvent && isUnlucky && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-100 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">
                    Achtung: Extremer Verlust bis -{targetProfit.toFixed(1)}% möglich!
                  </span>
                </div>
              )}

              {/* Profit/Loss Target */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>{isUnlucky ? "Ziel-Verlust" : "Ziel-Gewinn"}</Label>
                  <span className={`text-lg font-bold ${isUnlucky ? 'text-red-600' : 'text-primary'}`}>
                    {isUnlucky ? '-' : ''}{targetProfit.toFixed(1)}%
                  </span>
                </div>
                <Slider
                  value={[targetProfit]}
                  onValueChange={(v) => {
                    setTargetProfit(v[0]);
                    setPreview(null);
                  }}
                  min={1.0}
                  max={isExtremeEvent ? 100.0 : 3.0}
                  step={isExtremeEvent ? 1.0 : 0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1%</span>
                  <span>{isExtremeEvent ? '50%' : '2%'}</span>
                  <span>{isExtremeEvent ? '100%' : '3%'}</span>
                </div>
                <div className={`p-3 rounded-lg flex items-center justify-between ${
                  isUnlucky ? 'bg-red-100/50 dark:bg-red-950/30' : 'bg-primary/10'
                }`}>
                  <span className="text-sm">{isUnlucky ? 'Geschätzter Verlust:' : 'Geschätzter Gewinn:'}</span>
                  <span className={`font-bold ${isUnlucky ? 'text-red-600' : 'text-primary'}`}>
                    {isUnlucky ? '-' : ''}{formatCurrency(estimatedProfit)}
                  </span>
                </div>
              </div>

              {/* Calculate Preview Button */}
              <Button 
                onClick={handleCalculatePreview} 
                disabled={loadingPreview}
                variant="outline"
                className="w-full"
              >
                {loadingPreview ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Berechne Vorschau...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 mr-2" />
                    Vorschau berechnen
                  </>
                )}
              </Button>
            </div>

            {/* Trade Preview */}
            {preview && (
              <>
                <Separator />
                <Card className={preview.profit_percent < 0 
                  ? "border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900"
                  : "border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900"
                }>
                  <CardContent className="p-4 space-y-4">
                    <div className={`flex items-center gap-2 ${
                      preview.profit_percent < 0 
                        ? 'text-red-700 dark:text-red-400' 
                        : 'text-green-700 dark:text-green-400'
                    }`}>
                      {preview.profit_percent < 0 ? (
                        <>
                          <AlertTriangle className="w-5 h-5" />
                          <h4 className="font-semibold">Verlust-Vorschau</h4>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          <h4 className="font-semibold">Trade-Vorschau</h4>
                        </>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Trade-Typ:</span>
                        <p className="font-medium flex items-center gap-1">
                          {preview.trade_type === 'long' ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                          {preview.trade_type.toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Hebel:</span>
                        <p className="font-medium">{preview.leverage}x</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Einstiegspreis:</span>
                        <p className="font-medium">{formatCurrency(preview.entry_price)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ausstiegspreis:</span>
                        <p className="font-medium">{formatCurrency(preview.exit_price)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Natürliche Bewegung:</span>
                        <p className="font-medium">{preview.natural_movement.toFixed(3)}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {preview.profit_percent < 0 ? 'Effektiver Verlust:' : 'Effektiver Profit:'}
                        </span>
                        <p className={`font-medium ${preview.profit_percent < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {preview.profit_percent.toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-muted-foreground">
                          {preview.profit_percent < 0 ? 'Verlust-Betrag:' : 'Gewinn-Betrag:'}
                        </span>
                        <p className={`text-xl font-bold ${preview.profit_percent < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(preview.profit_amount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-muted-foreground">Endguthaben:</span>
                        <p className="text-xl font-bold">{formatCurrency(preview.final_balance)}</p>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Basierend auf {preview.price_points_analyzed} Preisdatenpunkten
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={executing}>
              Abbrechen
            </Button>
            <Button 
              onClick={() => setConfirmDialogOpen(true)} 
              disabled={!preview || executing}
              variant="destructive"
            >
              {executing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird ausgeführt...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Trade ausführen
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Trade ausführen?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Der Bot wird mit den folgenden Parametern abgeschlossen:
              {preview && (
                <div className="mt-3 p-3 rounded-lg bg-muted text-foreground">
                  <p><strong>Trade-Typ:</strong> {preview.trade_type.toUpperCase()}</p>
                  <p><strong>Hebel:</strong> {preview.leverage}x</p>
                  <p><strong>Gewinn:</strong> {formatCurrency(preview.profit_amount)} ({preview.profit_percent.toFixed(2)}%)</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleExecuteTrade} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Ja, Trade ausführen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
