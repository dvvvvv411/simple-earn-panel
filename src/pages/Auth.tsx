import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, Lock, User, Phone, Shield, Key, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben"),
});

const registerSchema = z.object({
  firstName: z.string().min(2, "Vorname muss mindestens 2 Zeichen haben"),
  lastName: z.string().min(2, "Nachname muss mindestens 2 Zeichen haben"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  phone: z.string().optional(),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben"),
});

const resetPasswordSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  const resetForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await redirectBasedOnRole(session.user.id);
      }
    };
    checkAuth();
  }, []);

  const redirectBasedOnRole = async (userId: string) => {
    try {
      const { data: userRoles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching user role:", error);
        navigate("/kryptotrading");
        return;
      }

      const isAdmin = userRoles?.some(role => role.role === "admin");
      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/kryptotrading");
      }
    } catch (error) {
      console.error("Error checking role:", error);
      navigate("/kryptotrading");
    }
  };

  const onLogin = async (values: z.infer<typeof loginSchema>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        toast({
          title: "Anmeldefehler",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        toast({
          title: "Erfolgreich angemeldet",
          description: "Willkommen zurück!",
        });
        await redirectBasedOnRole(data.user.id);
      }
    } catch (error) {
      toast({
        title: "Unerwarteter Fehler",
        description: "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values: z.infer<typeof registerSchema>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: values.firstName,
            last_name: values.lastName,
            phone: values.phone,
          },
        },
      });

      if (error) {
        toast({
          title: "Registrierungsfehler",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        toast({
          title: "Registrierung erfolgreich",
          description: "Bitte überprüfen Sie Ihre E-Mail zur Bestätigung.",
        });
      }
    } catch (error) {
      toast({
        title: "Unerwarteter Fehler",
        description: "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async (values: z.infer<typeof resetPasswordSchema>) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        toast({
          title: "Fehler",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "E-Mail gesendet",
        description: "Überprüfen Sie Ihre E-Mail für weitere Anweisungen.",
      });
      setIsResetPassword(false);
    } catch (error) {
      toast({
        title: "Unerwarteter Fehler",
        description: "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Auth Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-primary mb-2">Panel</h1>
              <h2 className="text-3xl font-bold text-text-headline mb-2">
                {isResetPassword ? "Passwort zurücksetzen" : isLogin ? "Anmeldung bei Panel" : "Registrierung bei Panel"}
              </h2>
              <p className="text-text-hero">
                {isResetPassword ? "Geben Sie Ihre E-Mail-Adresse ein" : isLogin ? "Melde dich an, um dein Panel zu nutzen" : "Erstelle einen Account für dein Panel"}
              </p>
            </div>

            {isResetPassword ? (
              <Form {...resetForm}>
                <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-4">
                  <FormField
                    control={resetForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-Mail</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="E-Mail-Adresse" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Wird gesendet..." : "E-Mail senden"}
                  </Button>
                </form>
              </Form>
            ) : isLogin ? (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-Mail</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="E-Mail-Adresse" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passwort</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input type="password" placeholder="••••••••" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Wird angemeldet..." : "Einloggen"}
                  </Button>
                </form>
              </Form>
            ) : (
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={registerForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vorname</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Vorname" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nachname</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Nachname" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-Mail</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="E-Mail-Adresse" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefonnummer (optional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Telefonnummer" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passwort</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input type="password" placeholder="••••••••" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Wird registriert..." : "Registrieren"}
                  </Button>
                </form>
              </Form>
            )}

            <div className="space-y-2 text-center">
              {!isResetPassword && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsResetPassword(true)}
                    className="text-sm text-muted-foreground hover:text-primary underline"
                  >
                    Hast du dein Passwort vergessen?
                  </button>
                  <div className="text-sm text-muted-foreground">
                    {isLogin ? (
                      <>
                        Noch kein Account?{" "}
                        <button
                          type="button"
                          onClick={() => setIsLogin(false)}
                          className="text-primary hover:underline"
                        >
                          Registrieren
                        </button>
                      </>
                    ) : (
                      <>
                        Schon einen Account?{" "}
                        <button
                          type="button"
                          onClick={() => setIsLogin(true)}
                          className="text-primary hover:underline"
                        >
                          Einloggen
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
              {isResetPassword && (
                <button
                  type="button"
                  onClick={() => setIsResetPassword(false)}
                  className="text-sm text-primary hover:underline"
                >
                  Zurück zur Anmeldung
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Security Features */}
      <div className="relative p-8 lg:flex items-center justify-center hidden overflow-hidden bg-background">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 opacity-60">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(hsl(var(--muted-foreground) / 0.1) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--muted-foreground) / 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
            animation: 'grid-flow 20s linear infinite'
          }} />
        </div>

        {/* Flowing Accent Lines */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent animate-[slide-in-right_8s_ease-in-out_infinite]" />
          <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent animate-[slide-in-right_12s_ease-in-out_infinite_2s]" />
          <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent animate-[slide-in-right_15s_ease-in-out_infinite_4s]" />
        </div>

        {/* Subtle Accent Glows */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-accent/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-8 max-w-lg animate-fade-in">
          <div className="space-y-2 mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs text-accent font-medium">
              <Shield className="h-3 w-3" />
              Fintech Security
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              Bankensicherheit für deine Daten
            </h2>
            <p className="text-muted-foreground text-lg">
              EU-Standard, TLS-Verschlüsselung und 3D Secure Protection
            </p>
          </div>

          <div className="space-y-6">
            <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 transition-all duration-300 hover:border-accent/20 hover:shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-accent/10 rounded-xl border border-accent/20 flex items-center justify-center group-hover:bg-accent/15 transition-colors">
                  <Shield className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">DSGVO-konform</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Unsere Server sind abgesichert und befinden sich in der Europäischen Union. 
                    Vollständige DSGVO-Compliance seit 2016.
                  </p>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 transition-all duration-300 hover:border-accent/20 hover:shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-accent/10 rounded-xl border border-accent/20 flex items-center justify-center group-hover:bg-accent/15 transition-colors">
                  <Key className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">TLS 1.3 Protokoll</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Alle Daten werden mit modernster Verschlüsselungstechnologie übertragen. 
                    Ende-zu-Ende Schutz für maximale Sicherheit.
                  </p>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 transition-all duration-300 hover:border-accent/20 hover:shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-accent/10 rounded-xl border border-accent/20 flex items-center justify-center group-hover:bg-accent/15 transition-colors">
                  <CreditCard className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">3D Secure 2.0</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Jede Online-Zahlung wird mit biometrischer Authentifizierung oder 
                    Einmalkennwort bestätigt. Banking-Standard.
                  </p>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-6 pt-6 border-t border-border/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">256-bit</div>
              <div className="text-xs text-muted-foreground">SSL Encryption</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">EU</div>
              <div className="text-xs text-muted-foreground">Data Centers</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">24/7</div>
              <div className="text-xs text-muted-foreground">Monitoring</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;