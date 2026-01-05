import { Users, Star, TrendingUp, Smartphone, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[image:var(--gradient-glow)]" />
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[90vh] py-16">
          {/* Left side - Text content */}
          <div className="space-y-8">
            {/* Main heading - Finary style */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
              <span className="text-foreground">Suivre. Optimiser.</span>
              <br />
              <span className="text-gradient">Gérer.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
              Admin est l'application qui vous aide à mieux gérer votre argent. 
              Suivez tout votre patrimoine, gérez votre budget, optimisez vos 
              investissements et passez à l'action.
            </p>

            {/* CTA Button */}
            <div>
              <Link to="/signup">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg rounded-xl shadow-[var(--shadow-gold)] hover:shadow-[0_10px_60px_-10px_hsl(38_90%_55%_/_0.4)] transition-all duration-300"
                >
                  Démarrer gratuitement
                </Button>
              </Link>
            </div>

            {/* Stats cards - Finary style */}
            <div className="flex flex-wrap gap-4 pt-8">
              <div className="glass rounded-xl px-6 py-4 flex items-center gap-3 hover:border-primary/30 transition-colors">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">+ de 800 000</div>
                  <div className="text-xs text-muted-foreground">utilisateurs</div>
                </div>
              </div>
              
              <div className="glass rounded-xl px-6 py-4 flex items-center gap-3 hover:border-primary/30 transition-colors">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Noté 4.7/5</div>
                  <div className="text-xs text-muted-foreground">+ de 10 000 avis</div>
                </div>
              </div>
              
              <div className="glass rounded-xl px-6 py-4 flex items-center gap-3 hover:border-primary/30 transition-colors">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">150 Mds CHF</div>
                  <div className="text-xs text-muted-foreground">suivis</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - App mockups */}
          <div className="relative hidden lg:block">
            {/* Phone mockup */}
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 z-20">
              <div className="relative">
                {/* Phone frame */}
                <div className="w-[280px] h-[580px] bg-card rounded-[3rem] border-4 border-border/50 shadow-2xl overflow-hidden">
                  {/* Phone content */}
                  <div className="p-6 h-full flex flex-col">
                    {/* Status bar */}
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-xs text-muted-foreground">9:41</span>
                      <div className="flex gap-1">
                        <div className="w-4 h-2 bg-foreground/50 rounded-sm"></div>
                        <div className="w-4 h-2 bg-foreground rounded-sm"></div>
                      </div>
                    </div>
                    
                    {/* App header */}
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Smartphone className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-muted-foreground/50"></div>
                      </div>
                    </div>

                    {/* Balance */}
                    <div className="text-center mb-8">
                      <div className="text-4xl font-bold text-foreground mb-2">423 817 €</div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xs text-muted-foreground">Last 7 days</span>
                        <span className="text-xs text-green-500 font-medium">+8 025€</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">+1.93%</span>
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 mb-6">
                      <button className="text-sm font-medium text-foreground border-b-2 border-primary pb-1">Total</button>
                      <button className="text-sm text-muted-foreground pb-1">Net</button>
                      <button className="text-sm text-muted-foreground pb-1">Financial</button>
                    </div>

                    {/* Movers section */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-foreground">My Movers</span>
                        <button className="text-xs text-primary">Filter →</button>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                              <span className="text-xs font-bold text-blue-400">AM</span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-foreground">Amundi MSCI World...</div>
                              <div className="text-xs text-muted-foreground">62 897€</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                              <span className="text-xs font-bold text-purple-400">Ξ</span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-foreground">Ethereum</div>
                              <div className="text-xs text-muted-foreground">18 230€</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Phone glow */}
                <div className="absolute -inset-4 bg-primary/10 rounded-[4rem] blur-2xl -z-10"></div>
              </div>
            </div>

            {/* Desktop mockup - behind */}
            <div className="absolute top-1/2 right-0 -translate-y-1/2 z-10">
              <div className="relative">
                {/* Desktop frame */}
                <div className="w-[450px] h-[320px] bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden">
                  {/* Desktop content */}
                  <div className="p-6 h-full">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
                          <Monitor className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-xs font-semibold text-primary">admin</span>
                      </div>
                      <div className="flex-1 h-8 bg-muted rounded-lg"></div>
                    </div>

                    {/* Sidebar + Content */}
                    <div className="flex gap-4 h-[calc(100%-60px)]">
                      {/* Sidebar */}
                      <div className="w-32 space-y-2">
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10">
                          <div className="w-4 h-4 rounded bg-primary/30"></div>
                          <span className="text-xs text-primary font-medium">Synthèse</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-lg">
                          <div className="w-4 h-4 rounded bg-muted"></div>
                          <span className="text-xs text-muted-foreground">Portfolio</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-lg">
                          <div className="w-4 h-4 rounded bg-muted"></div>
                          <span className="text-xs text-muted-foreground">Insights</span>
                        </div>
                      </div>

                      {/* Main content */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-muted-foreground">Patrimoine brut</div>
                            <div className="text-2xl font-bold text-foreground">423 817 €</div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-green-500">+9 955€</span>
                              <span className="text-xs text-green-500">+1.93%</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Chart placeholder */}
                        <div className="h-20 relative">
                          <svg className="w-full h-full" viewBox="0 0 200 60">
                            <path 
                              d="M0,50 Q20,45 40,40 T80,35 T120,25 T160,30 T200,20" 
                              fill="none" 
                              stroke="hsl(38 90% 55%)" 
                              strokeWidth="2"
                            />
                            <path 
                              d="M0,50 Q20,45 40,40 T80,35 T120,25 T160,30 T200,20 L200,60 L0,60 Z" 
                              fill="url(#chartGradient)" 
                              opacity="0.3"
                            />
                            <defs>
                              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="hsl(38 90% 55%)" />
                                <stop offset="100%" stopColor="transparent" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Desktop glow */}
                <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-2xl -z-10"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Press logos - Finary style */}
      <div className="absolute bottom-0 left-0 right-0 py-8 border-t border-border/30 bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-8 md:gap-16 opacity-40 grayscale hover:opacity-60 hover:grayscale-0 transition-all duration-500 flex-wrap">
            <span className="text-xl font-serif italic text-foreground">Le Monde</span>
            <span className="text-xl font-serif text-foreground">Le Parisien</span>
            <span className="text-xl font-bold tracking-wide text-foreground">LE FIGARO</span>
            <span className="text-xl font-serif italic text-foreground">Les Echos</span>
            <span className="text-xl font-bold text-foreground">RTS</span>
            <span className="text-xl font-semibold text-foreground">L'EXPRESS</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
