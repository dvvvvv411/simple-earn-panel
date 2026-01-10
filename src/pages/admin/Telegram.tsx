import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageCircle, Bot, Send, Eye, EyeOff, Loader2, ExternalLink } from "lucide-react";

interface TelegramConfig {
  id: string;
  bot_token: string | null;
  chat_id: string | null;
  enabled: boolean;
  notify_new_user: boolean;
  notify_deposit_created: boolean;
  notify_deposit_paid: boolean;
  notify_withdrawal: boolean;
  notify_support_ticket: boolean;
  notify_kyc_submitted: boolean;
}

export default function Telegram() {
  const [config, setConfig] = useState<TelegramConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [notifyNewUser, setNotifyNewUser] = useState(true);
  const [notifyDepositCreated, setNotifyDepositCreated] = useState(true);
  const [notifyDepositPaid, setNotifyDepositPaid] = useState(true);
  const [notifyWithdrawal, setNotifyWithdrawal] = useState(true);
  const [notifySupportTicket, setNotifySupportTicket] = useState(true);
  const [notifyKycSubmitted, setNotifyKycSubmitted] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('telegram_config')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfig(data);
        setBotToken(data.bot_token || "");
        setChatId(data.chat_id || "");
        setEnabled(data.enabled);
        setNotifyNewUser(data.notify_new_user);
        setNotifyDepositCreated(data.notify_deposit_created);
        setNotifyDepositPaid(data.notify_deposit_paid);
        setNotifyWithdrawal(data.notify_withdrawal);
        setNotifySupportTicket(data.notify_support_ticket);
        setNotifyKycSubmitted(data.notify_kyc_submitted ?? true);
      }
    } catch (error) {
      console.error('Error fetching telegram config:', error);
      toast.error("Fehler beim Laden der Konfiguration");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        bot_token: botToken || null,
        chat_id: chatId || null,
        enabled,
        notify_new_user: notifyNewUser,
        notify_deposit_created: notifyDepositCreated,
        notify_deposit_paid: notifyDepositPaid,
        notify_withdrawal: notifyWithdrawal,
        notify_support_ticket: notifySupportTicket,
        notify_kyc_submitted: notifyKycSubmitted,
      };

      if (config?.id) {
        const { error } = await supabase
          .from('telegram_config')
          .update(updateData)
          .eq('id', config.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('telegram_config')
          .insert(updateData);

        if (error) throw error;
      }

      toast.success("Konfiguration gespeichert");
      await fetchConfig();
    } catch (error) {
      console.error('Error saving telegram config:', error);
      toast.error("Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!botToken || !chatId) {
      toast.error("Bitte Bot-Token und Chat-ID eingeben");
      return;
    }

    setTesting(true);
    try {
      // First save the current config
      await handleSave();

      // Then send test message
      const { data, error } = await supabase.functions.invoke('send-telegram-notification', {
        body: {
          event_type: 'test',
          data: {}
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Test-Nachricht gesendet! Prüfe deine Telegram-Gruppe.");
      } else {
        toast.error(`Fehler: ${data?.reason || 'Unbekannter Fehler'}`);
      }
    } catch (error) {
      console.error('Error sending test message:', error);
      toast.error("Fehler beim Senden der Test-Nachricht");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageCircle className="h-8 w-8" />
          Telegram Benachrichtigungen
        </h1>
        <p className="text-muted-foreground mt-1">
          Konfiguriere Telegram-Benachrichtigungen für Admin-Events
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Bot Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Bot-Konfiguration
            </CardTitle>
            <CardDescription>
              Verbinde deinen Telegram-Bot mit der Gruppe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="botToken">Bot Token</Label>
              <div className="relative">
                <Input
                  id="botToken"
                  type={showToken ? "text" : "password"}
                  placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Erstelle einen Bot bei{" "}
                <a 
                  href="https://t.me/BotFather" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  @BotFather <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chatId">Chat-ID der Gruppe</Label>
              <Input
                id="chatId"
                placeholder="-1001234567890"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Gruppen-IDs beginnen mit -100. Nutze @RawDataBot in der Gruppe.
              </p>
            </div>

            <Button 
              onClick={handleTest} 
              disabled={testing || !botToken || !chatId}
              className="w-full"
              variant="outline"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Test-Nachricht senden
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Benachrichtigungs-Einstellungen</CardTitle>
            <CardDescription>
              Wähle, welche Events gesendet werden sollen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enabled" className="font-medium">Benachrichtigungen aktiviert</Label>
                <p className="text-sm text-muted-foreground">Master-Schalter für alle Notifications</p>
              </div>
              <Switch
                id="enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifyNewUser">🆕 Neue Registrierungen</Label>
                  <p className="text-xs text-muted-foreground">Bei neuen Benutzer-Accounts</p>
                </div>
                <Switch
                  id="notifyNewUser"
                  checked={notifyNewUser}
                  onCheckedChange={setNotifyNewUser}
                  disabled={!enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifyDepositCreated">💰 Einzahlungen erstellt</Label>
                  <p className="text-xs text-muted-foreground">Wenn eine neue Einzahlung erstellt wird</p>
                </div>
                <Switch
                  id="notifyDepositCreated"
                  checked={notifyDepositCreated}
                  onCheckedChange={setNotifyDepositCreated}
                  disabled={!enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifyDepositPaid">✅ Einzahlungen bezahlt</Label>
                  <p className="text-xs text-muted-foreground">Wenn eine Einzahlung bestätigt wird</p>
                </div>
                <Switch
                  id="notifyDepositPaid"
                  checked={notifyDepositPaid}
                  onCheckedChange={setNotifyDepositPaid}
                  disabled={!enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifyWithdrawal">💸 Auszahlungsanträge</Label>
                  <p className="text-xs text-muted-foreground">Wenn Auszahlungen beantragt werden</p>
                </div>
                <Switch
                  id="notifyWithdrawal"
                  checked={notifyWithdrawal}
                  onCheckedChange={setNotifyWithdrawal}
                  disabled={!enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifySupportTicket">🎫 Support-Tickets</Label>
                  <p className="text-xs text-muted-foreground">Bei neuen Tickets & Antworten</p>
                </div>
                <Switch
                  id="notifySupportTicket"
                  checked={notifySupportTicket}
                  onCheckedChange={setNotifySupportTicket}
                  disabled={!enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifyKycSubmitted">📋 KYC-Verifizierungen</Label>
                  <p className="text-xs text-muted-foreground">Bei neuen KYC-Anträgen</p>
                </div>
                <Switch
                  id="notifyKycSubmitted"
                  checked={notifyKycSubmitted}
                  onCheckedChange={setNotifyKycSubmitted}
                  disabled={!enabled}
                />
              </div>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Speichern
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Setup Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Einrichtungsanleitung</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>
              <strong>Bot erstellen:</strong> Gehe zu{" "}
              <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                @BotFather
              </a>
              {" "}und sende <code className="bg-muted px-1 rounded">/newbot</code>. Kopiere den Token.
            </li>
            <li>
              <strong>Gruppe erstellen:</strong> Erstelle eine neue Telegram-Gruppe für dein Admin-Team.
            </li>
            <li>
              <strong>Bot hinzufügen:</strong> Füge deinen Bot als Administrator zur Gruppe hinzu.
            </li>
            <li>
              <strong>Chat-ID ermitteln:</strong> Füge{" "}
              <a href="https://t.me/RawDataBot" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                @RawDataBot
              </a>
              {" "}zur Gruppe hinzu. Er sendet die Chat-ID. Entferne ihn danach wieder.
            </li>
            <li>
              <strong>Konfigurieren:</strong> Trage Token und Chat-ID oben ein und speichere.
            </li>
            <li>
              <strong>Testen:</strong> Klicke auf "Test-Nachricht senden" um die Verbindung zu prüfen.
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
