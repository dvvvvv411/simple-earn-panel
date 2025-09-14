import React, { useState, useEffect, useMemo } from "react";
import { useTradingStats } from "@/hooks/useTradingStats";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Filter, 
  Download,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface TradingBot {
  id: string;
  cryptocurrency: string;
  symbol: string;
  user_id: string;
}

interface EnhancedBotTrade {
  id: string;
  bot_id: string;
  trade_type: string;
  buy_price: number;
  sell_price: number | null;
  amount: number;
  leverage: number;
  profit_amount: number | null;
  profit_percentage: number | null;
  status: string;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  bot?: TradingBot;
}

type SortField = 'started_at' | 'completed_at' | 'profit_amount' | 'amount' | 'cryptocurrency';
type SortDirection = 'asc' | 'desc';

export default function TradingHistory() {
  const { trades, stats, loading, error } = useTradingStats('all');
  const [bots, setBots] = useState<TradingBot[]>([]);
  const [enhancedTrades, setEnhancedTrades] = useState<EnhancedBotTrade[]>([]);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cryptoFilter, setCryptoFilter] = useState<string>("all");
  const [profitFilter, setProfitFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Sorting & Pagination states
  const [sortField, setSortField] = useState<SortField>('started_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch bots data to join with trades
  useEffect(() => {
    const fetchBots = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: botsData } = await supabase
          .from('trading_bots')
          .select('id, cryptocurrency, symbol, user_id')
          .eq('user_id', user.id);

        if (botsData) {
          setBots(botsData);
        }
      } catch (error) {
        console.error('Error fetching bots:', error);
      }
    };

    fetchBots();
  }, []);

  // Enhance trades with bot information
  useEffect(() => {
    const enhanced = trades.map(trade => ({
      ...trade,
      bot: bots.find(bot => bot.id === trade.bot_id)
    }));
    setEnhancedTrades(enhanced);
  }, [trades, bots]);

  // Filter and sort trades
  const filteredAndSortedTrades = useMemo(() => {
    let filtered = enhancedTrades;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(trade => 
        trade.bot_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.bot?.cryptocurrency?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.bot?.symbol?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(trade => trade.status === statusFilter);
    }

    // Crypto filter
    if (cryptoFilter !== "all") {
      filtered = filtered.filter(trade => trade.bot?.cryptocurrency === cryptoFilter);
    }

    // Profit filter
    if (profitFilter !== "all") {
      if (profitFilter === "profit") {
        filtered = filtered.filter(trade => trade.profit_amount && trade.profit_amount > 0);
      } else if (profitFilter === "loss") {
        filtered = filtered.filter(trade => trade.profit_amount && trade.profit_amount < 0);
      }
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(trade => {
        const tradeDate = new Date(trade.started_at);
        return tradeDate >= dateFrom;
      });
    }
    if (dateTo) {
      filtered = filtered.filter(trade => {
        const tradeDate = new Date(trade.started_at);
        return tradeDate <= dateTo;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'cryptocurrency') {
        aValue = a.bot?.cryptocurrency || '';
        bValue = b.bot?.cryptocurrency || '';
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [enhancedTrades, searchTerm, statusFilter, cryptoFilter, profitFilter, dateFrom, dateTo, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTrades.length / itemsPerPage);
  const paginatedTrades = filteredAndSortedTrades.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Get unique cryptocurrencies for filter
  const uniqueCryptos = useMemo(() => {
    const cryptos = new Set(bots.map(bot => bot.cryptocurrency));
    return Array.from(cryptos);
  }, [bots]);

  // Export functionality
  const handleExport = () => {
    const csvContent = [
      ['Bot ID', 'Kryptowährung', 'Trade Typ', 'Start Datum', 'End Datum', 'Start Betrag', 'Profit/Loss', 'Status'].join(','),
      ...filteredAndSortedTrades.map(trade => [
        trade.bot_id,
        trade.bot?.cryptocurrency || '',
        trade.trade_type,
        format(new Date(trade.started_at), 'dd.MM.yyyy HH:mm'),
        trade.completed_at ? format(new Date(trade.completed_at), 'dd.MM.yyyy HH:mm') : '',
        trade.amount.toFixed(2),
        trade.profit_amount?.toFixed(2) || '0',
        trade.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trading-historie.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDuration = (startDate: string, endDate: string | null) => {
    if (!endDate) return "-";
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    if (diffMins > 0) {
      return `${diffMins}m ${diffSecs}s`;
    }
    return `${diffSecs}s`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold text-foreground">Trading-Historie</h1>
          <p className="text-lg text-muted-foreground">
            Detaillierte Übersicht aller Trading-Aktivitäten
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold text-foreground">Trading-Historie</h1>
          <p className="text-lg text-muted-foreground">
            Detaillierte Übersicht aller Trading-Aktivitäten
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Fehler beim Laden der Daten: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-foreground">Trading-Historie</h1>
        <p className="text-lg text-muted-foreground">
          Detaillierte Übersicht aller Trading-Aktivitäten
        </p>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Trades</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTrades}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erfolgsrate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              stats.totalProfit >= 0 ? "text-green-600" : "text-red-600"
            )}>
              €{stats.totalProfit.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ø Dauer</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgTradeDuration}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter & Suche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Bot ID oder Crypto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="completed">Abgeschlossen</SelectItem>
                <SelectItem value="pending">Laufend</SelectItem>
                <SelectItem value="failed">Fehlgeschlagen</SelectItem>
              </SelectContent>
            </Select>

            {/* Crypto Filter */}
            <Select value={cryptoFilter} onValueChange={setCryptoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Kryptowährung" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Cryptos</SelectItem>
                {uniqueCryptos.map(crypto => (
                  <SelectItem key={crypto} value={crypto}>
                    {crypto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Profit Filter */}
            <Select value={profitFilter} onValueChange={setProfitFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Profit/Loss" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Ergebnisse</SelectItem>
                <SelectItem value="profit">Nur Gewinn</SelectItem>
                <SelectItem value="loss">Nur Verlust</SelectItem>
              </SelectContent>
            </Select>

            {/* Date From */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "dd.MM.yyyy", { locale: de }) : "Von Datum"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Export Button */}
            <Button onClick={handleExport} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('cryptocurrency')}
                  >
                    <div className="flex items-center gap-1">
                      Kryptowährung
                      {sortField === 'cryptocurrency' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Trade Typ</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('started_at')}
                  >
                    <div className="flex items-center gap-1">
                      Start Datum
                      {sortField === 'started_at' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('completed_at')}
                  >
                    <div className="flex items-center gap-1">
                      End Datum
                      {sortField === 'completed_at' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center gap-1">
                      Betrag
                      {sortField === 'amount' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('profit_amount')}
                  >
                    <div className="flex items-center gap-1">
                      Profit/Loss
                      {sortField === 'profit_amount' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Leverage</TableHead>
                  <TableHead>Dauer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bot ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTrades.map((trade) => (
                  <TableRow key={trade.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">
                            {trade.bot?.symbol?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{trade.bot?.symbol || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">{trade.bot?.cryptocurrency || 'Unknown'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={trade.trade_type === 'LONG' ? 'default' : 'secondary'}>
                        {trade.trade_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(trade.started_at), 'dd.MM.yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(trade.started_at), 'HH:mm:ss')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {trade.completed_at ? (
                        <div>
                          <div className="text-sm">
                            {format(new Date(trade.completed_at), 'dd.MM.yyyy')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(trade.completed_at), 'HH:mm:ss')}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>€{trade.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      {trade.profit_amount !== null ? (
                        <div className={cn(
                          "flex items-center gap-1 font-medium",
                          trade.profit_amount >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {trade.profit_amount >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          €{trade.profit_amount.toFixed(2)}
                          {trade.profit_percentage && (
                            <span className="text-xs">
                              ({trade.profit_percentage.toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{trade.leverage}x</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono">
                        {formatDuration(trade.started_at, trade.completed_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          trade.status === 'completed' 
                            ? trade.profit_amount && trade.profit_amount > 0 
                              ? 'default' 
                              : 'destructive'
                            : trade.status === 'pending' 
                              ? 'secondary' 
                              : 'destructive'
                        }
                      >
                        {trade.status === 'completed' ? 'Abgeschlossen' : 
                         trade.status === 'pending' ? 'Laufend' : 
                         'Fehlgeschlagen'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono text-muted-foreground">
                        {trade.bot_id.substring(0, 8)}...
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNumber = i + 1;
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(pageNumber);
                      }}
                      isActive={currentPage === pageNumber}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                  }}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Empty State */}
      {filteredAndSortedTrades.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {enhancedTrades.length === 0 
                  ? "Noch keine Trading-Historie vorhanden."
                  : "Keine Trades entsprechen den aktuellen Filterkriterien."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}