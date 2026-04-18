import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Activity, ShieldCheck, ShoppingCart, Pill, ArrowRight, 
  BarChart3, Users, CheckCircle2, Network, Globe, 
  Lock, Sparkles, Zap, Building2, PackageCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCTA = () => {
    if (user) {
      if (user.role === "super_admin") navigate("/super-admin");
      else if (user.role === "admin") navigate("/admin");
      else navigate("/seller");
    } else {
      navigate("/login");
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-[#07070a] text-foreground flex flex-col font-body selection:bg-primary/20 overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse [animation-delay:1.5s]" />
      </div>

      {/* Navbar */}
      <nav className="h-24 border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="h-11 w-11 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-blue-600 p-[1px]">
            <div className="h-full w-full rounded-[15px] bg-black flex items-center justify-center group-hover:bg-transparent transition-colors">
              <Activity className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
            </div>
          </div>
          <span className="font-black text-2xl tracking-tighter text-white uppercase italic">
            Lumiaxy<span className="text-primary not-italic">.</span>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md ml-2 not-italic font-bold tracking-widest border border-primary/20">SaaS</span>
          </span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 font-bold text-[11px] uppercase tracking-[0.2em] text-muted-foreground mr-12">
          <a href="#features" className="hover:text-primary transition-colors">Features</a>
          <a href="#governance" className="hover:text-primary transition-colors">Security</a>
          <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={handleCTA}
            className="h-12 rounded-2xl px-8 font-black uppercase text-[10px] tracking-widest bg-primary hover:bg-white hover:text-black shadow-[0_8px_32px_rgba(var(--primary-rgb),0.3)] transition-all"
          >
            {user ? "Dashboard" : "Get Started"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="min-h-[90vh] flex flex-col items-center justify-center px-6 pt-24 pb-32 text-center relative max-w-7xl">
          {/* Hero Content */}
          <div className="relative z-10 flex flex-col items-center text-center space-y-10 max-w-5xl mx-auto px-6">
            <div className="inline-flex items-center gap-2.5 px-6 py-2 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md animate-in slide-in-from-top duration-1000">
               <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Enterprise Retail Solutions</span>
            </div>
            
            <div className="space-y-6">
               <h1 className="text-7xl md:text-9xl font-black text-white tracking-tighter leading-[0.85] italic uppercase animate-in zoom-in-95 duration-1000">
                  Lumiaxy <br /> 
                  <span className="text-primary underline decoration-primary/20 underline-offset-[12px]">Enterprise</span>
               </h1>
               <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom duration-1000 delay-300">
                  The unified platform for scaling pharmacy networks. Manage inventory, sales, and branches in one clean interface.
               </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 pt-6 animate-in fade-in slide-in-from-bottom duration-1000 delay-500">
              <Button 
                onClick={handleCTA}
                className="h-20 px-12 rounded-[2rem] bg-primary text-black font-black uppercase text-xs tracking-[0.3em] shadow-[0_20px_60px_rgba(var(--primary-rgb),0.3)] hover:scale-105 transition-all group"
              >
                {user ? "Go to Dashboard" : "Get Started Now"}
                <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-2 transition-transform" />
              </Button>
              <Button variant="ghost" className="h-20 px-10 rounded-[2rem] border border-white/10 text-white font-black uppercase text-xs tracking-[0.3em] hover:bg-white/5">
                Contact Sales
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mx-auto px-6 pt-20">
            {[
              { title: "Unified Management", desc: "Control all branches from a single dashboard with real-time sync.", icon: Zap },
              { title: "Smart Inventory", desc: "Automated stock alerts and expiry tracking to minimize waste.", icon: Pill },
              { title: "Scalable Solutions", desc: "Grow from a single store to a nationwide network seamlessly.", icon: Activity }
            ].map((feature, i) => (
               <div key={i} className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 flex flex-col items-center gap-3 backdrop-blur-sm hover:bg-white/[0.05] transition-colors cursor-default group">
                 <feature.icon className="h-5 w-5 text-primary/60 group-hover:text-primary transition-colors" />
                 <div>
                   <div className="text-white font-bold text-xs">{feature.title}</div>
                   <div className="text-[9px] text-muted-foreground mt-2 leading-relaxed">{feature.desc}</div>
                 </div>
               </div>
             ))}
          </div>
        </section>

        {/* Multi-Branch Management Section */}
        <section id="features" className="w-full py-40 px-6 bg-gradient-to-b from-transparent to-primary/[0.02] border-y border-white/5 relative">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 font-black text-[9px] uppercase tracking-widest border border-blue-500/20">
                <Building2 className="h-3 w-3" />
                Network Management
              </div>
              <h2 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tighter">
                Control Fifty Branches <br />
                <span className="text-primary italic">From One Screen.</span>
              </h2>
              <p className="text-muted-foreground text-xl leading-relaxed">
                Lumiaxy's core system allows platform owners to launch managed environments for every pharmacy branch instantly. Monitor performance, manage subscriptions, and push updates across your entire network with ease.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8">
                {[
                  { icon: Zap, t: "Instant Branch Setup", d: "Launch new pharmacy branches in seconds with complete data isolation." },
                  { icon: Activity, t: "Performance Tracking", d: "Monitor inventory, stock, and sales velocity across all branches." },
                ].map((item, i) => (
                  <div key={i} className="space-y-3">
                    <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/10">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h4 className="text-white font-bold">{item.t}</h4>
                    <p className="text-sm text-muted-foreground leading-snug">{item.d}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <div className="relative rounded-3xl border border-white/10 bg-black shadow-2xl overflow-hidden aspect-square flex items-center justify-center">
                 <div className="grid grid-cols-3 gap-6 p-12 w-full h-full opacity-40 group-hover:opacity-100 transition-opacity duration-1000">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center gap-2 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                        <Building2 className="h-8 w-8 text-primary/40" />
                        <div className="h-1.5 w-12 bg-white/5 rounded-full" />
                      </div>
                    ))}
                 </div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-32 w-32 rounded-[2.5rem] bg-primary flex items-center justify-center shadow-[0_0_80px_rgba(var(--primary-rgb),0.5)] border-4 border-black group-hover:scale-110 transition-transform duration-500">
                      <Activity className="h-14 w-14 text-white font-black" />
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing/SaaS Section */}
        <section id="pricing" className="py-40 px-6 w-full max-w-7xl">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter">Enterprise Pricing</h2>
            <p className="text-muted-foreground text-xl">Flexible plans designed for the modern pharmaceutical landscape.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Standard Branch */}
            <div className="group premium-card !p-12 relative flex flex-col items-start border-white/5! hover:border-primary/40! transition-all duration-500">
              <div className="absolute top-0 right-12 h-1 w-20 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-primary mb-8 border border-white/10">
                <Building2 size={24} />
              </div>
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Standard Branch</h3>
              <p className="text-muted-foreground text-sm font-medium mb-10 leading-relaxed">Single pharmacy unit with full POS and inventory automation.</p>
              
              <div className="mb-12">
                <span className="text-5xl font-black text-white italic tracking-widest">KSh 3k</span>
                <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest ml-2">/ month</span>
              </div>

              <div className="space-y-5 mb-12 flex-1">
                {["5 Authorized Staff", "Unlimited Drug Catalog", "M-Pesa Integration", "Daily Sales Reports"].map((f, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {f}
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full h-14 rounded-2xl border-white/10 font-black uppercase tracking-widest text-[10px] hover:bg-primary hover:text-white transition-all" onClick={handleCTA}>
                Start Branch
              </Button>
            </div>

            {/* Enterprise Network */}
            <div className="group premium-card !p-12 relative flex flex-col items-start border-primary/40! bg-primary/[0.02] shadow-[0_0_100px_rgba(var(--primary-rgb),0.1)] lg:scale-105 z-10 transition-all duration-500">
              <div className="absolute top-0 right-10 bg-primary text-black font-black uppercase text-[9px] tracking-[0.3em] px-4 py-1.5 rounded-b-xl">Scale Favorite</div>
              <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-black mb-8 shadow-xl shadow-primary/20">
                <Network size={24} />
              </div>
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Enterprise Network</h3>
              <p className="text-muted-foreground text-sm font-medium mb-10 leading-relaxed">The ultimate solution for chains managing 10 to 50+ branches.</p>
              
              <div className="mb-12">
                <span className="text-5xl font-black text-primary italic tracking-widest">Custom</span>
                <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest ml-2">Quote</span>
              </div>

              <div className="space-y-5 mb-12 flex-1">
                {["Unlimited Branches", "Global Administration Panel", "Subscription Control", "Advanced Business Analytics", "Priority Support"].map((f, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs font-black text-white">
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                    {f}
                  </div>
                ))}
              </div>

              <Button className="w-full h-14 rounded-2xl bg-primary font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/30" onClick={handleCTA}>
                Contact Super Admin
              </Button>
            </div>

            {/* Life Plan */}
            <div className="group premium-card !p-12 relative flex flex-col items-start border-white/5! hover:border-blue-500/40! transition-all duration-500">
              <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-blue-500 mb-8 border border-white/10">
                <Globe size={24} />
              </div>
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Perpetual License</h3>
              <p className="text-muted-foreground text-sm font-medium mb-10 leading-relaxed">Full ownership of the platform core with optional on-premise hosting.</p>
              
              <div className="mb-12">
                <span className="text-5xl font-black text-white italic tracking-widest">KSh 99k</span>
                <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest ml-2">/ per node</span>
              </div>

              <div className="space-y-5 mb-12 flex-1">
                {["Forever System Updates", "On-Premise Deployment", "Custom Branding", "Hardware Integration Support"].map((f, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                    {f}
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full h-14 rounded-2xl border-white/10 font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 hover:text-white transition-all" onClick={handleCTA}>
                Request On-Premise
              </Button>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="py-60 text-center relative w-full overflow-hidden">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl aspect-video bg-primary/20 blur-[180px] rounded-full -z-10" />
           <h2 className="text-6xl md:text-9xl font-black text-white tracking-tighter mb-12 italic uppercase leading-[0.8]">
              Ready to <br />
              <span className="not-italic text-primary">Unify?</span>
           </h2>
           <Button
              size="lg"
              onClick={handleCTA}
              className="h-20 rounded-[2rem] px-20 text-lg font-black uppercase tracking-[0.3em] bg-white text-black hover:bg-primary hover:text-white transition-all shadow-[0_32px_96px_rgba(255,255,255,0.1)]"
            >
              System Initialization
              <ArrowRight className="ml-4 h-6 w-6" />
           </Button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-12 bg-black flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 text-primary border border-white/10">
                <Activity size={14} />
             </div>
             <span className="font-black text-sm text-white uppercase italic tracking-widest">Lumiaxy OS</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">© 2026 Lumiaxy Technologies • Kenya's Leading Pharmacy Management Platform</p>
          <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
             <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
             <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          </div>
      </footer>
    </div>
  );
}
