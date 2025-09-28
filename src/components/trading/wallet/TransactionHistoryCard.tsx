import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpRight, ArrowDownLeft, Download, Filter, Bot, Plus, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/types/user";
import { Skeleton } from "@/components/ui/skeleton";

const ITEMS_PER_PAGE = 10;

interface TransactionHistoryCardProps {
  className?: string;
}

type FilterType = 'all' | 'credit' | 'debit' | 'adjustment';

export function TransactionHistoryCard({ className }: TransactionHistoryCardProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadTransactions();
  }, [filter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let query = supabase
        .from('user_transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('type', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions((data || []) as Transaction[]);
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

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'debit':
        return <ArrowDownLeft className="h-4 w-4 text-destructive" />;
      case 'adjustment':
        return <Bot className="h-4 w-4 text-primary" />;
      default:
        return <ArrowUpRight className="h-4 w-4" />;
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'credit':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Einzahlung</Badge>;
      case 'debit':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Auszahlung</Badge>;
      case 'adjustment':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Anpassung</Badge>;
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
      default:
        return 'text-foreground';
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const prefix = type === 'credit' ? '+' : type === 'debit' ? '-' : '';
    return `${prefix}${formatCurrency(Math.abs(amount))}`;
  };

  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTransactions = transactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
          <Button variant="outline" size="sm">
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
                size="sm"
                onClick={() => {
                  setFilter(button.key);
                  setCurrentPage(1);
                }}
                className="flex items-center gap-1 text-xs sm:text-sm"
              >
                <Icon className="h-3 w-3" />
                <span className="hidden xs:inline">{button.label}</span>
                <span className="xs:hidden">
                  {button.key === 'all' ? 'Alle' : 
                   button.key === 'credit' ? 'Ein' : 
                   button.key === 'debit' ? 'Aus' : 'Adj'}
                </span>
              </Button>
            );
          })}
        </div>

        {/* Transactions Table */}
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-2">Keine Transaktionen gefunden</div>
            <p className="text-sm text-muted-foreground">
              {filter !== 'all' ? 'Versuchen Sie einen anderen Filter' : 'Ihre ersten Transaktionen erscheinen hier'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block border rounded-lg overflow-hidden">
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
                          {getTransactionIcon(transaction.type)}
                          {getTransactionBadge(transaction.type)}
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
                        {formatCurrency(transaction.new_balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {paginatedTransactions.map((transaction) => (
                <div key={transaction.id} className="bg-card border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTransactionIcon(transaction.type)}
                      {getTransactionBadge(transaction.type)}
                    </div>
                    <div className={`text-right font-semibold ${getAmountColor(transaction.type)}`}>
                      {formatAmount(transaction.amount, transaction.type)}
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
                  
                  <div className="text-right pt-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">Neuer Saldo: </span>
                    <span className="text-sm font-medium">{formatCurrency(transaction.new_balance)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs sm:text-sm text-muted-foreground text-center">
                  <span className="hidden sm:inline">Zeige {startIndex + 1} bis {Math.min(startIndex + ITEMS_PER_PAGE, transactions.length)} von {transactions.length} Transaktionen</span>
                  <span className="sm:hidden">{startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, transactions.length)} von {transactions.length}</span>
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Zurück
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
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