import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Eye, EyeOff, Trash2, User, Shield, Bell, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Aktuelles Passwort ist erforderlich"),
  newPassword: z.string().min(6, "Passwort muss mindestens 6 Zeichen lang sein"),
  confirmPassword: z.string().min(1, "Passwort bestätigen ist erforderlich")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
});

const walletPasswordSchema = z.object({
  walletPassword: z.string().min(4, "Wallet-Passwort muss mindestens 4 Zeichen lang sein"),
  confirmWalletPassword: z.string().min(1, "Wallet-Passwort bestätigen ist erforderlich")
}).refine((data) => data.walletPassword === data.confirmWalletPassword, {
  message: "Wallet-Passwörter stimmen nicht überein",
  path: ["confirmWalletPassword"],
});

const profileSchema = z.object({
  firstName: z.string().min(1, "Vorname ist erforderlich"),
  lastName: z.string().min(1, "Nachname ist erforderlich"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  phone: z.string().optional(),
});

const deleteAccountSchema = z.object({
  confirmPassword: z.string().min(1, "Passwort zur Bestätigung erforderlich"),
  confirmText: z.string().refine((val) => val === "LÖSCHEN", {
    message: 'Bitte geben Sie "LÖSCHEN" ein'
  })
});

export default function Settings() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showWalletPassword, setShowWalletPassword] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  const walletPasswordForm = useForm({
    resolver: zodResolver(walletPasswordSchema),
    defaultValues: {
      walletPassword: "",
      confirmWalletPassword: ""
    }
  });

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: ""
    }
  });

  const deleteForm = useForm({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      confirmPassword: "",
      confirmText: ""
    }
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserProfile(profile);
          setEmailNotifications(profile.email_notifications ?? true);
          profileForm.reset({
            firstName: profile.first_name || "",
            lastName: profile.last_name || "",
            email: profile.email || user.email || "",
            phone: profile.phone || ""
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Fehler beim Laden der Profildaten');
    }
  };

  const onPasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      });

      if (error) throw error;

      toast.success('Passwort erfolgreich geändert');
      passwordForm.reset();
    } catch (error: any) {
      toast.error('Fehler beim Ändern des Passworts: ' + error.message);
    }
    setIsLoading(false);
  };

  const onWalletPasswordSubmit = async (data: z.infer<typeof walletPasswordSchema>) => {
    setIsLoading(true);
    try {
      // Simple hash function for demo purposes - in production use proper server-side hashing
      const simpleHash = btoa(data.walletPassword + "salt123");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht angemeldet');

      const { error } = await supabase
        .from('profiles')
        .update({ wallet_password_hash: simpleHash })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Wallet-Passwort erfolgreich gesetzt');
      walletPasswordForm.reset();
    } catch (error: any) {
      toast.error('Fehler beim Setzen des Wallet-Passworts: ' + error.message);
    }
    setIsLoading(false);
  };

  const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht angemeldet');

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone || null
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      if (data.email !== user.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: data.email
        });
        if (authError) throw authError;
      }

      toast.success('Profil erfolgreich aktualisiert');
      fetchUserProfile();
    } catch (error: any) {
      toast.error('Fehler beim Aktualisieren des Profils: ' + error.message);
    }
    setIsLoading(false);
  };

  const onNotificationToggle = async (enabled: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht angemeldet');

      const { error } = await supabase
        .from('profiles')
        .update({ email_notifications: enabled })
        .eq('id', user.id);

      if (error) throw error;

      setEmailNotifications(enabled);
      toast.success(enabled ? 'E-Mail Benachrichtigungen aktiviert' : 'E-Mail Benachrichtigungen deaktiviert');
    } catch (error: any) {
      toast.error('Fehler beim Aktualisieren der Benachrichtigungseinstellungen');
    }
  };

  const onDeleteAccount = async (data: { confirmPassword: string; confirmText: string }) => {
    setIsLoading(true);
    try {
      // Note: Account deletion requires admin privileges in Supabase
      // This would typically be handled by a secure edge function
      toast.error('Account-Löschung ist derzeit nicht verfügbar. Kontaktieren Sie den Support.');
    } catch (error: any) {
      toast.error('Fehler beim Löschen des Accounts: ' + error.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Einstellungen</h1>
        <p className="text-muted-foreground mt-2">
          Verwalten Sie Ihre Account-Einstellungen und Sicherheitsoptionen
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Sicherheit
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Benachrichtigungen
          </TabsTrigger>
          <TabsTrigger value="danger" className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Gefahrenbereich
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account-Informationen</CardTitle>
              <CardDescription>
                Aktualisieren Sie Ihre persönlichen Informationen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vorname</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nachname</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-Mail-Adresse</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefonnummer (optional)</FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Speichern..." : "Änderungen speichern"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Passwort ändern</CardTitle>
                <CardDescription>
                  Aktualisieren Sie Ihr Login-Passwort
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aktuelles Passwort</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Neues Passwort</FormLabel>
                          <FormControl>
                            <Input type={showPassword ? "text" : "password"} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Neues Passwort bestätigen</FormLabel>
                          <FormControl>
                            <Input type={showPassword ? "text" : "password"} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Ändern..." : "Passwort ändern"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Wallet-Passwort</CardTitle>
                <CardDescription>
                  Setzen Sie ein separates Passwort für Wallet-Operationen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...walletPasswordForm}>
                  <form onSubmit={walletPasswordForm.handleSubmit(onWalletPasswordSubmit)} className="space-y-4">
                    <FormField
                      control={walletPasswordForm.control}
                      name="walletPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wallet-Passwort</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showWalletPassword ? "text" : "password"} 
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowWalletPassword(!showWalletPassword)}
                              >
                                {showWalletPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={walletPasswordForm.control}
                      name="confirmWalletPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wallet-Passwort bestätigen</FormLabel>
                          <FormControl>
                            <Input type={showWalletPassword ? "text" : "password"} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Setzen..." : "Wallet-Passwort setzen"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Benachrichtigungseinstellungen</CardTitle>
              <CardDescription>
                Verwalten Sie Ihre E-Mail-Benachrichtigungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">E-Mail-Benachrichtigungen</Label>
                  <p className="text-sm text-muted-foreground">
                    Erhalten Sie E-Mail-Updates über Trading-Aktivitäten und Account-Änderungen
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={onNotificationToggle}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Gefahrenbereich</CardTitle>
              <CardDescription>
                Irreversible und destruktive Aktionen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <h3 className="text-lg font-medium text-destructive mb-2">Account löschen</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Das Löschen Ihres Accounts ist permanent und kann nicht rückgängig gemacht werden. 
                  Alle Ihre Daten, Trading-Historie und Wallet-Informationen werden unwiderruflich gelöscht.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Account löschen
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Account löschen bestätigen</AlertDialogTitle>
                      <AlertDialogDescription>
                        Diese Aktion kann nicht rückgängig gemacht werden. Alle Ihre Daten werden permanent gelöscht.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Form {...deleteForm}>
                      <form onSubmit={deleteForm.handleSubmit(onDeleteAccount)} className="space-y-4">
                        <FormField
                          control={deleteForm.control}
                          name="confirmText"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Geben Sie "LÖSCHEN" ein, um zu bestätigen</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="LÖSCHEN" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={deleteForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Passwort zur Bestätigung</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <AlertDialogFooter>
                          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                          <AlertDialogAction 
                            type="submit"
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isLoading}
                          >
                            {isLoading ? "Lösche..." : "Account endgültig löschen"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </form>
                    </Form>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}