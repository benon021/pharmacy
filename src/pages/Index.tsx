import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowRight, Settings, Plus } from "lucide-react";
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

  // Paths to generated assets
  const fluidBg = "/iridescent_fluid_bg_total_1776509940540.png";
  const sphereLogo = "/iridescent_sphere_logo_total_1776509962585.png";

  return (
    <div className="min-h-screen bg-[#070710] text-[#E0E0FF] flex flex-col font-body selection:bg-primary/30 overflow-x-hidden relative">
      {/* Immersive 3D Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-cover bg-center opacity-60 mix-blend-screen scale-110" style={{ backgroundImage: `url(${fluidBg})` }} />
      <div className="fixed inset-0 pointer-events-none -z-20 bg-gradient-to-br from-[#0B0B2F] via-[#070710] to-[#0D0D1F]" />
      
      {/* Decorative Aurora Blurs */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[160px] animate-pulse" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent/20 rounded-full blur-[160px] animate-pulse [animation-delay:4s]" />

      {/* Futuristic Navbar */}
      <nav className="h-20 lg:h-28 flex items-center justify-between px-10 md:px-20 sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate("/")}>
          <img src={sphereLogo} alt="Lumiaxy Logo" className="h-10 w-10 md:h-12 md:w-12 group-hover:scale-110 transition-transform duration-500" />
          <span className="font-heading text-2xl md:text-3xl font-bold tracking-tighter text-white uppercase translate-y-[2px]">
            Lumiaxy
          </span>
        </div>
        
        <div className="hidden lg:flex items-center gap-12 font-bold text-[10px] uppercase tracking-[0.3em] text-[#A0A0FF]/60 translate-y-[2px]">
          <a href="#about" className="hover:text-primary transition-colors hover:scale-105">About</a>
          <a href="#features" className="hover:text-primary transition-colors hover:scale-105">Features</a>
          <a href="#develop" className="hover:text-primary transition-colors hover:scale-105">Develop</a>
          <a href="#community" className="hover:text-primary transition-colors hover:scale-105">Community</a>
          <a href="#blog" className="hover:text-primary transition-colors hover:scale-105">Blog</a>
        </div>

        <div className="flex items-center gap-6 translate-y-[2px]">
          <button onClick={() => navigate("/login")} className="hidden md:block font-bold text-[10px] uppercase tracking-[0.3em] text-[#A0A0FF]/60 hover:text-white transition-colors">
            Login
          </button>
          <button 
            onClick={handleCTA}
            className="h-11 px-8 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 text-white font-bold uppercase text-[10px] tracking-[0.3em] transition-all"
          >
            Register
          </button>
          <Settings className="h-5 w-5 text-white/40 cursor-pointer hover:text-white transition-colors" />
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center">
        {/* Cinematic Hero Section */}
        <section className="min-h-[85vh] flex flex-col items-center justify-center px-6 text-center relative max-w-7xl mx-auto w-full">
           <div className="space-y-12 animate-fade-in relative z-10">
              <h1 className="text-6xl md:text-[140px] font-heading font-extrabold text-white tracking-tighter leading-[0.85] uppercase">
                Enim li <br />
                <span className="aurora-text">VIVERA JUSTO</span>
              </h1>
              
              <p className="text-lg md:text-2xl text-[#A0A0FF]/60 font-medium max-w-2xl mx-auto leading-relaxed translate-z-10">
                Nam sollicitud nunc, cursus eros <br className="hidden md:block" />
                vulputate sed. Vestibulum lobortis.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
                <button 
                  onClick={handleCTA}
                  className="h-16 px-12 rounded-full bg-primary text-white font-heading font-black uppercase text-xs tracking-[0.3em] shadow-[0_0_60px_rgba(var(--primary-rgb),0.5)] hover:bg-primary/80 transition-all hover:scale-105"
                >
                  Start Building
                </button>
                <button className="h-16 px-12 rounded-full bg-accent text-[#070710] font-heading font-black uppercase text-xs tracking-[0.3em] shadow-[0_0_60px_rgba(var(--accent-rgb),0.5)] hover:bg-accent/80 transition-all hover:scale-105">
                  Read Documentation
                </button>
              </div>
           </div>

           {/* Hero Atmospheric Visuals */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-20 pointer-events-none -z-10 overflow-hidden">
              <div className="absolute top-[20%] left-[15%] w-[400px] h-[400px] bg-primary/30 rounded-full blur-[120px] animate-pulse" />
              <div className="absolute bottom-[20%] right-[15%] w-[400px] h-[400px] bg-accent/30 rounded-full blur-[120px] animate-pulse [animation-delay:3s]" />
           </div>
        </section>

        {/* Bottom Navigation Section (Matching Reference) */}
        <section className="w-full max-w-[1800px] mx-auto px-10 md:px-20 py-20 animate-fade-in [animation-delay:0.5s]">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-white/5 pt-12 text-left">
              {[
                { title: "First Slide", desc: "Interdum et malesuada ac ante..." },
                { title: "Second Slide", desc: "Interdum et malesuada ac ante..." },
                { title: "Third Slide", desc: "Interdum et malesuada ac ante...", active: true },
              ].map((slide, i) => (
                <div key={i} className="group cursor-pointer">
                   <div className="flex items-center gap-4 mb-4">
                      {slide.active && <div className="h-3 w-3 rounded-full bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),1)]" />}
                      <h3 className={cn("text-3xl font-heading font-bold tracking-tight transition-colors", slide.active ? "text-primary" : "text-white/40 group-hover:text-white/60")}>
                        {slide.title}
                      </h3>
                   </div>
                   <p className="text-sm font-medium text-[#A0A0FF]/40 group-hover:text-[#A0A0FF]/60 transition-colors">
                     {slide.desc}
                   </p>
                </div>
              ))}
           </div>
        </section>
      </main>

      {/* Standardized Footer (Glass Style) */}
      <footer className="py-20 px-10 md:px-20 backdrop-blur-3xl border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-4">
             <img src={sphereLogo} alt="Logo" className="h-8 w-8 opacity-60" />
             <span className="font-heading text-lg font-bold text-white/60 uppercase tracking-widest">Lumiaxy Enterprise</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20">© 2026 Lumiaxy Technologies • Distributed Pharmacy Intelligence</p>
          <div className="flex items-center gap-8 text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">
             <a href="#" className="hover:text-primary transition-colors">Privacy</a>
             <a href="#" className="hover:text-primary transition-colors">Terms</a>
          </div>
      </footer>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
