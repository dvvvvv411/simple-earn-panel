import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-money-panel.jpg";

const Index = () => {
  return (
    <main className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-text-headline leading-tight">
                Dein <span className="bg-gradient-hero bg-clip-text text-transparent">Geld Panel</span>
              </h1>
              <p className="text-xl lg:text-2xl text-text-hero leading-relaxed">
                Das intelligente Dashboard, um deine Einnahmen zu maximieren und Geld zu generieren.
              </p>
            </div>
            
            <div className="space-y-4">
              <p className="text-lg text-text-hero">
                Entdecke innovative Wege, um passives Einkommen aufzubauen und deine finanzielle Zukunft zu sichern.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button variant="hero" size="lg" className="text-lg px-8 py-4" onClick={() => window.location.href = '/auth'}>
                Jetzt starten
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                Mehr erfahren
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl shadow-glow">
              <img 
                src={heroImage} 
                alt="Geld Panel Dashboard zur Einkommensoptimierung"
                className="w-full h-auto object-cover"
              />
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-primary text-white px-4 py-2 rounded-xl shadow-lg text-sm font-semibold">
              💰 Geld generieren
            </div>
            <div className="absolute -bottom-4 -left-4 bg-accent text-white px-4 py-2 rounded-xl shadow-lg text-sm font-semibold">
              📈 Wachstum
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;