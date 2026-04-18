import { useEffect, useState } from "react";
import { localDb, Sale, Drug, Expense } from "@/lib/db";
import { Link, useNavigate } from "react-router-dom";
import { 
  Package, ShoppingCart, Users, AlertTriangle, TrendingUp, 
  DollarSign, Activity, CalendarDays, ChevronRight, Pill, 
  ArrowRight, BarChart3, Wallet, ShieldCheck, AlertCircle 
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell 
} from "recharts";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import StatsCard from "@/components/StatsCard";
import { Button } from "@/components/ui/button";

function getDaysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null;
  const now = new Date();
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Optimized Data Fetching
  const { data: drugs = [] } = useQuery({ queryKey: ["drugs"], queryFn: () => localDb.drugs.getAll() });
  const { data: sales = [] } = useQuery({ queryKey: ["sales"], queryFn: () => localDb.sales.getAll() });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: () => localDb.users.getAll() });
  const { data: expenses = [] } = useQuery({ queryKey: ["expenses"], queryFn: () => localDb.expenses.getAll() });
  const { data: recentSales = [] } = useQuery({ queryKey: ["recent-sales"], queryFn: () => localDb.sales.getRecent(5) });

  // Dashboard Stats Aggregation
  const stats = (() => {
    const today = new Date().toISOString().split("T")[0];
    const todaySales = sales.filter(s => s.created_at.startsWith(today));
    const activeDrugs = drugs.filter(d => d.is_active);
    const lowStock = activeDrugs.filter(d => d.stock <= (d.reorder_level || 10));
    const expiring = activeDrugs.filter(d => {
      const days = getDaysUntilExpiry(d.expiry_date);
      return days !== null && days > 0 && days <= 90;
    });
    const expired = activeDrugs.filter(d => {
      const days = getDaysUntilExpiry(d.expiry_date);
      return days !== null && days <= 0;
    });

    return {
      totalRevenue: sales.reduce((sum, s) => sum + Number(s.total_amount), 0),
      totalDrugs: activeDrugs.length,
      lowStockCount: lowStock.length,
      todaySalesCount: todaySales.length,
      totalSellers: users.filter(u => u.role === "seller").length,
      expiringCount: expiring.length,
      expiredCount: expired.length,
      lowStockPreview: lowStock.slice(0, 4),
      expiringPreview: expiring.sort((a, b) => (getDaysUntilExpiry(a.expiry_date) ?? 999) - (getDaysUntilExpiry(b.expiry_date) ?? 999)).slice(0, 4)
    };
  })();

  // Chart Data Preparation
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const day = d.toISOString().split("T")[0];
    return {
      name: d.toLocaleDateString('en-US', { weekday: 'short' }),
      revenue: sales.filter(s => s.created_at.startsWith(day)).reduce((sum, s) => sum + Number(s.total_amount), 0),
      expense: expenses.filter(e => e.created_at.startsWith(day)).reduce((sum, e) => sum + Number(e.amount), 0),
    };
  });

  return (
    <div className="space-y-12">
      {/* Cinematic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl md:text-5xl font-black italic tracking-tighter text-foreground uppercase"
          >
            Terminal <span className="aurora-text">Intelligence</span>
          </motion.h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-500 tracking-[0.2em] uppercase">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Node Active
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">
               Grid: LMX-021-PHARMA
            </span>
          </div>
        </div>
        
        <div className="flex gap-4">
           <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={() => navigate("/seller/new-sale")} 
                className="h-14 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center gap-3 border border-primary/50"
              >
                <ShoppingCart size={16} /> Launch POS
              </Button>
           </motion.div>
        </div>
      </div>

      {/* Aniq-Style Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { title: "Net Revenue", value: `UGX ${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, trend: { value: "12.4%", positive: true }, color: "primary" },
          { title: "Global Stock", value: stats.totalDrugs, icon: Package, trend: { value: "Active", positive: true }, color: "accent" },
          { title: "Staff Nodes", value: stats.totalSellers, icon: Users, trend: { value: "Sync", positive: true }, color: "primary" },
          { title: "System Alerts", value: stats.lowStockCount + stats.expiredCount, icon: Activity, trend: { value: "Priority", positive: false }, color: "accent" },
        ].map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Main Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
        
        {/* Financial Flow - Glass Panel */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 premium-card bg-white/[0.01] border-white/5 flex flex-col"
        >
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Financial Velocity</h3>
              <p className="text-xs font-bold text-muted-foreground italic">7-Day Transactional Flow</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-primary">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" /> Revenue
               </div>
               <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-white/20" /> Expense
               </div>
            </div>
          </div>
          
          <div className="flex-1 p-8 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 800 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(9,9,11,0.95)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', color: '#fff' }}
                  itemStyle={{ color: '#fff', fontSize: '10px', textTransform: 'uppercase', fontWeight: 900 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Intelligence feed / Right Rail */}
        <div className="space-y-8">
           {/* Recent Sales Rail */}
           <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.5 }}
             className="premium-card bg-white/[0.01] flex flex-col"
           >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Event Log</h3>
                <ShoppingCart size={14} className="text-primary" />
              </div>
              <div className="p-4 space-y-4">
                {recentSales.map((sale, i) => (
                  <motion.div 
                    key={sale.id}
                    whileHover={{ x: 5 }}
                    className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all cursor-pointer group"
                  >
                    <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-xs text-white/40 group-hover:text-primary transition-colors">
                      {sale.customer_name?.[0] || "W"}
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-[11px] font-black text-white truncate">{sale.customer_name || "Walk-In Entity"}</p>
                       <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-40">{new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[11px] font-black text-primary italic">UGX {sale.total_amount.toLocaleString()}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <Button variant="ghost" className="m-4 h-10 rounded-xl border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white">
                View Full Ledger
              </Button>
           </motion.div>

           {/* Quick Action */}
           <Link to="/admin/drugs" className="block">
             <motion.div 
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               className="p-8 rounded-[2rem] bg-gradient-to-br from-primary to-accent text-white shadow-2xl shadow-primary/20 relative overflow-hidden group"
             >
                <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform">
                   <Package size={80} />
                </div>
                <div className="relative z-10">
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Inventory Bridge</p>
                   <h4 className="text-xl font-black italic uppercase italic tracking-tighter">Manifest Stock</h4>
                   <div className="mt-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest bg-white/20 w-fit px-3 py-1 rounded-full">
                      Sync Now <ArrowRight size={10} />
                   </div>
                </div>
             </motion.div>
           </Link>
        </div>

      </div>
    </div>
  );
}
