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
      <div className="relative p-10 lg:flex hidden items-center justify-center overflow-hidden bg-background">
        {/* Background: subtle grid + accent glows */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 -z-10 opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="gridPattern" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M32 0H0V32" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gridPattern)" className="text-muted-foreground/10" />
        </svg>

        {/* Accent glow blobs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -z-10 inset-0"
          style={{
            background:
              "radial-gradient(600px 600px at 85% 20%, hsl(var(--accent)/0.12) 0%, transparent 60%), radial-gradient(400px 400px at 20% 80%, hsl(var(--accent)/0.08) 0%, transparent 60%)",
          }}
        />

        {/* Thin accent edge line (elegant) */}
        <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-accent/0 via-accent/20 to-accent/0" />

        <div className="relative z-10 grid grid-cols-1 gap-8 max-w-6xl w-full lg:grid-cols-[1fr_minmax(220px,280px)] items-start">
          {/* Info cards */}
          <div className="space-y-6 max-w-lg animate-fade-in">
            <div className="mb-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs text-accent">
                Sicherheit zuerst
              </span>
              <h3 className="mt-3 text-2xl font-semibold text-foreground">
                Sicher. Transparent. EU-Hosted.
              </h3>
              <p className="text-muted-foreground">
                Deine Daten bleiben geschützt – nach europäischen Standards, mit starker Verschlüsselung.
              </p>
            </div>

            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 border border-accent/10 ring-1 ring-accent/5 hover:ring-accent/10 transition-all duration-300 hover:shadow-md">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/10 ring-1 ring-accent/20 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-foreground">DSGVO-konform</h4>
                  <p className="text-muted-foreground">
                    EU-Hosting und Datenschutz nach höchsten Standards – deine Daten bleiben in sicheren Händen.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 border border-accent/10 ring-1 ring-accent/5 hover:ring-accent/10 transition-all duration-300 hover:shadow-md">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/10 ring-1 ring-accent/20 flex items-center justify-center">
                  <Key className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-foreground">TLS 1.3</h4>
                  <p className="text-muted-foreground">
                    Moderne Transportverschlüsselung für Anmeldungen und sensible Vorgänge.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 border border-accent/10 ring-1 ring-accent/5 hover:ring-accent/10 transition-all duration-300 hover:shadow-md">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/10 ring-1 ring-accent/20 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-foreground">3D Secure</h4>
                  <p className="text-muted-foreground">
                    Karten-Zahlungen werden mit Einmal-Passwort bestätigt – sicher und nahtlos.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Accent timeline */}
          <div className="relative pl-6 animate-fade-in">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-accent/0 via-accent/20 to-accent/0" />
            <ul className="space-y-8">
              <li className="relative">
                <span className="absolute -left-[11px] top-1.5 h-3 w-3 rounded-full bg-accent shadow-[0_0_0_4px] shadow-accent/20" />
                <div className="text-sm text-muted-foreground">Rechenzentrum in der EU</div>
                <div className="text-foreground font-medium">EU-Hosting</div>
              </li>
              <li className="relative">
                <span className="absolute -left-[11px] top-1.5 h-3 w-3 rounded-full bg-accent shadow-[0_0_0_4px] shadow-accent/20" />
                <div className="text-sm text-muted-foreground">Datenübertragung</div>
                <div className="text-foreground font-medium">TLS 1.3 Ende-zu-Ende</div>
              </li>
              <li className="relative">
                <span className="absolute -left-[11px] top-1.5 h-3 w-3 rounded-full bg-accent shadow-[0_0_0_4px] shadow-accent/20" />
                <div className="text-sm text-muted-foreground">Zahlungen</div>
                <div className="text-foreground font-medium">3D Secure Bestätigung</div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;