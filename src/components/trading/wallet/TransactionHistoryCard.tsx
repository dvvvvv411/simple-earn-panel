import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpRight, ArrowDownLeft, Download, Filter, Bot, Plus, Minus, Bitcoin, Clock, XCircle, Landmark, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/types/user";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

const ITEMS_PER_PAGE = 10;

interface TransactionHistoryCardProps {
  className?: string;
}

type FilterType = 'all' | 'credit' | 'debit' | 'adjustment';

interface CombinedTransaction {
  id: string;
  type: 'credit' | 'debit' | 'adjustment' | 'pending_withdrawal' | 'rejected_withdrawal';
  amount: number;
  description: string;
  created_at: string;
  new_balance?: number;
  status?: string;
  btc_wallet_address?: string;
}

export function TransactionHistoryCard({ className }: TransactionHistoryCardProps) {
  const [combinedTransactions, setCombinedTransactions] = useState<CombinedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const isMobile = useIsMobile();

  useEffect(() => {
    loadTransactions();
  }, [filter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Load user transactions
      let transactionQuery = supabase
        .from('user_transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        transactionQuery = transactionQuery.eq('type', filter);
      }

      const { data: transactionsData, error: transactionsError } = await transactionQuery;
      if (transactionsError) throw transactionsError;

      // Load pending and rejected withdrawal requests
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', session.user.id)
        .in('status', ['pending', 'rejected'])
        .order('created_at', { ascending: false });

      if (withdrawalsError) throw withdrawalsError;

      // Convert transactions to combined format
      const transactions: CombinedTransaction[] = (transactionsData || []).map(t => ({
        id: t.id,
        type: t.type as 'credit' | 'debit' | 'adjustment',
        amount: t.amount,
        description: t.description,
        created_at: t.created_at,
        new_balance: t.new_balance
      }));

      // Convert withdrawal requests to combined format
      const withdrawals: CombinedTransaction[] = (withdrawalsData || []).map(w => ({
        id: w.id,
        type: w.status === 'pending' ? 'pending_withdrawal' as const : 'rejected_withdrawal' as const,
        amount: w.amount,
        description: `BTC Wallet: ${w.btc_wallet_address.slice(0, 8)}...${w.btc_wallet_address.slice(-6)}`,
        created_at: w.created_at,
        status: w.status,
        btc_wallet_address: w.btc_wallet_address
      }));

      // Combine and sort by date
      let combined = [...transactions, ...withdrawals];
      
      // Filter based on selected filter
      if (filter === 'debit') {
        combined = combined.filter(t => 
          t.type === 'debit' || t.type === 'pending_withdrawal' || t.type === 'rejected_withdrawal'
        );
      } else if (filter !== 'all') {
        combined = combined.filter(t => t.type === filter);
      }

      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setCombinedTransactions(combined);
    } catch (error) {
      console.error('Error loading transactions:', error);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isCryptoDeposit = (description: string) => {
    return description.toLowerCase().includes('krypto-einzahlung') || 
           description.toLowerCase().includes('crypto');
  };

  const isBankDeposit = (description: string) => {
    return description.toLowerCase().includes('banküberweisung');
  };

  const isCreditLoan = (description: string) => {
    return description.toLowerCase().includes('kredit-auszahlung') || 
           description.toLowerCase().includes('kredit');
  };

  const getTransactionIcon = (type: string, description: string) => {
    if (isCreditLoan(description)) {
      return <CreditCard className="h-4 w-4 text-purple-500" />;
    }
    if (isBankDeposit(description)) {
      return <Landmark className="h-4 w-4 text-blue-500" />;
    }
    if (isCryptoDeposit(description)) {
      return <Bitcoin className="h-4 w-4 text-orange-500" />;
    }
    switch (type) {
      case 'credit':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'debit':
        return <ArrowDownLeft className="h-4 w-4 text-destructive" />;
      case 'adjustment':
        return <Bot className="h-4 w-4 text-primary" />;
      case 'pending_withdrawal':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'rejected_withdrawal':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <ArrowUpRight className="h-4 w-4" />;
    }
  };

  const getTransactionBadge = (type: string, description: string) => {
    if (isCreditLoan(description)) {
      return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400">Kredit</Badge>;
    }
    if (isBankDeposit(description)) {
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">Banküberweisung</Badge>;
    }
    if (isCryptoDeposit(description)) {
      return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400">Krypto-Einzahlung</Badge>;
    }
    switch (type) {
      case 'credit':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">Einzahlung</Badge>;
      case 'debit':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">Auszahlung</Badge>;
      case 'adjustment':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">Anpassung</Badge>;
      case 'pending_withdrawal':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">Auszahlung ausstehend</Badge>;
      case 'rejected_withdrawal':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">Auszahlung abgelehnt</Badge>;
      default:
        return <Badge>Unbekannt</Badge>;
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'credit':
        return 'text-green-600 font-semibold';
      case 'debit':
        return 'text-destructive font-semibold';
      case 'pending_withdrawal':
        return 'text-amber-600 font-semibold';
      case 'rejected_withdrawal':
        return 'text-muted-foreground font-semibold line-through';
      default:
        return 'text-foreground';
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const prefix = type === 'credit' ? '+' : 
                   (type === 'debit' || type === 'pending_withdrawal' || type === 'rejected_withdrawal') ? '-' : '';
    const suffix = type === 'pending_withdrawal' ? ' (ausstehend)' : '';
    return `${prefix}${formatCurrency(Math.abs(amount))}${suffix}`;
  };

  const totalPages = Math.ceil(combinedTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTransactions = combinedTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const filterButtons = [
    { key: 'all' as FilterType, label: 'Alle', icon: Filter },
    { key: 'credit' as FilterType, label: 'Einzahlungen', icon: Plus },
    { key: 'debit' as FilterType, label: 'Auszahlungen', icon: Minus },
    { key: 'adjustment' as FilterType, label: 'Anpassungen', icon: Bot },
  ];

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-24" />
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-text-headline">
            Transaktionsverlauf
          </CardTitle>
          <Button variant="outline" size={isMobile ? "mobile" : "sm"}>
            <Download className="h-4 w-4 mr-2" />
            CSV Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {filterButtons.map((button) => {
            const Icon = button.icon;
            return (
              <Button
                key={button.key}
                variant={filter === button.key ? "default" : "outline"}
                size={isMobile ? "mobile" : "sm"}
                onClick={() => {
                  setFilter(button.key);
                  setCurrentPage(1);
                }}
                className="flex items-center gap-1"
              >
                <Icon className="h-3 w-3" />
                {button.label}
              </Button>
            );
          })}
        </div>

        {/* Transactions Table/Cards */}
        {combinedTransactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-2">Keine Transaktionen gefunden</div>
            <p className="text-sm text-muted-foreground">
              {filter !== 'all' ? 'Versuchen Sie einen anderen Filter' : 'Ihre ersten Transaktionen erscheinen hier'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Typ</TableHead>
                    <TableHead>Beschreibung</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead className="text-right">Betrag</TableHead>
                    <TableHead className="text-right">Neuer Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(transaction.type, transaction.description)}
                          {getTransactionBadge(transaction.type, transaction.description)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {transaction.description}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(transaction.created_at)}
                      </TableCell>
                      <TableCell className={`text-right ${getAmountColor(transaction.type)}`}>
                        {formatAmount(transaction.amount, transaction.type)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {transaction.new_balance !== undefined 
                          ? formatCurrency(transaction.new_balance)
                          : <span className="text-muted-foreground text-sm">—</span>
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-3">
              {paginatedTransactions.map((transaction) => (
                <div key={transaction.id} className="border rounded-lg p-4 bg-card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getTransactionIcon(transaction.type, transaction.description)}
                      {getTransactionBadge(transaction.type, transaction.description)}
                    </div>
                    <div className={`text-right ${getAmountColor(transaction.type)}`}>
                      <div className="font-semibold">
                        {formatAmount(transaction.amount, transaction.type)}
                      </div>
                      {transaction.new_balance !== undefined && (
                        <div className="text-xs text-muted-foreground">
                          Saldo: {formatCurrency(transaction.new_balance)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-foreground">
                      {transaction.description}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(transaction.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                  Zeige {startIndex + 1} bis {Math.min(startIndex + ITEMS_PER_PAGE, combinedTransactions.length)} von {combinedTransactions.length} Transaktionen
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size={isMobile ? "mobile" : "sm"}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Zurück
                  </Button>
                  <Button
                    variant="outline"
                    size={isMobile ? "mobile" : "sm"}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Weiter
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
