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
      <div className="relative bg-gradient-subtle p-8 lg:flex items-center justify-center hidden overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 rounded-full bg-accent/5 blur-xl"></div>
        <div className="absolute bottom-32 left-16 w-24 h-24 rounded-full bg-accent/3 blur-lg"></div>
        <div className="absolute top-1/2 right-1/4 w-2 h-16 bg-accent/10 rounded-full rotate-12"></div>
        
        <div className="relative z-10 space-y-8 max-w-lg">
          <div className="space-y-6">
            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 border border-accent/10 hover:border-accent/20 transition-all duration-300">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Deine Daten sind geschützt</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Unsere Server sind abgesichert und befinden sich in der Europäischen Union. 
                    Wir befolgen die Europäische Datenschutz-Grundverordnung von 2016 (DSGVO).
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 border border-accent/10 hover:border-accent/20 transition-all duration-300">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Key className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">TLS-Protokoll</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Alle Informationen und Registrierungsdaten werden verschlüsselt an unsere Server übertragen, 
                    damit niemand sie abfangen kann.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 border border-accent/10 hover:border-accent/20 transition-all duration-300">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">3D Sicherheit</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Jede Online-Bezahlung per Karte wird mit einem eindeutigen Einmalkennwort bestätigt.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="50" stroke="currentColor" strokeWidth="2" className="animate-pulse" />
            <circle cx="300" cy="150" r="30" stroke="currentColor" strokeWidth="2" className="animate-pulse" style={{ animationDelay: "1s" }} />
            <circle cx="200" cy="300" r="40" stroke="currentColor" strokeWidth="2" className="animate-pulse" style={{ animationDelay: "2s" }} />
            <path d="M50 200 Q 200 100 350 200" stroke="currentColor" strokeWidth="2" className="animate-pulse" style={{ animationDelay: "0.5s" }} />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Auth;