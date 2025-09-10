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

      {/* Right Side - Accent Design */}
      <div className="relative lg:flex items-center justify-center hidden overflow-hidden bg-accent">
        {/* Radial Gradient Background */}
        <div className="absolute inset-0 bg-gradient-radial from-accent via-accent to-accent/90" />
        
        {/* Animated Grid Lines */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            animation: 'grid-flow 25s linear infinite'
          }} />
        </div>

        {/* Flowing Light Lines */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-[slide-in-right_6s_ease-in-out_infinite]" />
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[slide-in-right_8s_ease-in-out_infinite_1s]" />
          <div className="absolute top-3/4 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[slide-in-right_10s_ease-in-out_infinite_2s]" />
          
          {/* Diagonal Lines */}
          <div className="absolute top-0 left-1/4 w-0.5 h-full bg-gradient-to-b from-transparent via-white/20 to-transparent animate-[fade-in_4s_ease-in-out_infinite]" />
          <div className="absolute top-0 right-1/3 w-0.5 h-full bg-gradient-to-b from-transparent via-white/15 to-transparent animate-[fade-in_5s_ease-in-out_infinite_1s]" />
        </div>

        {/* Bright Accent Glows */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s' }} />
          <div className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-white/8 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
          <div className="absolute top-2/3 right-1/2 w-32 h-32 bg-white/12 rounded-full blur-xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
        </div>

        {/* Glossy Moving Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/6 left-0 w-full h-24 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-y-12 animate-[slide-in-right_12s_ease-in-out_infinite]" />
          <div className="absolute bottom-1/6 left-0 w-full h-16 bg-gradient-to-r from-transparent via-white/3 to-transparent transform skew-y-6 animate-[slide-in-right_15s_ease-in-out_infinite_3s]" />
        </div>

        {/* Security Cards Content */}
        <div className="relative z-10 w-full max-w-xl px-8 py-12">
          <div className="space-y-5">
            {/* Card 1 - Data Protection */}
            <div className="group relative rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 ring-1 ring-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6 transition-all duration-300 hover:bg-white/15 hover:border-white/30 hover:ring-white/25 hover:shadow-[0_12px_40px_rgba(0,0,0,0.18)] animate-fade-in hover-scale" style={{ animationDelay: "0.05s" }}>
              <div className="absolute inset-0 rounded-2xl pointer-events-none bg-gradient-to-b from-white/15 via-transparent to-transparent" />
              <h3 className="text-white text-xl font-semibold tracking-tight">Deine Daten sind geschützt</h3>
              <div className="mt-3 space-y-1.5">
                <p className="text-white/80 leading-relaxed">Unsere Server sind abgesichert und befinden sich in der Europäischen Union</p>
                <p className="text-white/70 leading-relaxed">Wir befolgen die Europäische Datenschutz-Grundverordnung von 2016 (DSGVO)</p>
              </div>
            </div>

            {/* Card 2 - TLS Protocol */}
            <div className="group relative rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 ring-1 ring-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6 transition-all duration-300 hover:bg-white/15 hover:border-white/30 hover:ring-white/25 hover:shadow-[0_12px_40px_rgba(0,0,0,0.18)] animate-fade-in hover-scale" style={{ animationDelay: "0.15s" }}>
              <div className="absolute inset-0 rounded-2xl pointer-events-none bg-gradient-to-b from-white/15 via-transparent to-transparent" />
              <h3 className="text-white text-xl font-semibold tracking-tight">TLS-Protokoll</h3>
              <p className="mt-3 text-white/80 leading-relaxed">Alle Informationen und Registrierungsdaten werden verschlüsselt an unsere Server übertragen, damit niemand sie abfangen kann</p>
            </div>

            {/* Card 3 - 3D Security */}
            <div className="group relative rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 ring-1 ring-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6 transition-all duration-300 hover:bg-white/15 hover:border-white/30 hover:ring-white/25 hover:shadow-[0_12px_40px_rgba(0,0,0,0.18)] animate-fade-in hover-scale" style={{ animationDelay: "0.25s" }}>
              <div className="absolute inset-0 rounded-2xl pointer-events-none bg-gradient-to-b from-white/15 via-transparent to-transparent" />
              <h3 className="text-white text-xl font-semibold tracking-tight">3D Sicherheit</h3>
              <p className="mt-3 text-white/80 leading-relaxed">Jede Online-Bezahlung per Karte wird mit einem eindeutigen Einmalkennwort bestätigt</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;