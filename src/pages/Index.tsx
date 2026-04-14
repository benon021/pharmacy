import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Activity, ShieldCheck, ShoppingCart, Pill, ArrowRight, BarChart3, Users, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCTA = () => {
    if (user) {
      if (user.role === "admin") navigate("/admin");
      else navigate("/seller");
    } else {
      navigate("/login");
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-body selection:bg-primary/20">
      {/* Navbar */}
      <nav className="h-20 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Activity className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-foreground uppercase">
            Lumiaxy<span className="text-primary font-black">.</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={handleCTA}
            className="rounded-xl px-6 font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
          >
            {user ? "Enter Dashboard" : "Sign In"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-32 text-center relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse duration-[3000ms]" />

        <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm mb-8 border border-primary/20 opacity-0 transition-all duration-700 delay-100", mounted && "opacity-100 translate-y-0 -translate-y-4")}>
          <ShieldCheck className="h-4 w-4" />
          Lumiaxy Enterprise Pharmacy OS
        </div>

        <h1 className={cn("text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mb-8 leading-tight opacity-0 transition-all duration-1000 delay-200", mounted && "opacity-100 translate-y-0 -translate-y-4")}>
          Master your entire medical <br className="hidden md:block" />
          retail <span className="text-primary">Ecosystem</span>.
        </h1>

        <p className={cn("text-muted-foreground text-lg md:text-xl max-w-2xl mb-12 opacity-0 transition-all duration-1000 delay-300", mounted && "opacity-100 translate-y-0 -translate-y-4")}>
          Seamless inventory analytics, intelligent POS distribution, and absolute control over your pharmacy's operations powered by Lumiaxy's intelligent core.
        </p>

        <div className={cn("flex flex-col sm:flex-row items-center gap-4 opacity-0 transition-all duration-1000 delay-500", mounted && "opacity-100 translate-y-0 -translate-y-4")}>
          <Button
            size="lg"
            onClick={handleCTA}
            className="rounded-2xl px-8 h-14 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto"
          >
            {user ? "Launch Dashboard" : "Start Your Free Trial"}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 max-w-6xl w-full text-left">
          {[
            {
              icon: ShoppingCart,
              title: "Intelligent POS",
              desc: "Lightning fast checkout systems synchronized seamlessly with local inventory."
            },
            {
              icon: BarChart3,
              title: "Data Analytics",
              desc: "Deep insights into sales velocity, expiry tracking, and operational overhead."
            },
            {
              icon: Users,
              title: "Branch Mapping",
              desc: "Assign roles and track performance across multiple administrative channels."
            }
          ].map((feature, i) => (
            <div
              key={i}
              className={cn(
                "bg-card border border-border rounded-3xl p-8 hover:-translate-y-2 transition-all duration-500 shadow-xl shadow-black/5 dark:shadow-none hover:border-primary/30 opacity-0 relative overflow-hidden group",
                mounted && "opacity-100 translate-y-0"
              )}
              style={{ transitionDelay: `${700 + (i * 150)}ms` }}
            >
              <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-primary/20 transition-colors duration-500" />
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 relative z-10">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 relative z-10">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed relative z-10">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Pricing Section */}
        <div className={cn("mt-48 w-full max-w-6xl opacity-0 transition-all duration-1000 delay-[1200ms]", mounted && "opacity-100")}>
          <h2 className="text-3xl font-extrabold mb-12 text-center tracking-tight">Flexible Pricing Plans</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Daily */}
            <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group hover:-translate-y-2 transition-all duration-300">
              <h3 className="text-xl font-bold mb-2">Daily License</h3>
              <p className="text-muted-foreground text-sm mb-6">Agile short-term access.</p>
              <div className="mb-8">
                <span className="text-3xl font-extrabold">KSh 150</span>
                <span className="text-muted-foreground text-sm">/day</span>
              </div>
              <div className="space-y-3 mb-8">
                {["Full POS Access", "Daily Reports Generaton", "24hr Live Sync"].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full rounded-xl" onClick={handleCTA}>Start Daily</Button>
            </div>

            {/* Monthly */}
            <div className="bg-card border-2 border-primary rounded-[2.5rem] p-8 shadow-2xl shadow-primary/10 relative overflow-hidden group hover:-translate-y-2 transition-all duration-300 lg:scale-105 z-10">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
              <div className="absolute top-4 right-6 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Most Popular</div>
              <h3 className="text-xl font-bold mb-2">Monthly Pro</h3>
              <p className="text-muted-foreground text-sm mb-6">For growing pharmacies.</p>
              <div className="mb-8">
                <span className="text-3xl font-extrabold text-primary">KSh 3k</span>
                <span className="text-muted-foreground text-sm">/mo</span>
              </div>
              <div className="space-y-3 mb-8">
                {["Unlimited POS Terminals", "Advanced Health Tracking", "Financial Intelligence", "Staff Management"].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4 text-primary w-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full rounded-xl shadow-lg shadow-primary/20" onClick={handleCTA}>Subscribe</Button>
            </div>

            {/* 6 Months */}
            <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group hover:-translate-y-2 transition-all duration-300">
              <h3 className="text-xl font-bold mb-2">Half-Year</h3>
              <p className="text-muted-foreground text-sm mb-6">Commit for six months.</p>
              <div className="mb-8">
                <span className="text-3xl font-extrabold">KSh 11k</span>
                <span className="text-muted-foreground text-sm">/6mo</span>
              </div>
              <div className="space-y-3 mb-8">
                {["Discounted Bulk Rate", "Priority Remote Support", "Automated Backups", "All Pro Features"].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full rounded-xl" onClick={handleCTA}>Get Half-Year</Button>
            </div>

            {/* Lifetime */}
            <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group hover:-translate-y-2 transition-all duration-300">
              <h3 className="text-xl font-bold mb-2">Full Purchase</h3>
              <p className="text-muted-foreground text-sm mb-6">Lifetime enterprise OS.</p>
              <div className="mb-8">
                <span className="text-3xl font-extrabold">KSh 19.9k</span>
                <span className="text-muted-foreground text-sm">/once</span>
              </div>
              <div className="space-y-3 mb-8">
                {["Perpetual System License", "Priority Installation", "Free Minor Updates", "On-Premises Option"].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full rounded-xl" onClick={handleCTA}>Buy Lifetime</Button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
