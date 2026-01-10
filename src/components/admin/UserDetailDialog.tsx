import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Save, Euro, Frown, Gift, Bot, ShieldCheck, User as UserIcon } from "lucide-react";
import type { User, Transaction, BalanceUpdateData } from "@/types/user";
import { UserActivitySection } from "./UserActivitySection";

interface UserDetailDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
}

export function UserDetailDialog({ user, open, onOpenChange, onUserUpdated }: UserDetailDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceDescription, setBalanceDescription] = useState("");
  const [balanceOperation, setBalanceOperation] = useState<'add' | 'set'>('add');
  const [unluckyStreak, setUnluckyStreak] = useState(false);
  const [unluckyLoading, setUnluckyLoading] = useState(false);
  const [freeBotAmount, setFreeBotAmount] = useState("");
  const [freeBotOperation, setFreeBotOperation] = useState<'add' | 'set'>('add');
  const [freeBotLoading, setFreeBotLoading] = useState(false);
  const [currentFreeBots, setCurrentFreeBots] = useState(0);
  const [kycRequired, setKycRequired] = useState(false);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [consultants, setConsultants] = useState<{ id: string; name: string }[]>([]);
  const [selectedConsultantId, setSelectedConsultantId] = useState<string | null>(null);
  const [consultantLoading, setConsultantLoading] = useState(false);

  useEffect(() => {
    if (user && open) {
      fetchTransactions();
      setUnluckyStreak(user.unlucky_streak ?? false);
      setCurrentFreeBots(user.free_bots || 0);
      setSelectedConsultantId(user.consultant_id || null);
      fetchKycRequired();
      fetchConsultants();
    }
  }, [user, open]);

  const fetchConsultants = async () => {
    try {
      const { data, error } = await supabase
        .from('consultants')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setConsultants(data || []);
    } catch (error) {
      console.error('Error fetching consultants:', error);
    }
  };

  const handleConsultantChange = async (consultantId: string) => {
    if (!user) return;
    setConsultantLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ consultant_id: consultantId })
        .eq('id', user.id);

      if (error) throw error;

      setSelectedConsultantId(consultantId);
      toast({
        title: "Berater zugewiesen",
        description: "Berater wurde erfolgreich geändert.",
      });
      onUserUpdated();
    } catch (error: any) {
      console.error('Error updating consultant:', error);
      toast({
        title: "Fehler",
        description: "Berater konnte nicht geändert werden.",
        variant: "destructive",
      });
    } finally {
      setConsultantLoading(false);
    }
  };

  const fetchKycRequired = async () => {
    if (!user) return;
    try {
      // Hole kyc_required aus profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('kyc_required')
        .eq('id', user.id)
        .single();
      setKycRequired(profileData?.kyc_required ?? false);

      // Hole KYC-Submission Status
      const { data: submissionData } = await supabase
        .from('kyc_submissions')
        .select('status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      setKycStatus((submissionData?.status as 'none' | 'pending' | 'approved' | 'rejected') ?? 'none');
    } catch (error) {
      console.error('Error fetching KYC status:', error);
    }
  };

  const handleKycRequiredToggle = async (checked: boolean) => {
    if (!user) return;
    setKycLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ kyc_required: checked })
        .eq('id', user.id);
      if (error) throw error;
      setKycRequired(checked);
      toast({
        title: checked ? "KYC aktiviert" : "KYC deaktiviert",
        description: checked 
          ? "Nutzer muss jetzt KYC-Verifizierung durchführen." 
          : "KYC-Anforderung wurde entfernt.",
      });
      onUserUpdated();
    } catch (error: any) {
      console.error('Error updating KYC required:', error);
      toast({
        title: "Fehler",
        description: "KYC-Status konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    } finally {
      setKycLoading(false);
    }
  };

  const handleUnluckyStreakToggle = async (checked: boolean) => {
    if (!user) return;
    
    setUnluckyLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ unlucky_streak: checked })
        .eq('id', user.id);

      if (error) throw error;

      setUnluckyStreak(checked);
      toast({
        title: checked ? "Pechsträhne aktiviert" : "Pechsträhne deaktiviert",
        description: checked 
          ? "Trading Bots werden jetzt Verluste erzeugen." 
          : "Trading Bots erzeugen wieder normale Gewinne.",
      });
      onUserUpdated();
    } catch (error: any) {
      console.error('Error updating unlucky streak:', error);
      toast({
        title: "Fehler",
        description: "Pechsträhne konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    } finally {
      setUnluckyLoading(false);
    }
  };

  const handleFreeBotUpdate = async () => {
    if (!user || !freeBotAmount) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine Anzahl ein.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseInt(freeBotAmount);
    if (isNaN(amount) || amount < 0) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine gültige Anzahl ein.",
        variant: "destructive",
      });
      return;
    }

    setFreeBotLoading(true);
    try {
      const { error } = await supabase.rpc('update_user_free_bots', {
        target_user_id: user.id,
        amount_change: amount,
        operation_type: freeBotOperation
      });

      if (error) throw error;

      // Sofort lokalen State aktualisieren
      const newFreeBots = freeBotOperation === 'add' 
        ? currentFreeBots + amount 
        : amount;
      setCurrentFreeBots(newFreeBots);

      toast({
        title: "Erfolg",
        description: freeBotOperation === 'add' 
          ? `${amount} Bonus-Bot(s) wurden hinzugefügt.`
          : `Bonus-Bots wurden auf ${amount} gesetzt.`,
      });
      
      setFreeBotAmount("");
      setFreeBotOperation('add');
      onUserUpdated();
    } catch (error: any) {
      console.error('Error updating free bots:', error);
      toast({
        title: "Fehler",
        description: error.message || "Bonus-Bots konnten nicht aktualisiert werden.",
        variant: "destructive",
      });
    } finally {
      setFreeBotLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;
    
    setLoadingTransactions(true);
    try {
      const { data, error } = await supabase
        .from('user_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions((data || []) as Transaction[]);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Fehler",
        description: "Transaktionen konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleBalanceUpdate = async () => {
    if (!user || !balanceAmount || !balanceDescription.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Felder aus.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(balanceAmount);
    if (isNaN(amount)) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen gültigen Betrag ein.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) {
        throw new Error('Nicht authentifiziert');
      }

      const finalAmount = balanceOperation === 'set' 
        ? amount - user.balance 
        : amount;

      const { error } = await supabase.rpc('update_user_balance', {
        target_user_id: user.id,
        amount_change: finalAmount,
        transaction_type: balanceOperation === 'set' ? 'adjustment' : (finalAmount >= 0 ? 'credit' : 'debit'),
        transaction_description: balanceDescription,
        admin_user_id: currentUser.data.user.id
      });

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Guthaben wurde erfolgreich aktualisiert.",
      });
      
      setBalanceAmount("");
      setBalanceDescription("");
      setBalanceOperation('add');
      onUserUpdated();
      fetchTransactions();
    } catch (error: any) {
      console.error('Error updating balance:', error);
      toast({
        title: "Fehler",
        description: error.message || "Guthaben konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(balance);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE');
  };

  const getDisplayName = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) return user.first_name;
    if (user.last_name) return user.last_name;
    return user.email || 'Unbekannt';
  };

  const getUserRole = (user: User) => {
    if (!user.roles || user.roles.length === 0) return 'user';
    return user.roles[0].role;
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground text-xl">
            Benutzerdetails - {getDisplayName(user)}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Information */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                Benutzerinformationen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Vorname</Label>
                  <p className="text-foreground">{user.first_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nachname</Label>
                  <p className="text-foreground">{user.last_name || '-'}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">E-Mail</Label>
                <p className="text-foreground">{user.email || '-'}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Telefon</Label>
                <p className="text-foreground">{user.phone || '-'}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Branding</Label>
                {user.branding ? (
                  <Badge variant="secondary" className="bg-accent/50 text-foreground mt-1">
                    {user.branding.name}
                  </Badge>
                ) : (
                  <p className="text-foreground">-</p>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Berater</Label>
                <Select 
                  value={selectedConsultantId || ''} 
                  onValueChange={handleConsultantChange}
                  disabled={consultantLoading}
                >
                  <SelectTrigger className="mt-1 bg-background border-input">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Kein Berater" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {consultants.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Rolle</Label>
                <Badge 
                  variant={getUserRole(user) === 'admin' ? 'default' : 'outline'}
                  className={getUserRole(user) === 'admin' ? 'bg-primary text-primary-foreground mt-1' : 'border-border text-muted-foreground mt-1'}
                >
                  {getUserRole(user) === 'admin' ? 'Admin' : 'Benutzer'}
                </Badge>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Erstellt am</Label>
                <p className="text-foreground">{formatDateTime(user.created_at)}</p>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-500" />
                  <Label className="text-sm font-medium text-foreground">KYC Status</Label>
                </div>
                {kycStatus === 'approved' ? (
                  <Badge className="bg-green-500 text-white">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Verifiziert
                  </Badge>
                ) : (
                  <div className="flex items-center gap-2">
                    {kycStatus === 'pending' && (
                      <Badge variant="outline" className="border-blue-500 text-blue-500">
                        In Prüfung
                      </Badge>
                    )}
                    {kycStatus === 'rejected' && (
                      <Badge variant="outline" className="border-red-500 text-red-500">
                        Abgelehnt
                      </Badge>
                    )}
                    <Switch 
                      checked={kycRequired}
                      onCheckedChange={handleKycRequiredToggle}
                      disabled={kycLoading}
                      className="data-[state=checked]:bg-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <Frown className="h-4 w-4 text-destructive" />
                  <Label className="text-sm font-medium text-foreground">Pechsträhne</Label>
                </div>
                <Switch 
                  checked={unluckyStreak}
                  onCheckedChange={handleUnluckyStreakToggle}
                  disabled={unluckyLoading}
                  className="data-[state=checked]:bg-destructive"
                />
              </div>
            </CardContent>
          </Card>

          {/* Balance Management */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Guthaben-Verwaltung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Label className="text-sm font-medium text-muted-foreground">Aktuelles Guthaben</Label>
                <p className={`text-2xl font-bold ${user.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatBalance(user.balance)}
                </p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="balanceAmount" className="text-sm font-medium text-foreground">
                    Betrag (€)
                  </Label>
                  <Input
                    id="balanceAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={balanceAmount}
                    onChange={(e) => setBalanceAmount(e.target.value)}
                    className="bg-background border-input text-foreground"
                  />
                </div>
                
                <div>
                  <Label htmlFor="balanceDescription" className="text-sm font-medium text-foreground">
                    Beschreibung
                  </Label>
                  <Textarea
                    id="balanceDescription"
                    placeholder="Grund für die Änderung..."
                    value={balanceDescription}
                    onChange={(e) => setBalanceDescription(e.target.value)}
                    className="bg-background border-input text-foreground"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant={balanceOperation === 'add' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBalanceOperation('add')}
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Hinzufügen
                  </Button>
                  <Button
                    variant={balanceOperation === 'set' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBalanceOperation('set')}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Setzen
                  </Button>
                </div>
                
                <Button
                  onClick={handleBalanceUpdate}
                  disabled={isLoading || !balanceAmount || !balanceDescription.trim()}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Guthaben aktualisieren
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bot Bonus Management */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Gift className="h-5 w-5 text-amber-500" />
                Bot Bonus Verwaltung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-gradient-to-r from-amber-100 via-yellow-50 to-orange-100 dark:from-amber-900/20 dark:via-yellow-900/10 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <Label className="text-sm font-medium text-muted-foreground">Aktuelle Bonus-Bots</Label>
                <div className="flex items-center justify-center gap-2 mt-2">
                  {currentFreeBots > 0 && (
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(currentFreeBots, 3) }).map((_, i) => (
                        <div 
                          key={i} 
                          className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 
                                     flex items-center justify-center shadow-sm"
                        >
                          <Bot className="w-3 h-3 text-white" />
                        </div>
                      ))}
                      {currentFreeBots > 3 && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 self-center ml-1">
                          +{currentFreeBots - 3}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {currentFreeBots}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="freeBotAmount" className="text-sm font-medium text-foreground">
                    Anzahl Bonus-Bots
                  </Label>
                  <Input
                    id="freeBotAmount"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="5"
                    value={freeBotAmount}
                    onChange={(e) => setFreeBotAmount(e.target.value)}
                    className="bg-background border-input text-foreground"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant={freeBotOperation === 'add' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFreeBotOperation('add')}
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Hinzufügen
                  </Button>
                  <Button
                    variant={freeBotOperation === 'set' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFreeBotOperation('set')}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Setzen
                  </Button>
                </div>
                
                <Button
                  onClick={handleFreeBotUpdate}
                  disabled={freeBotLoading || !freeBotAmount}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  {freeBotLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Gift className="h-4 w-4 mr-2" />
                  )}
                  Bonus-Bots aktualisieren
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Online Activity Section */}
        <UserActivitySection userId={user.id} />
        {/* Transaction History */}
        <Card className="bg-card border-border mt-6">
          <CardHeader>
            <CardTitle className="text-foreground">
              Transaktionshistorie (letzte 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTransactions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Transaktionen werden geladen...</span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Keine Transaktionen vorhanden.</p>
              </div>
            ) : (
              <div className="border border-border rounded-lg bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-foreground">Datum</TableHead>
                      <TableHead className="text-foreground">Betrag</TableHead>
                      <TableHead className="text-foreground">Typ</TableHead>
                      <TableHead className="text-foreground">Beschreibung</TableHead>
                      <TableHead className="text-foreground">Neuer Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(transaction.created_at)}
                        </TableCell>
                        <TableCell className={`font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.amount >= 0 ? '+' : ''}{formatBalance(transaction.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-border text-muted-foreground">
                            {transaction.type === 'credit' ? 'Gutschrift' : 
                             transaction.type === 'debit' ? 'Belastung' : 'Anpassung'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-foreground">
                          {transaction.description}
                        </TableCell>
                        <TableCell className={`font-medium ${transaction.new_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatBalance(transaction.new_balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}