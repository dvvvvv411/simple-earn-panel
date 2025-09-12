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
import { Loader2, Plus, Save, Euro } from "lucide-react";
import type { User, Transaction, BalanceUpdateData } from "@/types/user";

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

  useEffect(() => {
    if (user && open) {
      fetchTransactions();
    }
  }, [user, open]);

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
        </div>

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