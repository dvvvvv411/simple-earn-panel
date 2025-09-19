import React, { useState, useEffect, useMemo } from "react";
import { useTradingStats } from "@/hooks/useTradingStats";
import { useCoinMarketCap } from "@/contexts/CoinMarketCapContext";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { Skeleton } from "@/components/ui/skeleton";
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
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  XCircle,
  PlayCircle,
  Info,
  Lightbulb
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
  entry_price?: number | null;
  exit_price?: number | null;
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
  const { coins } = useCoinMarketCap();
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

  // Info card state
  const [isInfoOpen, setIsInfoOpen] = useState(false);

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

  // Get crypto icon from CoinMarketCap data
  const getCryptoIcon = (symbol: string) => {
    const coin = coins.find(c => c.symbol.toLowerCase() === symbol.toLowerCase());
    return coin?.image;
  };

  // Check if coins are available (loading state)
  const { loading: coinsLoading } = useCoinMarketCap();

  // Render trade type badge with colors
  const renderTradeTypeBadge = (type: string) => {
    const isLong = type.toLowerCase() === 'long';
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "font-medium gap-1",
          isLong 
            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" 
            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
        )}
      >
        {isLong ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
        {type.toUpperCase()}
      </Badge>
    );
  };

  // Render status badge with colors
  const renderStatusBadge = (status: string) => {
    const getStatusConfig = (status: string) => {
      switch (status.toLowerCase()) {
        case 'completed':
          return {
            variant: "outline" as const,
            className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
            icon: <CheckCircle className="h-3 w-3" />
          };
        case 'failed':
          return {
            variant: "outline" as const,
            className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
            icon: <XCircle className="h-3 w-3" />
          };
        case 'pending':
          return {
            variant: "outline" as const,
            className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
            icon: <PlayCircle className="h-3 w-3" />
          };
        default:
          return {
            variant: "outline" as const,
            className: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800",
            icon: null
          };
      }
    };

    const config = getStatusConfig(status);
    return (
      <Badge variant={config.variant} className={cn("font-medium gap-1", config.className)}>
        {config.icon}
        {status === 'completed' ? 'Abgeschlossen' : status === 'failed' ? 'Fehlgeschlagen' : status === 'pending' ? 'Laufend' : status}
      </Badge>
    );
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

      {/* Trading Explanation Card */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20">
        <Collapsible open={isInfoOpen} onOpenChange={setIsInfoOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-blue-800 dark:text-blue-200">Was sind Long & Short Trades?</span>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-blue-600 dark:text-blue-400 transition-transform duration-200",
                  isInfoOpen && "rotate-180"
                )} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      LONG
                    </Badge>
                    <span className="font-medium text-green-800 dark:text-green-400">Auf steigende Kurse setzen</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Bei einem Long-Trade kaufen Sie die Kryptowährung und profitieren, wenn der Preis steigt. 
                    Sie setzen darauf, dass der Wert der Währung in Zukunft höher sein wird.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700">
                      <ArrowDownLeft className="h-3 w-3 mr-1" />
                      SHORT
                    </Badge>
                    <span className="font-medium text-red-800 dark:text-red-400">Auf fallende Kurse setzen</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Bei einem Short-Trade setzen Sie auf fallende Kurse. Sie "verkaufen" die Kryptowährung 
                    (ohne sie zu besitzen) und profitieren, wenn der Preis fällt.
                  </p>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-800 dark:text-blue-200">Leverage (Hebel)</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Der Hebel multipliziert Ihre Position. Ein 2x Hebel bedeutet, dass Sie mit doppelter Kraft handeln - 
                  sowohl Gewinne als auch Verluste werden verstärkt. Höhere Hebel = höhere Risiken.
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

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
      <Card className="shadow-lg border-border/50">
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-b-2">
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/70 transition-colors font-semibold"
                    onClick={() => handleSort('cryptocurrency')}
                  >
                    <div className="flex items-center gap-1">
                      Kryptowährung
                      {sortField === 'cryptocurrency' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold">Trade Typ</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/70 transition-colors font-semibold"
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
                    className="cursor-pointer hover:bg-muted/70 transition-colors font-semibold"
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
                    className="cursor-pointer hover:bg-muted/70 transition-colors font-semibold"
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
                    className="cursor-pointer hover:bg-muted/70 transition-colors font-semibold"
                    onClick={() => handleSort('profit_amount')}
                  >
                    <div className="flex items-center gap-1">
                      Profit/Loss
                      {sortField === 'profit_amount' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold">Entry Price</TableHead>
                  <TableHead className="font-semibold">Exit Price</TableHead>
                  <TableHead className="font-semibold">Leverage</TableHead>
                  <TableHead className="font-semibold min-w-[120px]">Dauer</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Bot ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTrades.map((trade, index) => (
                  <TableRow 
                    key={trade.id} 
                    className={cn(
                      "hover:bg-accent/20 transition-all duration-200 border-b border-border/50",
                      index % 2 === 0 ? "bg-background" : "bg-muted/20"
                    )}
                  >
                    <TableCell className="font-medium py-4">
                      <div className="flex items-center gap-3">
                        {coinsLoading ? (
                          <Skeleton className="h-8 w-8 rounded-full" />
                        ) : (
                          <>
                            {getCryptoIcon(trade.bot?.symbol || '') ? (
                              <img 
                                src={getCryptoIcon(trade.bot?.symbol || '')} 
                                alt=""
                                className="h-8 w-8 rounded-full border border-border/20 shadow-sm"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={cn(
                              "h-8 w-8 rounded-full border border-border/20 shadow-sm bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground",
                              getCryptoIcon(trade.bot?.symbol || '') ? "hidden" : ""
                            )}>
                              {trade.bot?.symbol?.slice(0, 2).toUpperCase() || '?'}
                            </div>
                          </>
                        )}
                        <div>
                          <div className="font-semibold text-sm">{trade.bot?.cryptocurrency || 'Unknown'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      {renderTradeTypeBadge(trade.trade_type)}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="text-sm font-medium">
                        {format(new Date(trade.started_at), 'dd.MM.yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(trade.started_at), 'HH:mm:ss')}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      {trade.completed_at ? (
                        <div>
                          <div className="text-sm font-medium">
                            {format(new Date(trade.completed_at), 'dd.MM.yyyy')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(trade.completed_at), 'HH:mm:ss')}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground font-medium">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-semibold">€{trade.amount.toFixed(2)}</div>
                    </TableCell>
                    <TableCell className="py-4">
                      {trade.profit_amount !== null ? (
                        <div className={cn(
                          "flex items-center gap-1.5 font-semibold px-2 py-1 rounded-md transition-colors",
                          trade.profit_amount >= 0 
                            ? "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20" 
                            : "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20"
                        )}>
                          {trade.profit_amount >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          <div>
                            <div>€{trade.profit_amount.toFixed(2)}</div>
                            {trade.profit_percentage && (
                              <div className="text-xs opacity-75">
                                ({trade.profit_percentage.toFixed(1)}%)
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground font-medium">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                       <div className="text-sm font-mono font-medium">
                         €{(trade.entry_price || trade.buy_price).toFixed(4)}
                       </div>
                    </TableCell>
                    <TableCell className="py-4">
                       <div className="text-sm font-mono font-medium">
                         €{(trade.exit_price || trade.sell_price || 0).toFixed(4)}
                       </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className="font-semibold border-border/60">{trade.leverage}x</Badge>
                    </TableCell>
                     <TableCell className="py-4 min-w-[120px]">
                       <span className="text-sm font-mono font-medium bg-muted/30 px-2 py-1 rounded whitespace-nowrap">
                         {formatDuration(trade.started_at, trade.completed_at)}
                       </span>
                     </TableCell>
                    <TableCell className="py-4">
                      {renderStatusBadge(trade.status)}
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-xs font-mono text-muted-foreground bg-muted/30 px-2 py-1 rounded">
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