import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, Lock, User, Phone, Shield, Key, CreditCard, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { hexToHsl } from "@/lib/utils";
const loginSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben"),
});

const registerSchema = z.object({
  firstName: z.string().min(2, "Vorname muss mindestens 2 Zeichen haben"),
  lastName: z.string().min(2, "Nachname muss mindestens 2 Zeichen haben"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  phone: z.string().min(1, "Telefonnummer ist erforderlich"),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben"),
  referralCode: z.string().optional(),
});

const resetPasswordSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [brandingLoading, setBrandingLoading] = useState(true);
  const [brandingLogoUrl, setBrandingLogoUrl] = useState<string | null>(null);
  const [brandingName, setBrandingName] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
      referralCode: searchParams.get('ref') || "",
    },
  });

  const resetForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Load branding by domain before showing auth page
  useEffect(() => {
    const loadBrandingByDomain = async () => {
      try {
        const hostname = window.location.hostname;
        
        // Fallback for Lovable preview domains and localhost - use default pink
        if (hostname.includes('lovable.app') || hostname.includes('localhost')) {
          setBrandingLoading(false);
          return;
        }
        
        // Remove subdomain prefixes for main domain matching
        const cleanedHostname = hostname.replace(/^(www\.|web\.)/, '');
        
        // Fetch all brandings (public read access via RLS)
        const { data: brandings } = await supabase
          .from('brandings')
          .select('id, domain, accent_color, logo_path, name');
        
        if (brandings) {
          for (const branding of brandings) {
            if (branding.domain) {
              const brandingDomain = branding.domain
                .replace(/^https?:\/\//, '')
                .replace(/\/$/, '')
                .replace(/^(www\.|web\.)/, '');
              
              // Check if domains match (including subdomains)
              if (cleanedHostname.includes(brandingDomain) || 
                  brandingDomain.includes(cleanedHostname)) {
                
                // Set branding color
                if (branding.accent_color) {
                  const hslValue = hexToHsl(branding.accent_color);
                  document.documentElement.style.setProperty('--primary', hslValue);
                  document.documentElement.style.setProperty('--accent', hslValue);
                  document.documentElement.style.setProperty('--ring', hslValue);
                }
                
                // Set branding logo
                if (branding.logo_path) {
                  const { data: logoData } = supabase.storage
                    .from('branding-logos')
                    .getPublicUrl(branding.logo_path);
                  setBrandingLogoUrl(logoData.publicUrl);
                }
                
                // Set branding name
                if (branding.name) {
                  setBrandingName(branding.name);
                }
                
                break;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading branding:', error);
      } finally {
        setBrandingLoading(false);
      }
    };
    
    loadBrandingByDomain();
  }, []);

  // Auth state listener for automatic login after registration
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setTimeout(() => {
            redirectBasedOnRole(session.user.id);
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        redirectBasedOnRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-switch to registration mode when ref parameter is present
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setIsLogin(false);
    }
  }, [searchParams]);

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
      // Validate referral code if provided
      if (values.referralCode) {
        const { data: referrerProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', values.referralCode)
          .single();

        if (!referrerProfile) {
          toast({
            title: "Ungültiger Referral-Code",
            description: "Der eingegebene Referral-Code existiert nicht.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      // Get branding based on current domain
      const hostname = window.location.hostname;
      const cleanedHostname = hostname.replace(/^(www\.|web\.)/, '');
      
      const { data: brandings } = await supabase
        .from('brandings')
        .select('id, domain');
      
      let brandingId: string | null = null;
      if (brandings) {
        for (const branding of brandings) {
          if (branding.domain) {
            const brandingDomain = branding.domain.replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/^(www\.|web\.)/, '');
            if (cleanedHostname.includes(brandingDomain) || brandingDomain.includes(cleanedHostname)) {
              brandingId = branding.id;
              break;
            }
          }
        }
      }

      // Get default consultant
      const { data: defaultConsultant } = await supabase
        .from('consultants')
        .select('id')
        .eq('is_default', true)
        .maybeSingle();

      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: values.firstName,
            last_name: values.lastName,
            phone: values.phone,
            referral_code: values.referralCode || null,
            branding_id: brandingId,
            consultant_id: defaultConsultant?.id || null,
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

      if (data.session) {
        // Session vorhanden = sofort eingeloggt (E-Mail-Bestätigung deaktiviert)
        toast({
          title: "Registrierung erfolgreich",
          description: "Willkommen! Du wirst jetzt weitergeleitet.",
        });
        
        // Send Telegram notification for new user (fire and forget)
        supabase.functions.invoke('send-telegram-notification', {
          body: {
            event_type: 'new_user',
            data: {
              email: values.email,
              name: `${values.firstName} ${values.lastName}`,
            }
          }
        }).catch(err => console.log('Telegram notification error:', err));
        
        await redirectBasedOnRole(data.user!.id);
      } else if (data.user) {
        // Keine Session = E-Mail-Bestätigung erforderlich
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

  // Show loading spinner while branding is being loaded
  if (brandingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Auth Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-6">
            <div>
              {brandingLogoUrl ? (
                <img 
                  src={brandingLogoUrl} 
                  alt={brandingName || "Logo"} 
                  className="h-10 object-contain mb-2" 
                />
              ) : (
                <h1 className="text-2xl font-bold text-primary mb-2">Panel</h1>
              )}
              <h2 className="text-3xl font-bold text-text-headline mb-2">
                {isResetPassword ? "Passwort zurücksetzen" : isLogin ? "Anmeldung im Dashboard" : "Registrierung im Dashboard"}
              </h2>
              <p className="text-text-hero">
                {isResetPassword ? "Geben Sie Ihre E-Mail-Adresse ein" : isLogin ? "Melde dich an, um auf dein Trading-Dashboard zuzugreifen" : "Erstelle einen Account für dein Trading-Dashboard"}
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
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <FormControl>
                            <Input 
                              type="email"
                              autoComplete="email"
                              placeholder="E-Mail-Adresse" 
                              className="pl-10" 
                              {...field} 
                            />
                          </FormControl>
                        </div>
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
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <FormControl>
                            <Input 
                              type="email"
                              autoComplete="email"
                              placeholder="E-Mail-Adresse" 
                              className="pl-10" 
                              {...field} 
                            />
                          </FormControl>
                        </div>
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
                  {/* Plain email field to avoid Slot/Controller issues */}
                  <div className="space-y-2">
                    <label htmlFor="register-email" className="text-sm font-medium leading-none">
                      E-Mail
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="register-email"
                        type="email"
                        autoComplete="email"
                        placeholder="E-Mail-Adresse"
                        className="pl-10"
                        {...registerForm.register("email")}
                      />
                    </div>
                    {registerForm.formState.errors.email && (
                      <p className="text-sm font-medium text-destructive">
                        {registerForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <FormField
                    control={registerForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefonnummer</FormLabel>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <FormControl>
                            <Input 
                              type="tel"
                              inputMode="tel"
                              autoComplete="tel"
                              placeholder="Telefonnummer" 
                              className="pl-10" 
                              {...field} 
                            />
                          </FormControl>
                        </div>
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
                  <FormField
                    control={registerForm.control}
                    name="referralCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referral-Code (Optional)</FormLabel>
                        <div className="relative">
                          <Gift className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <FormControl>
                            <Input 
                              type="text"
                              placeholder="Referral-Code von einem Freund" 
                              className="pl-10" 
                              {...field} 
                            />
                          </FormControl>
                        </div>
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
            {/* Card 1 - KI Trading */}
            <div className="group relative rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 ring-1 ring-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6 transition-all duration-300 hover:bg-white/15 hover:border-white/30 hover:ring-white/25 hover:shadow-[0_12px_40px_rgba(0,0,0,0.18)] animate-fade-in hover-scale" style={{ animationDelay: "0.05s" }}>
              <div className="absolute inset-0 rounded-2xl pointer-events-none bg-gradient-to-b from-white/15 via-transparent to-transparent" />
              <h3 className="text-white text-xl font-semibold tracking-tight">Intelligentes Krypto-Trading</h3>
              <div className="mt-3 space-y-1.5">
                <p className="text-white/80 leading-relaxed">Unser KI-Trading-Bot analysiert Marktdaten in Echtzeit und trifft automatisierte Handelsentscheidungen basierend auf fortschrittlichen Algorithmen.</p>
                <p className="text-white/70 leading-relaxed">24/7 aktiv – selbst wenn du schläfst, arbeitet die KI für dich.</p>
              </div>
            </div>

            {/* Card 2 - Datensicherheit */}
            <div className="group relative rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 ring-1 ring-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6 transition-all duration-300 hover:bg-white/15 hover:border-white/30 hover:ring-white/25 hover:shadow-[0_12px_40px_rgba(0,0,0,0.18)] animate-fade-in hover-scale" style={{ animationDelay: "0.15s" }}>
              <div className="absolute inset-0 rounded-2xl pointer-events-none bg-gradient-to-b from-white/15 via-transparent to-transparent" />
              <h3 className="text-white text-xl font-semibold tracking-tight">Maximale Datensicherheit</h3>
              <div className="mt-3 space-y-1.5">
                <p className="text-white/80 leading-relaxed">Deine persönlichen Daten sind durch modernste Verschlüsselung (TLS 1.3) geschützt und werden auf EU-Servern nach DSGVO-Standards gespeichert.</p>
                <p className="text-white/70 leading-relaxed">Wir geben deine Daten niemals an Dritte weiter.</p>
              </div>
            </div>

            {/* Card 3 - Kontrolle */}
            <div className="group relative rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 ring-1 ring-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6 transition-all duration-300 hover:bg-white/15 hover:border-white/30 hover:ring-white/25 hover:shadow-[0_12px_40px_rgba(0,0,0,0.18)] animate-fade-in hover-scale" style={{ animationDelay: "0.25s" }}>
              <div className="absolute inset-0 rounded-2xl pointer-events-none bg-gradient-to-b from-white/15 via-transparent to-transparent" />
              <h3 className="text-white text-xl font-semibold tracking-tight">Volle Kontrolle über dein Portfolio</h3>
              <div className="mt-3 space-y-1.5">
                <p className="text-white/80 leading-relaxed">Behalte jederzeit den Überblick über deine Trades, Performance und Statistiken in deinem persönlichen Dashboard.</p>
                <p className="text-white/70 leading-relaxed">Du entscheidest – starte, pausiere oder stoppe Trading-Bots nach Belieben.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;