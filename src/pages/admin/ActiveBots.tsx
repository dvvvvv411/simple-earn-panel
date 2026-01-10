import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Bot, 
  Clock, 
  AlertTriangle, 
  Search,
  RefreshCw,
  Euro,
  TrendingUp,
  TrendingDown,
  Settings2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { ManualBotCompleteDialog } from "@/components/admin/ManualBotCompleteDialog";

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

export default function ActiveBots() {
  const [bots, setBots] = useState<ActiveBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBot, setSelectedBot] = useState<ActiveBot | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchBots = async () => {
    setLoading(true);
    try {
      // First fetch the bots
      const { data: botsData, error: botsError } = await supabase
        .from('trading_bots')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: true });

      if (botsError) throw botsError;

      if (!botsData || botsData.length === 0) {
        setBots([]);
        return;
      }

      // Then fetch profiles separately
      const userIds = [...new Set(botsData.map(b => b.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      const botsWithProfiles = botsData.map(bot => ({
        ...bot,
        profiles: profilesMap.get(bot.user_id) || null
      }));

      setBots(botsWithProfiles as ActiveBot[]);
    } catch (error) {
      console.error('Error fetching active bots:', error);
      toast({
        title: "Fehler",
        description: "Aktive Bots konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBots();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getUserName = (bot: ActiveBot) => {
    if (bot.profiles?.first_name || bot.profiles?.last_name) {
      return `${bot.profiles.first_name || ''} ${bot.profiles.last_name || ''}`.trim();
    }
    return bot.profiles?.email || 'Unbekannt';
  };

  const getRuntime = (createdAt: string) => {
    const start = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const isOverdue = (bot: ActiveBot) => {
    // Consider overdue if expected_completion_time is past OR bot runs > 60 minutes
    const now = new Date();
    const created = new Date(bot.created_at);
    const runtimeMinutes = (now.getTime() - created.getTime()) / (1000 * 60);
    
    if (bot.expected_completion_time) {
      const expected = new Date(bot.expected_completion_time);
      return expected < now;
    }
    
    return runtimeMinutes > 60;
  };

  const getOverdueDuration = (bot: ActiveBot) => {
    if (!bot.expected_completion_time) return null;
    const expected = new Date(bot.expected_completion_time);
    const now = new Date();
    if (expected >= now) return null;
    
    return formatDistanceToNow(expected, { locale: de, addSuffix: false });
  };

  const filteredBots = bots.filter(bot => {
    const userName = getUserName(bot);
    return (
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bot.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bot.cryptocurrency.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bot.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const overdueCount = bots.filter(isOverdue).length;
  const totalVolume = bots.reduce((sum, b) => sum + b.start_amount, 0);

  const handleOpenDialog = (bot: ActiveBot) => {
    setSelectedBot(bot);
    setDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    setDialogOpen(false);
    setSelectedBot(null);
    fetchBots();
    toast({
      title: "Erfolg",
      description: "Bot wurde erfolgreich abgeschlossen.",
    });
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Aktive Bots</h1>
          <p className="text-muted-foreground">
            Trading-Bots überwachen und manuell abschließen
          </p>
        </div>
        <Button variant="outline" onClick={fetchBots} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Aktualisieren
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aktive Bots</p>
                <p className="text-2xl font-bold">{bots.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Überfällig</p>
                <p className="text-2xl font-bold">{overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950">
                <Euro className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gesamtvolumen</p>
                <p className="text-2xl font-bold">{formatCurrency(totalVolume)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Suche nach Benutzer, E-Mail oder Kryptowährung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredBots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bot className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Keine aktiven Bots</p>
              <p className="text-sm">Alle Trading-Bots wurden abgeschlossen.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Benutzer</TableHead>
                  <TableHead>Kryptowährung</TableHead>
                  <TableHead className="text-right">Betrag</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Laufzeit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBots.map((bot) => {
                  const overdue = isOverdue(bot);
                  const overdueDuration = getOverdueDuration(bot);
                  
                  return (
                    <TableRow key={bot.id} className={overdue ? 'bg-orange-50 dark:bg-orange-950/20' : ''}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{getUserName(bot)}</span>
                          <span className="text-xs text-muted-foreground">{bot.profiles?.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{bot.cryptocurrency}</span>
                          <span className="text-xs text-muted-foreground">{bot.symbol}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(bot.start_amount)}
                      </TableCell>
                      <TableCell>
                        {bot.position_type ? (
                          <Badge 
                            variant="outline" 
                            className={bot.position_type === 'LONG' 
                              ? 'text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30' 
                              : 'text-red-600 border-red-200 bg-red-50 dark:bg-red-950/30'
                            }
                          >
                            {bot.position_type === 'LONG' ? (
                              <TrendingUp className="w-3 h-3 mr-1" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-1" />
                            )}
                            {bot.position_type}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{getRuntime(bot.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {overdue ? (
                          <div className="flex flex-col gap-1">
                            <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Überfällig
                            </Badge>
                            {overdueDuration && (
                              <span className="text-xs text-orange-600">seit {overdueDuration}</span>
                            )}
                          </div>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                            <Clock className="w-3 h-3 mr-1" />
                            Normal
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant={overdue ? "default" : "outline"}
                          onClick={() => handleOpenDialog(bot)}
                        >
                          <Settings2 className="w-4 h-4 mr-1" />
                          Abschließen
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Manual Complete Dialog */}
      <ManualBotCompleteDialog
        bot={selectedBot}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
