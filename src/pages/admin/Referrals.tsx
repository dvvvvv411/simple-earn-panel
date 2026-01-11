import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users2, Gift, UserCheck, Coins, Search, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface ReferralUser {
  id: string;
  email: string;
  referral_code: string;
  totalReferrals: number;
  qualifiedReferrals: number;
  totalEarned: number;
  lastReferralDate: string | null;
}

export default function Referrals() {
  const [users, setUsers] = useState<ReferralUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Statistiken
  const [stats, setStats] = useState({
    activeReferrers: 0,
    totalReferrals: 0,
    qualifiedReferrals: 0,
    totalPaidOut: 0,
  });

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setLoading(true);

      // 1. Alle Profile mit Referral-Code laden
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, referral_code")
        .not("referral_code", "is", null);

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const profileIds = profiles.map((p) => p.id);

      // 2. Referral-Daten laden
      const { data: referrals, error: referralsError } = await supabase
        .from("user_referrals")
        .select("referrer_id, status, created_at")
        .in("referrer_id", profileIds);

      if (referralsError) throw referralsError;

      // 3. Rewards laden
      const { data: rewards, error: rewardsError } = await supabase
        .from("referral_rewards")
        .select("referrer_id, reward_amount")
        .in("referrer_id", profileIds);

      if (rewardsError) throw rewardsError;

      // Daten zusammenführen
      const userMap = new Map<string, ReferralUser>();

      profiles.forEach((profile) => {
        userMap.set(profile.id, {
          id: profile.id,
          email: profile.email || "Keine E-Mail",
          referral_code: profile.referral_code || "",
          totalReferrals: 0,
          qualifiedReferrals: 0,
          totalEarned: 0,
          lastReferralDate: null,
        });
      });

      // Referrals zählen
      referrals?.forEach((ref) => {
        const user = userMap.get(ref.referrer_id);
        if (user) {
          user.totalReferrals += 1;
          if (ref.status === "qualified" || ref.status === "rewarded") {
            user.qualifiedReferrals += 1;
          }
          if (!user.lastReferralDate || ref.created_at > user.lastReferralDate) {
            user.lastReferralDate = ref.created_at;
          }
        }
      });

      // Rewards summieren
      rewards?.forEach((reward) => {
        const user = userMap.get(reward.referrer_id);
        if (user) {
          user.totalEarned += Number(reward.reward_amount);
        }
      });

      const usersArray = Array.from(userMap.values());

      // Statistiken berechnen
      const activeReferrers = usersArray.filter((u) => u.totalReferrals > 0).length;
      const totalReferrals = usersArray.reduce((sum, u) => sum + u.totalReferrals, 0);
      const qualifiedReferrals = usersArray.reduce((sum, u) => sum + u.qualifiedReferrals, 0);
      const totalPaidOut = usersArray.reduce((sum, u) => sum + u.totalEarned, 0);

      setStats({
        activeReferrers,
        totalReferrals,
        qualifiedReferrals,
        totalPaidOut,
      });

      // Nach Einladungen sortieren
      usersArray.sort((a, b) => b.totalReferrals - a.totalReferrals);
      setUsers(usersArray);
    } catch (error) {
      console.error("Error loading referral data:", error);
      toast.error("Fehler beim Laden der Referral-Daten");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd.MM.yyyy", { locale: de });
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Code kopiert!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.referral_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Referral-Übersicht</h1>
        <p className="text-muted-foreground">
          Übersicht aller Nutzer mit Referral-Codes und deren Verdienste
        </p>
      </div>

      {/* Statistik-Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aktive Werber
            </CardTitle>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeReferrers}</div>
            <p className="text-xs text-muted-foreground">Nutzer mit min. 1 Einladung</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gesamt Einladungen
            </CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
            <p className="text-xs text-muted-foreground">Alle registrierten Referrals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Qualifizierte Referrals
            </CardTitle>
            <UserCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.qualifiedReferrals}</div>
            <p className="text-xs text-muted-foreground">New-Rang verlassen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ausgezahlte Boni
            </CardTitle>
            <Coins className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(stats.totalPaidOut)}
            </div>
            <p className="text-xs text-muted-foreground">50€ pro qualifiziertem Referral</p>
          </CardContent>
        </Card>
      </div>

      {/* Suchfeld */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Nach E-Mail oder Code suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabelle */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Benutzer</TableHead>
                <TableHead>Referral-Code</TableHead>
                <TableHead className="text-center">Einladungen</TableHead>
                <TableHead className="text-center">Qualifiziert</TableHead>
                <TableHead className="text-right">Verdienst</TableHead>
                <TableHead>Letztes Referral</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span className="text-muted-foreground">Lade Daten...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "Keine Ergebnisse gefunden" : "Keine Referral-Daten vorhanden"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {user.referral_code}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyCode(user.referral_code)}
                        >
                          {copiedCode === user.referral_code ? (
                            <Check className="h-3 w-3 text-primary" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{user.totalReferrals}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={user.qualifiedReferrals > 0 ? "default" : "secondary"}
                        className={user.qualifiedReferrals > 0 ? "bg-primary" : ""}
                      >
                        {user.qualifiedReferrals}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-primary">
                      {formatCurrency(user.totalEarned)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.lastReferralDate)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
