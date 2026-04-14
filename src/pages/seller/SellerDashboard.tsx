import { useEffect, useState } from "react";
import { localDb } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, DollarSign, TrendingUp, Package, Zap, ChevronRight, Activity, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

import EntityIntelligenceModal from "@/components/EntityIntelligenceModal";

export default function SellerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalSales: 0, totalRevenue: 0, todaySales: 0, todayRevenue: 0 });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [intelOpen, setIntelOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const allDetailed = localDb.sales.getDetailed();
    const sellerSales = allDetailed.filter(s => s.seller_id === user.id);
    const today = new Date().toISOString().split("T")[0];
    const todaySales = sellerSales.filter(s => s.created_at.startsWith(today));

    setStats({
      totalSales: sellerSales.length,
      totalRevenue: sellerSales.reduce((s, sale) => s + Number(sale.total_amount), 0),
      todaySales: todaySales.length,
      todayRevenue: todaySales.reduce((s, sale) => s + Number(sale.total_amount), 0),
    });
    setRecentSales(sellerSales.slice(0, 5));
  }, [user]);

  const cards = [
    { 
      label: "Today's Volume", 
      value: stats.todaySales, 
      desc: "transactions",
      icon: ShoppingCart, 
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20"
    },
    { 
      label: "Daily Revenue", 
      value: `KES ${stats.todayRevenue.toLocaleString()}`, 
      desc: "collected today",
      icon: DollarSign, 
      color: "text-green-500",
      bg: "bg-green-500/10 border-green-500/20"
    },
    { 
      label: "Session Load", 
      value: stats.totalSales, 
      desc: "lifetime sales",
      icon: TrendingUp, 
      color: "text-accent",
      bg: "bg-accent/10 border-accent/20"
    },
    { 
      label: "Gross Yield", 
      value: `KES ${stats.totalRevenue.toLocaleString()}`, 
      desc: "total volume",
      icon: Package, 
      color: "text-blue-500",
      bg: "bg-blue-500/10 border-blue-500/20"
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in relative">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.4em] italic mb-2">
                <Activity className="h-4 w-4" /> Real-time Terminal Operations
            </div>
            <Button 
                variant="outline" 
                onClick={() => setIntelOpen(true)}
                className="h-10 rounded-xl px-4 flex items-center gap-2 font-black uppercase tracking-widest text-[9px] border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all shadow-lg shadow-primary/5 italic"
            >
                <TrendingUp className="h-3.5 w-3.5" />
                Terminal Intelligence Matrix
            </Button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent italic">
              Seller <span className="text-primary not-italic">Terminal</span>
            </h1>
            <p className="text-muted-foreground font-medium text-sm">Monitoring individual performance velocity and transactional integrity.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card dark:bg-white/5 border border-border dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-primary italic">
            <Calendar className="h-3.5 w-3.5" />
            {new Date().toLocaleDateString("en-KE", { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <div
            key={card.label}
            className="premium-card group hover:scale-[1.02] transition-transform duration-300"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex flex-col gap-4">
              <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center border transition-all group-hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]", card.bg)}>
                <card.icon className={cn("h-6 w-6", card.color)} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-black text-foreground dark:text-white mt-1">{card.value}</p>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{card.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary fill-current" />
              Latest Transactions
            </h2>
            <button className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-foreground dark:text-white transition-colors">
              View All History
            </button>
          </div>
          
          <div className="premium-card !p-0 overflow-hidden">
            {recentSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="h-16 w-16 mb-4 rounded-full bg-card dark:bg-white/5 flex items-center justify-center">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground opacity-20" />
                </div>
                <p className="text-muted-foreground font-bold italic">Initializing... No sale logs found.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {recentSales.map((sale, i) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-5 hover:bg-muted dark:bg-white/[0.02] transition-colors group animate-fade-in"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-card dark:bg-white/5 text-muted-foreground border border-border dark:border-white/5 group-hover:border-primary/20 group-hover:text-primary transition-all">
                        {sale.customer_name?.[0] || "W"}
                      </div>
                      <div>
                        <p className="font-bold text-foreground dark:text-white">{sale.customer_name || "Walk-in Customer"}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                            {new Date(sale.created_at).toLocaleTimeString("en-KE", { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-white/10" />
                          <span className="text-[10px] text-primary font-bold uppercase tracking-widest">{sale.payment_method}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground dark:text-white tracking-tighter">KES {Number(sale.total_amount).toLocaleString()}</p>
                      <div className="flex items-center justify-end gap-1 text-[9px] text-green-400 font-bold uppercase tracking-tighter">
                        <Activity className="h-3 w-3" />
                        Complete
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2 mb-2">
            <Package className="h-5 w-5 text-accent" />
            Daily Goals
          </h2>
          <div className="premium-card space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all" />
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                <span className="text-muted-foreground">Sales Target</span>
                <span className="text-foreground dark:text-white">75%</span>
              </div>
              <div className="h-1.5 w-full bg-card dark:bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[75%] rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                <span className="text-muted-foreground">Revenue Target</span>
                <span className="text-foreground dark:text-white">40%</span>
              </div>
              <div className="h-1.5 w-full bg-card dark:bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-accent w-[40%] rounded-full shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]" />
              </div>
            </div>

            <div className="pt-4 border-t border-border dark:border-white/5">
              <div className="bg-card dark:bg-white/5 rounded-2xl p-4 border border-border dark:border-white/5 group-hover:border-primary/20 transition-colors">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-2">Announcement</p>
                <p className="text-xs text-foreground dark:text-white leading-relaxed">System migrated to Standalone Premium Node. All data persistent locally.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <EntityIntelligenceModal
        open={intelOpen}
        onClose={() => setIntelOpen(false)}
        type="seller"
        data={user}
      />
    </div>
  );
}
