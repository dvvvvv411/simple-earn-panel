import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Eye, EyeOff, Trash2, Edit, Shield, CheckCircle, XCircle } from "lucide-react";
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

const phoneSchema = z.object({
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
  
  // Edit states
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showWalletPasswordForm, setShowWalletPasswordForm] = useState(false);

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

  const phoneForm = useForm({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
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
          phoneForm.reset({
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
      setShowPasswordForm(false);
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
      setShowWalletPasswordForm(false);
      fetchUserProfile();
    } catch (error: any) {
      toast.error('Fehler beim Setzen des Wallet-Passworts: ' + error.message);
    }
    setIsLoading(false);
  };

  const onPhoneSubmit = async (data: z.infer<typeof phoneSchema>) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht angemeldet');

      const { error } = await supabase
        .from('profiles')
        .update({
          phone: data.phone || null
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Telefonnummer erfolgreich aktualisiert');
      setIsEditingPhone(false);
      fetchUserProfile();
    } catch (error: any) {
      toast.error('Fehler beim Aktualisieren der Telefonnummer: ' + error.message);
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
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Einstellungen</h1>
        <p className="text-muted-foreground mt-2">
          Verwalten Sie Ihre Account-Einstellungen und Sicherheitsoptionen
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profil-Informationen</CardTitle>
            <CardDescription>
              Ihre persönlichen Daten
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Vorname</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {userProfile?.first_name || 'Nicht angegeben'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Nachname</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {userProfile?.last_name || 'Nicht angegeben'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">E-Mail-Adresse</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {userProfile?.email || 'Nicht angegeben'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Telefonnummer</Label>
              {!isEditingPhone ? (
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-muted-foreground">
                    {userProfile?.phone || 'Nicht angegeben'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingPhone(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Bearbeiten
                  </Button>
                </div>
              ) : (
                <Form {...phoneForm}>
                  <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-2 mt-1">
                    <FormField
                      control={phoneForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="tel" {...field} placeholder="Telefonnummer" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={isLoading}>
                        {isLoading ? "Speichern..." : "Speichern"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditingPhone(false);
                          phoneForm.reset({ phone: userProfile?.phone || "" });
                        }}
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Password Change Card */}
        <Card>
          <CardHeader>
            <CardTitle>Passwort ändern</CardTitle>
            <CardDescription>
              Aktualisieren Sie Ihr Login-Passwort
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showPasswordForm ? (
              <Button
                onClick={() => setShowPasswordForm(true)}
                className="w-full"
              >
                <Shield className="h-4 w-4 mr-2" />
                Passwort ändern
              </Button>
            ) : (
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
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Ändern..." : "Passwort ändern"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowPasswordForm(false);
                        passwordForm.reset();
                      }}
                    >
                      Abbrechen
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {/* Wallet Password Card */}
        <Card>
          <CardHeader>
            <CardTitle>Wallet-Passwort</CardTitle>
            <CardDescription>
              Separates Passwort für Wallet-Operationen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                {userProfile?.wallet_password_hash ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Eingerichtet</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm">Nicht gesetzt</span>
                  </div>
                )}
              </div>
              
              {!showWalletPasswordForm ? (
                <Button
                  onClick={() => setShowWalletPasswordForm(true)}
                  className="w-full"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {userProfile?.wallet_password_hash ? 'Wallet-Passwort ändern' : 'Wallet-Passwort einrichten'}
                </Button>
              ) : (
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
                    <div className="flex gap-2">
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Setzen..." : "Wallet-Passwort setzen"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowWalletPasswordForm(false);
                          walletPasswordForm.reset();
                        }}
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Email Notifications Card */}
        <Card>
          <CardHeader>
            <CardTitle>Benachrichtigungen</CardTitle>
            <CardDescription>
              E-Mail-Benachrichtigungseinstellungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">E-Mail-Benachrichtigungen</Label>
                <p className="text-sm text-muted-foreground">
                  Erhalten Sie Updates zu Ihren Trading-Aktivitäten
                </p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={onNotificationToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Deletion Card - Full Width */}
        <Card className="lg:col-span-2 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Gefahrenbereich</CardTitle>
            <CardDescription>
              Dieser Vorgang kann nicht rückgängig gemacht werden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Account permanent löschen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Account wirklich löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Diese Aktion kann nicht rückgängig gemacht werden. Alle Ihre Daten, 
                    Trading-Bots und Transaktionen werden permanent gelöscht.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Form {...deleteForm}>
                  <form onSubmit={deleteForm.handleSubmit(onDeleteAccount)} className="space-y-4">
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
                    <FormField
                      control={deleteForm.control}
                      name="confirmText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Geben Sie "LÖSCHEN" ein um zu bestätigen</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                        {isLoading ? "Löschen..." : "Account endgültig löschen"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </form>
                </Form>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}